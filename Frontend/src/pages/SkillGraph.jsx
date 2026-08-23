import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  X,
  Award,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const SkillGraph = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [globalResources, setGlobalResources] = useState([]);

  const [selectedNode, setSelectedNode] = useState(null);
  const [relatedSkills, setRelatedSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState(null);

  const containerRef = useRef(null);
  const animationRef = useRef(null);

  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleSkills, setRoleSkills] = useState([]);

  // Fetch initial base catalogs on mount
  useEffect(() => {
    const fetchBaseData = async () => {
      try {
        setLoading(true);
        setError('');

        const rolesRes = await api.get('/roles');
        const fetchedRoles = rolesRes.data.roles || [];
        setRoles(fetchedRoles);

        const targetId = user?.targetRoleId?._id || user?.targetRoleId;
        const defaultRole = fetchedRoles.find(r => r._id === targetId) || fetchedRoles[0];
        if (defaultRole) {
          setSelectedRoleId(defaultRole._id);
        }

        const userRes = await api.get(`/users/${user._id}/skills`);
        setUserSkills(userRes.data.skills || []);

        try {
          const resList = await api.get('/learning/resources');
          setGlobalResources(resList.data || []);
        } catch (resErr) {
          setGlobalResources([]);
        }
      } catch (err) {
        setError(err.message || 'Failed to retrieve baseline configuration.');
      } finally {
        setLoading(false);
      }
    };
    if (user?._id) {
      fetchBaseData();
    }
  }, [user]);

  // Fetch and build the graph dynamically when selected career track changes
  useEffect(() => {
    const buildFilteredGraph = async () => {
      if (!selectedRoleId) return;
      try {
        setLoading(true);
        setError('');

        // 1. Get required skills for this target career
        const rSkillsRes = await api.get(`/roles/${selectedRoleId}/skills`);
        const activeRoleSkills = rSkillsRes.data.skills || [];
        setRoleSkills(activeRoleSkills);

        const selectedRoleDoc = roles.find(r => r._id === selectedRoleId);
        if (!selectedRoleDoc) return;

        // 2. Get full graph from backend
        const graphRes = await api.get('/skill-graph');
        const backendNodes = graphRes.data?.nodes || [];
        const backendEdges = graphRes.data?.edges || [];

        // Build filtered node set
        const requiredSkillIds = new Set(activeRoleSkills.map(rs => (rs.skillId?._id || rs.skillId || '').toString()));
        const visibleSkillIds = new Set([...requiredSkillIds]);

        // Traverse edges: add prerequisites/related of required skills
        backendEdges.forEach(edge => {
          const src = (edge.source?._id || edge.source || '').toString();
          const tgt = (edge.target?._id || edge.target || '').toString();
          if (requiredSkillIds.has(src) || requiredSkillIds.has(tgt)) {
            if (src) visibleSkillIds.add(src);
            if (tgt) visibleSkillIds.add(tgt);
          }
        });

        const centerX = 450;
        const centerY = 300;

        // Pinned central YOU node
        const youNode = {
          id: 'you',
          name: 'YOU',
          category: 'User',
          x: centerX - 180,
          y: centerY,
          vx: 0,
          vy: 0,
          radius: 38
        };

        // Pinned Career Role node
        const careerNode = {
          id: selectedRoleId,
          name: selectedRoleDoc.name,
          category: 'Career',
          x: centerX + 180,
          y: centerY,
          vx: 0,
          vy: 0,
          radius: 40
        };

        // Skill nodes filtered to only include relevant nodes
        const filteredSkillNodes = backendNodes
          .filter(node => visibleSkillIds.has((node._id || node.id || '').toString()))
          .map((node, index) => {
            const angle = (index / (visibleSkillIds.size || 1)) * 2 * Math.PI;
            const radiusDist = 90 + Math.random() * 50;
            const nodeId = node._id || node.id;
            return {
              ...node,
              id: nodeId,
              x: centerX + radiusDist * Math.cos(angle),
              y: centerY + radiusDist * Math.sin(angle),
              vx: 0,
              vy: 0,
              radius: 34
            };
          });

        const initializedNodes = [youNode, careerNode, ...filteredSkillNodes];
        setNodes(initializedNodes);

        // Core Relationships edges mapping
        const filteredEdges = backendEdges
          .filter(edge => {
            const src = (edge.source?._id || edge.source || '').toString();
            const tgt = (edge.target?._id || edge.target || '').toString();
            return visibleSkillIds.has(src) && visibleSkillIds.has(tgt);
          })
          .map(edge => ({
            ...edge,
            sourceId: edge.source?._id || edge.source,
            targetId: edge.target?._id || edge.target
          }));

        // Connections from YOU to user possessed skills in this filtered set
        const possessesEdges = userSkills
          .filter(us => {
            const sId = (us.skillId?._id || us.skillId || '').toString();
            return visibleSkillIds.has(sId);
          })
          .map((us, index) => {
            const sId = us.skillId?._id || us.skillId;
            return {
              id: `you-possesses-${sId}-${index}`,
              sourceId: 'you',
              targetId: sId,
              relationshipType: 'possesses'
            };
          });

        // Connections from required skills to target Career node
        const requiredEdges = activeRoleSkills.map((rs, index) => {
          const sId = rs.skillId?._id || rs.skillId;
          return {
            id: `career-req-${sId}-${index}`,
            sourceId: sId,
            targetId: selectedRoleId,
            relationshipType: 'required'
          };
        });

        setEdges([...filteredEdges, ...possessesEdges, ...requiredEdges]);
      } catch (err) {
        setError(err.message || 'Failed to sync skill graph network.');
      } finally {
        setLoading(false);
      }
    };
    buildFilteredGraph();
  }, [selectedRoleId, userSkills, roles]);

  useEffect(() => {
    if (nodes.length === 0) return;

    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const repulsionK = 22000;
    const attractionK = 0.04;
    const centerK = 0.015;

    const tick = () => {
      // Pin central "YOU" node on the left
      const you = nodes.find(n => n.id === 'you');
      if (you) {
        you.x = centerX - 180;
        you.y = centerY;
        you.vx = 0;
        you.vy = 0;
      }

      // Pin Target Career node on the right
      const careerNode = nodes.find(n => n.category === 'Career');
      if (careerNode) {
        careerNode.x = centerX + 180;
        careerNode.y = centerY;
        careerNode.vx = 0;
        careerNode.vy = 0;
      }

      // Helper function to check if a node is pinned/static
      const isStatic = (node) => {
        return node.id === 'you' || node.category === 'Career';
      };

      // 1. Repulsion Forces
      for (let i = 0; i < nodes.length; i++) {
        const nodeA = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const nodeB = nodes[j];
          const dx = nodeA.x - nodeB.x || (Math.random() - 0.5) * 5;
          const dy = nodeA.y - nodeB.y || (Math.random() - 0.5) * 5;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 1;

          if (dist < 340) {
            const force = repulsionK / (distSq + 200);
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            if (nodeA !== draggedNode && !isStatic(nodeA)) {
              nodeA.vx += fx;
              nodeA.vy += fy;
            }
            if (nodeB !== draggedNode && !isStatic(nodeB)) {
              nodeB.vx -= fx;
              nodeB.vy -= fy;
            }
          }

          // Strict collision resolution to prevent overlap
          const minDist = nodeA.radius + nodeB.radius + 24;
          if (dist < minDist) {
            const overlap = minDist - dist;
            const pushX = (dx / dist) * overlap * 0.5;
            const pushY = (dy / dist) * overlap * 0.5;

            if (nodeA !== draggedNode && !isStatic(nodeA)) {
              nodeA.x += pushX;
              nodeA.y += pushY;
            }
            if (nodeB !== draggedNode && !isStatic(nodeB)) {
              nodeB.x -= pushX;
              nodeB.y -= pushY;
            }
          }
        }
      }

      // 2. Attraction Forces
      edges.forEach((edge) => {
        const sourceNode = nodes.find(n => n.id.toString() === edge.sourceId.toString());
        const targetNode = nodes.find(n => n.id.toString() === edge.targetId.toString());
        if (!sourceNode || !targetNode) return;

        const dx = targetNode.x - sourceNode.x;
        const dy = targetNode.y - sourceNode.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;

        // "possesses" connections keep user's skills closer to YOU, "required" keeps them closer to Career
        const targetLen = edge.relationshipType === 'possesses' ? 120 : edge.relationshipType === 'required' ? 120 : 150;
        const force = attractionK * (dist - targetLen);
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        if (sourceNode !== draggedNode && !isStatic(sourceNode)) {
          sourceNode.vx += fx;
          sourceNode.vy += fy;
        }
        if (targetNode !== draggedNode && !isStatic(targetNode)) {
          targetNode.vx -= fx;
          targetNode.vy -= fy;
        }
      });

      // 3. Centering Gravity
      nodes.forEach((node) => {
        if (node === draggedNode || isStatic(node)) return;
        node.vx -= centerK * (node.x - centerX);
        node.vy -= centerK * (node.y - centerY);
      });

      // 4. Update coordinates
      setNodes((prevNodes) =>
        prevNodes.map((n) => {
          if (n === draggedNode || isStatic(n)) return n;
          const damping = 0.8;
          const newVx = n.vx * damping;
          const newVy = n.vy * damping;

          const maxSpeed = 12;
          const speed = Math.sqrt(newVx * newVx + newVy * newVy) || 1;
          const finalVx = speed > maxSpeed ? (newVx / speed) * maxSpeed : newVx;
          const finalVy = speed > maxSpeed ? (newVy / speed) * maxSpeed : newVy;

          return {
            ...n,
            vx: finalVx,
            vy: finalVy,
            x: Math.max(80, Math.min(width - 80, n.x + finalVx)),
            y: Math.max(80, Math.min(height - 80, n.y + finalVy))
          };
        })
      );

      animationRef.current = requestAnimationFrame(tick);
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [edges, draggedNode, nodes.length]);

  const handleMouseDown = (e) => {
    if (e.target.tagName === 'svg' || e.target.id === 'grid-bg') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
    } else if (draggedNode && draggedNode.id !== 'you') {
      const rect = containerRef.current.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left - pan.x) / zoom;
      const mouseY = (e.clientY - rect.top - pan.y) / zoom;

      draggedNode.x = mouseX;
      draggedNode.y = mouseY;
      draggedNode.vx = 0;
      draggedNode.vy = 0;
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNode(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 1.1;
    let newZoom = zoom;
    if (e.deltaY < 0) {
      newZoom = Math.min(3, zoom * zoomFactor);
    } else {
      newZoom = Math.max(0.3, zoom / zoomFactor);
    }
    setZoom(newZoom);
  };

  const handleNodeClick = async (node) => {
    if (node.id === 'you' || node.category === 'Career') return;
    setSelectedNode(node);
    setDrawerOpen(true);
    try {
      const res = await api.get(`/skill-graph/skills/${node.id}/related`);
      setRelatedSkills(res.data.relatedSkills || []);
    } catch (err) {
      setRelatedSkills([]);
    }
  };

  const resetViewport = () => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  };

  const getCategoryColor = (cat) => {
    const lower = cat.toLowerCase();
    if (lower === 'user') return { fill: '#ecfdf5', stroke: '#10b981', text: '#064e3b', dot: '#10b981' }; // Deep emerald for YOU
    if (lower === 'career') return { fill: '#e0e7ff', stroke: '#6366f1', text: '#1e1b4b', dot: '#6366f1' }; // Indigo for Target Career
    if (lower.includes('front')) return { fill: '#e0e7ff', stroke: '#4f46e5', text: '#312e81', dot: '#4f46e5' }; // Indigo
    if (lower.includes('back')) return { fill: '#f5f3ff', stroke: '#8b5cf6', text: '#5b21b6', dot: '#8b5cf6' }; // Purple
    if (lower.includes('database') || lower.includes('data')) return { fill: '#e0f2fe', stroke: '#0ea5e9', text: '#075985', dot: '#0ea5e9' }; // Sky
    if (lower.includes('devops') || lower.includes('cloud')) return { fill: '#ccfbf1', stroke: '#0d9488', text: '#115e59', dot: '#0d9488' }; // Teal
    if (lower.includes('tool') || lower.includes('git')) return { fill: '#f1f5f9', stroke: '#64748b', text: '#334155', dot: '#64748b' }; // Slate
    return { fill: '#fff1f2', stroke: '#f43f5e', text: '#9f1239', dot: '#f43f5e' }; // Coral
  };

  const getRelationshipColor = (type) => {
    switch (type) {
      case 'possesses': return '#10b981'; // Emerald
      case 'required': return '#6366f1'; // Indigo
      case 'prerequisite': return '#f59e0b'; // Amber
      case 'specialization': return '#8b5cf6'; // Purple
      case 'related': return '#64748b'; // Slate
      default: return '#94a3b8';
    }
  };

  const userSkillMatch = selectedNode
    ? userSkills.find((us) => (us.skillId?._id || us.skillId).toString() === selectedNode.id.toString())
    : null;

  // Filter global resources matching active node
  const activeResources = selectedNode
    ? globalResources.filter(r => {
        const rSkillId = r.skillId?._id || r.skillId;
        return rSkillId && rSkillId.toString() === selectedNode.id.toString();
      })
    : [];

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-6 relative font-sans overflow-hidden">
      
      {/* Graph Visualizer container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl relative flex flex-col overflow-hidden shadow-inner bg-grid-pattern">
        
        {/* Controls */}
        <div className="absolute top-4 left-4 z-20 flex items-center space-x-2.5 bg-slate-800/90 backdrop-blur-md p-1.5 border border-slate-700/50 rounded-lg text-white">
          <button
            onClick={() => setZoom(prev => Math.min(3, prev * 1.1))}
            className="p-1.5 hover:bg-slate-750 rounded transition-colors cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(prev => Math.max(0.3, prev / 1.1))}
            className="p-1.5 hover:bg-slate-750 rounded transition-colors cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetViewport}
            className="p-1.5 hover:bg-slate-750 rounded transition-colors text-slate-400 hover:text-white cursor-pointer"
            title="Recenter View"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>

        {/* Dropdown Selector */}
        <div className="absolute top-4 right-4 z-20 flex items-center space-x-2.5 bg-slate-800/90 backdrop-blur-md px-3 py-1.5 border border-slate-700/50 rounded-lg text-white font-bold text-xs">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">Map Career Track:</span>
          <select
            value={selectedRoleId}
            onChange={(e) => setSelectedRoleId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            {roles.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>

        {/* Legend */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-800/90 backdrop-blur-md p-3 border border-slate-700/50 rounded-lg text-[9px] font-bold text-slate-350 space-y-2 uppercase tracking-wider">
          <p className="border-b border-slate-750 pb-1 mb-1 text-slate-400">Legend</p>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-1 bg-[#10b981] rounded" />
            <span>Possessed Connection</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-1 bg-[#6366f1] rounded" />
            <span>Required Connection</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-1 bg-[#f59e0b] rounded" />
            <span>Prerequisite link</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-1 bg-[#8b5cf6] rounded" />
            <span>Specialization link</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-1 bg-[#64748b] rounded" />
            <span>Related connection</span>
          </div>
        </div>

        {/* SVG Drawing Canvas */}
        <div
          ref={containerRef}
          className="flex-1 w-full h-full cursor-grab active:cursor-grabbing select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <svg className="w-full h-full" id="svg-canvas">
            <defs>
              {edges.map((edge, idx) => {
                const color = getRelationshipColor(edge.relationshipType);
                return (
                  <marker
                    key={`marker-${edge.id}-${idx}`}
                    id={`arrow-${edge.id}-${idx}`}
                    viewBox="0 0 10 10"
                    refX={edge.relationshipType === 'possesses' ? "26" : "22"}
                    refY="5"
                    markerWidth="5"
                    markerHeight="5"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill={color} />
                  </marker>
                );
              })}
            </defs>
            <rect width="100%" height="100%" fill="transparent" id="grid-bg" />

            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {edges.map((edge, idx) => {
                const sourceNode = nodes.find(n => n.id.toString() === edge.sourceId.toString());
                const targetNode = nodes.find(n => n.id.toString() === edge.targetId.toString());
                if (!sourceNode || !targetNode) return null;

                const color = getRelationshipColor(edge.relationshipType);

                return (
                  <line
                    key={`${edge.id}-${idx}`}
                    x1={sourceNode.x}
                    y1={sourceNode.y}
                    x2={targetNode.x}
                    y2={targetNode.y}
                    stroke={color}
                    strokeWidth={edge.relationshipType === 'possesses' ? 2 : edge.relationshipType === 'prerequisite' ? 2.5 : 1.5}
                    strokeDasharray={edge.relationshipType === 'related' || edge.relationshipType === 'possesses' ? '4,4' : 'none'}
                    markerEnd={`url(#arrow-${edge.id}-${idx})`}
                    opacity={selectedNode ? (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id ? 0.95 : 0.12) : 0.7}
                    className="transition-all duration-300"
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const colors = getCategoryColor(node.category);
                const isSelected = selectedNode && selectedNode.id === node.id;
                const hasSkill = userSkills.some(us => {
                  const sId = us.skillId?._id || us.skillId;
                  return sId && sId.toString() === node.id.toString();
                });

                return (
                  <g
                    key={node.id}
                    transform={`translate(${node.x}, ${node.y})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNodeClick(node);
                    }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setDraggedNode(node);
                    }}
                    className="cursor-pointer group"
                  >
                    {/* Ring highlight for selected nodes */}
                    {isSelected && (
                      <circle
                        r={node.radius + 8}
                        fill="none"
                        stroke="#6366f1"
                        strokeWidth="2"
                        className="animate-ping opacity-35"
                      />
                    )}

                    {/* Competency marker ring */}
                    {hasSkill && node.id !== 'you' && (
                      <circle
                        r={node.radius + 4}
                        fill="none"
                        stroke="#10b981"
                        strokeWidth="2.5"
                        className="opacity-90"
                      />
                    )}

                    <circle
                      r={node.radius}
                      fill={colors.fill}
                      stroke={isSelected ? '#ffffff' : colors.stroke}
                      strokeWidth={isSelected ? 3.5 : 2}
                      className="group-hover:scale-105 transition-transform duration-200 shadow-md"
                    />

                    {/* Label wrap logic */}
                    <text
                      textAnchor="middle"
                      fontSize="9.5px"
                      fontWeight="black"
                      fill={colors.text}
                      pointerEvents="none"
                      className="select-none font-sans uppercase tracking-wide"
                    >
                      {node.id === 'you' ? (
                        <tspan x="0" dy=".3em" fontSize="13px" fontWeight="black" fill="#064e3b" letterSpacing="0.05em">YOU</tspan>
                      ) : node.name.length > 10 ? (
                        <>
                          <tspan x="0" dy="-0.2em">{node.name.substring(0, 9)}</tspan>
                          <tspan x="0" dy="1.1em">{node.name.substring(9)}</tspan>
                        </>
                      ) : (
                        <tspan x="0" dy=".3em">{node.name}</tspan>
                      )}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Floating overlay card for selected skill details */}
      {drawerOpen && selectedNode && (
        <div className="absolute top-6 right-6 w-80 bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl flex flex-col justify-between max-h-[90%] z-20 animate-in zoom-in-95 duration-200">
          <div className="space-y-5 overflow-y-auto pr-1">
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="inline-flex px-2 py-0.5 rounded text-[9px] font-bold bg-indigo-50 text-indigo-700 uppercase tracking-wider mb-1.5">
                  {selectedNode.category}
                </span>
                <h3 className="font-extrabold text-slate-800 text-base tracking-tight leading-tight">
                  {selectedNode.name}
                </h3>
              </div>
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selectedNode.description && (
              <div className="space-y-1">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Description</h4>
                <p className="text-xs text-slate-655 leading-relaxed font-semibold">{selectedNode.description}</p>
              </div>
            )}

            <div className="pt-3.5 border-t border-slate-100 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">My Inventory Status</h4>
              {userSkillMatch ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-semibold space-y-1.5">
                  <p>Current Proficiency: Level {userSkillMatch.proficiency} / 5</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Experience: {userSkillMatch.yearsOfExperience} yrs</p>
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Not currently added to your personal profile.</p>
              )}
            </div>

            {/* Display Learning Resources */}
            <div className="pt-3.5 border-t border-slate-100 space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning courses</h4>
              {activeResources.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No learning courses available.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeResources.map((res, index) => (
                    <a
                      key={index}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-slate-50 border border-slate-100 hover:border-indigo-200 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-650 transition-colors"
                    >
                      {res.title}
                      <span className="block text-[9px] text-slate-400 font-semibold uppercase">{res.difficulty} &bull; {res.estimatedHours} hrs</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3.5 border-t border-slate-100 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Connections</h4>
              {relatedSkills.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No relationships mapped.</p>
              ) : (
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {relatedSkills.slice(0, 5).map((rel, index) => (
                    <div key={index} className="flex items-center justify-between text-xs p-2 bg-slate-50 border border-slate-100 rounded">
                      <span className="font-bold text-slate-700">{rel.skill?.name}</span>
                      <span className="text-[9px] uppercase font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {rel.relationshipType}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillGraph;
