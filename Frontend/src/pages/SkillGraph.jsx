import React, { useEffect, useState, useRef, useMemo } from 'react';
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
  GitBranch,
  Layers,
  Check as CheckIcon,
  CheckCircle2,
  AlertCircle,
  Lock,
  Sparkles,
  HelpCircle,
  FolderGit2,
  Target as TargetIcon
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

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
  const [viewMode, setViewMode] = useState('hierarchy'); // 'hierarchy' | 'canvas'

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
        const fetchedRoles = rolesRes.data?.data?.roles || rolesRes.data?.roles || (Array.isArray(rolesRes.data) ? rolesRes.data : []);
        setRoles(fetchedRoles);

        const targetId = user?.targetRoleId?._id || user?.targetRoleId;
        const defaultRole = fetchedRoles.find(r => r._id === targetId) || fetchedRoles[0];
        if (defaultRole) {
          setSelectedRoleId(defaultRole._id);
        }

        const userRes = await api.get(`/users/${user._id}/skills`);
        const fetchedUserSkills = userRes.data?.data?.skills || userRes.data?.skills || (Array.isArray(userRes.data) ? userRes.data : []);
        setUserSkills(fetchedUserSkills);

        try {
          const resList = await api.get('/learning/resources');
          setGlobalResources(resList.data?.data || resList.data || []);
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
        const activeRoleSkills = rSkillsRes.data?.data?.skills || rSkillsRes.data?.skills || (Array.isArray(rSkillsRes.data) ? rSkillsRes.data : []);
        setRoleSkills(activeRoleSkills);

        const selectedRoleDoc = roles.find(r => r._id === selectedRoleId) || { name: 'Target Career' };

        // 2. Get full graph from backend
        const graphRes = await api.get('/skill-graph');
        const graphPayload = graphRes.data?.data || graphRes.data || {};
        const backendNodes = graphPayload?.nodes || [];
        const backendEdges = graphPayload?.edges || [];

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
    if (viewMode !== 'canvas' || nodes.length === 0) return;

    let isMounted = true;
    const width = 900;
    const height = 600;
    const centerX = width / 2;
    const centerY = height / 2;
    const repulsionK = 22000;
    const attractionK = 0.04;
    const centerK = 0.015;

    const tick = () => {
      if (!isMounted) return;

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
        const sId = (edge.sourceId?._id || edge.sourceId || edge.source || '').toString();
        const tId = (edge.targetId?._id || edge.targetId || edge.target || '').toString();
        if (!sId || !tId) return;

        const sourceNode = nodes.find(n => (n._id || n.id || '').toString() === sId);
        const targetNode = nodes.find(n => (n._id || n.id || '').toString() === tId);
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
      if (!isMounted) return;
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

      // Check kinetic energy equilibrium: halt loop if velocities have dissipated
      const totalVelocity = nodes.reduce(
        (sum, n) => sum + Math.abs(n.vx || 0) + Math.abs(n.vy || 0),
        0
      );
      if (totalVelocity < 0.05 && !draggedNode) {
        return;
      }

      if (isMounted) {
        animationRef.current = requestAnimationFrame(tick);
      }
    };

    animationRef.current = requestAnimationFrame(tick);

    return () => {
      isMounted = false;
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [viewMode, edges, draggedNode, nodes.length]);

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
      if (!containerRef.current) return;
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
    ? userSkills.find((us) => {
        const uId = (us.skillId?._id || us.skillId || '').toString();
        const nId = (selectedNode._id || selectedNode.id || '').toString();
        return uId && nId && uId === nId;
      })
    : null;

  // Filter global resources matching active node
  const activeResources = selectedNode
    ? globalResources.filter(r => {
        const rSkillId = (r.skillId?._id || r.skillId || '').toString();
        const nId = (selectedNode._id || selectedNode.id || '').toString();
        return rSkillId && nId && rSkillId === nId;
      })
    : [];

  const selectedRoleDoc = roles.find(r => r._id === selectedRoleId);

  // Calculate real career match percentage strictly clamped between 0 and 100%
  const { matchedSkillsList, missingSkillsList, clampedMatchPercent } = React.useMemo(() => {
    const matched = [];
    const missing = [];

    roleSkills.forEach(rs => {
      const sId = (rs.skillId?._id || rs.skillId || '').toString();
      const sName = rs.skillId?.name || rs.name || 'Skill';
      const sCat = rs.skillId?.category || 'General';
      const uSkill = userSkills.find(us => (us.skillId?._id || us.skillId || '').toString() === sId);
      if (uSkill) {
        matched.push({
          id: sId,
          name: sName,
          category: sCat,
          verified: !!uSkill.verified,
          proficiency: uSkill.proficiency || 1,
          statusText: uSkill.verified ? '✓ Verified' : '✓ Already Know',
          status: 'known'
        });
      } else {
        missing.push({
          id: sId,
          name: sName,
          category: sCat,
          verified: false,
          proficiency: 0,
          statusText: '○ Not Started',
          status: 'needed'
        });
      }
    });

    const total = roleSkills.length || 1;
    const rawPct = Math.round((matched.length / total) * 100);
    const clamped = Math.min(100, Math.max(0, rawPct));

    return {
      matchedSkillsList: matched,
      missingSkillsList: missing,
      clampedMatchPercent: clamped
    };
  }, [roleSkills, userSkills]);

  // Group skills by category / domain for Career Hierarchy Tree View
  const hierarchyDomains = React.useMemo(() => {
    const skillNodes = nodes.filter(n => n.id !== 'you' && n.category !== 'Career');

    const userSkillMap = new Map();
    userSkills.forEach(us => {
      const sId = (us.skillId?._id || us.skillId || '').toString();
      userSkillMap.set(sId, us);
    });

    const prereqMap = new Map();
    edges.forEach(e => {
      if (e.relationshipType === 'prerequisite') {
        const targetId = (e.targetId?._id || e.targetId || '').toString();
        const sourceId = (e.sourceId?._id || e.sourceId || '').toString();
        if (targetId && sourceId) {
          if (!prereqMap.has(targetId)) prereqMap.set(targetId, []);
          prereqMap.get(targetId).push(sourceId);
        }
      }
    });

    const domainsMap = {};
    skillNodes.forEach(node => {
      const nodeId = (node._id || node.id || '').toString();
      const cat = node.category || 'General Engineering';
      if (!domainsMap[cat]) {
        domainsMap[cat] = [];
      }

      const uSkill = userSkillMap.get(nodeId);
      const prereqs = prereqMap.get(nodeId) || [];
      const prereqsSatisfied = prereqs.every(pId => userSkillMap.has(pId));

      let status = 'weak';
      let statusLabel = '○ Not Started';
      if (uSkill) {
        if (uSkill.verified) {
          status = 'strong';
          statusLabel = '✓ Verified';
        } else {
          status = 'in_progress';
          statusLabel = '✓ Already Know';
        }
      } else if (prereqs.length > 0 && !prereqsSatisfied) {
        status = 'locked';
        statusLabel = '○ Prerequisite Pending';
      }

      domainsMap[cat].push({
        ...node,
        userSkill: uSkill,
        status,
        statusLabel,
        verified: uSkill ? !!uSkill.verified : false
      });
    });

    return Object.entries(domainsMap).map(([domainName, skills]) => ({
      domain: domainName,
      skills
    }));
  }, [nodes, userSkills, edges]);

  if (loading) {
    return (
      <div className="h-[calc(100vh-8.5rem)] flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl shadow-inner">
        <LoadingSpinner message="Generating your skill graph network..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-[calc(100vh-8.5rem)] flex items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Unable to Load Skill Graph</h3>
          <p className="text-xs text-slate-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (roles.length === 0) {
    return (
      <div className="h-[calc(100vh-8.5rem)] flex flex-col items-center justify-center bg-slate-900 border border-slate-800 rounded-2xl p-8 text-white text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <Network className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-white">No Career Paths Configured</h3>
        <p className="text-xs text-slate-400 max-w-md">Career trajectories and competency networks are being initialized. Complete a verified assessment or browse roadmaps.</p>
        <Link to="/assessments" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs">
          Take Verified Assessment
        </Link>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8.5rem)] flex gap-6 relative font-sans overflow-hidden">
      
      {/* Graph Visualizer container */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl relative flex flex-col overflow-hidden shadow-inner bg-grid-pattern">
        
        {/* Top Header Controls */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          <div className="flex items-center space-x-2 pointer-events-auto">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-800/95 backdrop-blur-md p-1 border border-slate-700/60 rounded-xl shadow-lg">
              <button
                onClick={() => setViewMode('hierarchy')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'hierarchy'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitBranch className="w-3.5 h-3.5" />
                <span>Career Hierarchy Tree</span>
              </button>
              <button
                onClick={() => setViewMode('canvas')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'canvas'
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Network className="w-3.5 h-3.5" />
                <span>Interactive Network</span>
              </button>
            </div>

            {/* Canvas Zoom Controls (visible only in canvas mode) */}
            {viewMode === 'canvas' && (
              <div className="flex items-center space-x-1 bg-slate-800/95 backdrop-blur-md p-1 border border-slate-700/60 rounded-xl shadow-lg text-white">
                <button
                  onClick={() => setZoom(prev => Math.min(3, prev * 1.1))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoom(prev => Math.max(0.3, prev / 1.1))}
                  className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <button
                  onClick={resetViewport}
                  className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white cursor-pointer"
                  title="Recenter View"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Career Track selector */}
          <div className="flex items-center space-x-2.5 bg-slate-800/95 backdrop-blur-md px-3.5 py-2 border border-slate-700/60 rounded-xl text-white font-bold text-xs shadow-lg pointer-events-auto">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-extrabold">Target Career:</span>
            <select
              value={selectedRoleId}
              onChange={(e) => setSelectedRoleId(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              {roles.map(r => (
                <option key={r._id} value={r._id}>{r.name}</option>
              ))}
            </select>
          </div>
        </div>

        {viewMode === 'hierarchy' ? (
          /* Career Hierarchy Tree View */
          <div className="flex-1 w-full h-full pt-20 pb-8 px-6 overflow-y-auto text-white">
            <div className="max-w-5xl mx-auto space-y-6">
              
              {/* Target Career & Clamped Match Overview Banner */}
              <div className="bg-slate-800/90 border border-slate-700/70 rounded-3xl p-6 shadow-xl space-y-5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider block mb-1">
                      Target Career Track
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-white flex items-center gap-2">
                      <Layers className="w-6 h-6 text-indigo-400" />
                      {selectedRoleDoc?.name || 'Target Career'}
                    </h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Evaluate your current demonstrated competencies against industry requirements for this role.
                    </p>
                  </div>

                  {/* Compatibility Score */}
                  <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-700/80 px-4 py-3 rounded-2xl shrink-0">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block">Job Match</span>
                      <span className="text-2xl font-black text-indigo-400">{clampedMatchPercent}%</span>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-emerald-400">✓ {matchedSkillsList.length} Demonstrated / Known</span>
                    <span className="text-amber-400">○ {missingSkillsList.length} Skills to Learn</span>
                  </div>
                  <div className="w-full bg-slate-700/80 h-3 rounded-full overflow-hidden p-0.5">
                    <div
                      className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${clampedMatchPercent}%` }}
                    />
                  </div>
                </div>

                {/* Primary Preparation CTAs */}
                <div className="pt-2 border-t border-slate-700/50 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold">
                    <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                      <CheckCircle2 className="w-3 h-3" /> ✓ Already Know
                    </span>
                    <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded-md">
                      <Sparkles className="w-3 h-3" /> → Learning
                    </span>
                    <span className="inline-flex items-center gap-1 text-slate-300 bg-slate-800 border border-slate-700 px-2 py-0.5 rounded-md">
                      ○ Not Started
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to="/interview-prep"
                      className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      <span>Prepare for Interview</span>
                    </Link>
                    <Link
                      to="/assessments"
                      className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Take Assessment</span>
                    </Link>
                    <Link
                      to="/skill-gaps"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                    >
                      <TargetIcon className="w-3.5 h-3.5" />
                      <span>View Skill Gaps</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* YOU KNOW vs YOU NEED TO LEARN Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* YOU KNOW */}
                <div className="bg-slate-800/40 border border-emerald-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                    <h3 className="font-extrabold text-sm text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      YOU KNOW ({matchedSkillsList.length})
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Demonstrated</span>
                  </div>
                  {matchedSkillsList.length === 0 ? (
                    <p className="text-xs text-slate-400 italic py-3">No skills demonstrated yet. Complete assessments or add skills to profile.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {matchedSkillsList.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleNodeClick({ id: s.id, name: s.name, category: s.category })}
                          className="px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-emerald-400 transition-colors"
                        >
                          <span>{s.statusText}</span>
                          <span className="text-white">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* YOU NEED TO LEARN */}
                <div className="bg-slate-800/40 border border-amber-500/30 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                    <h3 className="font-extrabold text-sm text-amber-400 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      YOU NEED TO LEARN ({missingSkillsList.length})
                    </h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Role Requirement</span>
                  </div>
                  {missingSkillsList.length === 0 ? (
                    <p className="text-xs text-emerald-400 font-bold py-3">100% role skill requirements satisfied! Ready for interviews.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {missingSkillsList.map(s => (
                        <div
                          key={s.id}
                          onClick={() => handleNodeClick({ id: s.id, name: s.name, category: s.category })}
                          className="px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:border-indigo-400 transition-colors"
                        >
                          <span className="text-amber-400">{s.statusText}</span>
                          <span className="text-white">{s.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Hierarchy Domains */}
              {hierarchyDomains.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p>No skills mapped to this career track yet.</p>
                </div>
              ) : (
                hierarchyDomains.map((domainGroup) => {
                  const strongCount = domainGroup.skills.filter(s => s.status === 'strong' || s.status === 'in_progress').length;
                  const totalCount = domainGroup.skills.length;
                  const pct = Math.round((strongCount / (totalCount || 1)) * 100);

                  return (
                    <div key={domainGroup.domain} className="bg-slate-800/40 border border-slate-700/50 rounded-2xl p-5 space-y-4">
                      {/* Domain Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/50 pb-3">
                        <div className="flex items-center gap-2.5">
                          <span className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl">
                            <FolderGit2 className="w-4 h-4" />
                          </span>
                          <div>
                            <h3 className="font-bold text-sm text-slate-100">{domainGroup.domain}</h3>
                            <p className="text-[11px] text-slate-400 font-medium">Domain competency track</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-slate-400">
                            {strongCount} / {totalCount} Demonstrated ({pct}%)
                          </span>
                          <div className="w-24 bg-slate-700 h-2 rounded-full overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      </div>

                      {/* Skills Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {domainGroup.skills.map((skill) => {
                          const statusBg =
                            skill.status === 'strong'
                              ? 'bg-emerald-950/30 border-emerald-500/40 hover:border-emerald-500/80'
                              : skill.status === 'in_progress'
                              ? 'bg-indigo-950/30 border-indigo-500/40 hover:border-indigo-500/80'
                              : skill.status === 'locked'
                              ? 'bg-slate-800/20 border-slate-700/40 opacity-70'
                              : 'bg-slate-800/40 border-slate-700 hover:border-slate-600';

                          const statusBadge =
                            skill.status === 'strong' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/40">
                                <CheckCircle2 className="w-3 h-3" /> ✓ Verified
                              </span>
                            ) : skill.status === 'in_progress' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded-full border border-indigo-500/40">
                                <CheckIcon className="w-3 h-3" /> ✓ Already Know
                              </span>
                            ) : skill.status === 'locked' ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                <Lock className="w-3 h-3" /> Prerequisites Locked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full border border-slate-700">
                                ○ Not Started
                              </span>
                            );

                          return (
                            <div
                              key={skill.id}
                              onClick={() => handleNodeClick(skill)}
                              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${statusBg}`}
                            >
                              <div>
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <h4 className="font-bold text-sm text-slate-200 group-hover:text-white">
                                    {skill.name}
                                  </h4>
                                  {statusBadge}
                                </div>
                                {skill.description && (
                                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                                    {skill.description}
                                  </p>
                                )}
                              </div>

                              <div className="pt-2 border-t border-slate-700/40 flex items-center justify-between text-[11px]">
                                <span className="text-slate-400 font-semibold">
                                  {skill.statusLabel}
                                </span>
                                <div className="flex items-center gap-2">
                                  <Link
                                    to={`/interview-prep?tech=${encodeURIComponent(skill.name)}`}
                                    onClick={(e) => e.stopPropagation()}
                                    className="text-indigo-400 hover:text-indigo-300 font-bold text-[10px]"
                                  >
                                    Prep &rarr;
                                  </Link>
                                  {skill.verified ? (
                                    <span className="text-emerald-400 font-bold text-[10px] flex items-center gap-0.5">
                                      <Award className="w-3 h-3" /> Verified
                                    </span>
                                  ) : (
                                    <Link
                                      to="/assessments"
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-emerald-400 hover:text-emerald-300 font-bold text-[10px] underline"
                                    >
                                      Verify &rarr;
                                    </Link>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          /* Interactive Network Canvas View */
          <>
            {/* Legend */}
            <div className="absolute bottom-4 left-4 z-20 bg-slate-800/90 backdrop-blur-md p-3 border border-slate-700/50 rounded-lg text-[9px] font-bold text-slate-300 space-y-2 uppercase tracking-wider">
              <p className="border-b border-slate-700 pb-1 mb-1 text-slate-400">Legend</p>
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
                    const sId = (edge.sourceId?._id || edge.sourceId || edge.source || '').toString();
                    const tId = (edge.targetId?._id || edge.targetId || edge.target || '').toString();
                    if (!sId || !tId) return null;
                    const sourceNode = nodes.find(n => (n._id || n.id || '').toString() === sId);
                    const targetNode = nodes.find(n => (n._id || n.id || '').toString() === tId);
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
                      const sId = (us.skillId?._id || us.skillId || '').toString();
                      const nId = (node._id || node.id || '').toString();
                      return sId && nId && sId === nId;
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
          </>
        )}
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
                <p className="text-xs text-slate-600 leading-relaxed font-semibold">{selectedNode.description}</p>
              </div>
            )}

            <div className="pt-3.5 border-t border-slate-100 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status & Inventory</h4>
              {userSkillMatch ? (
                <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-xs text-emerald-800 font-semibold space-y-1.5">
                  <p className="font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {userSkillMatch.verified ? '✓ Verified by Assessment' : '✓ Already in Your Profile'}
                  </p>
                  <p className="text-[10px] text-emerald-600 font-bold">Experience: {userSkillMatch.yearsOfExperience || 1} yrs</p>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-600 font-semibold space-y-1">
                  <p className="font-bold text-slate-800">○ Not Started</p>
                  <p className="text-[10px] text-slate-500">Not yet added or demonstrated in your profile.</p>
                </div>
              )}
            </div>

            {/* Direct Action CTAs */}
            <div className="pt-3.5 border-t border-slate-100 space-y-2">
              <Link
                to={`/interview-prep?tech=${encodeURIComponent(selectedNode.name)}`}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Prepare for Interview</span>
              </Link>
              <Link
                to="/assessments"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
              >
                <Award className="w-3.5 h-3.5" />
                <span>Take Assessment to Verify</span>
              </Link>
              <Link
                to={`/skills/${selectedNode.id}`}
                className="w-full py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center transition-colors"
              >
                <span>View Full Skill Details &rarr;</span>
              </Link>
            </div>

            {/* Display Learning Resources */}
            <div className="pt-3.5 border-t border-slate-100 space-y-2.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Learning Modules</h4>
              {activeResources.length === 0 ? (
                <p className="text-xs text-slate-400 italic">No learning modules available.</p>
              ) : (
                <div className="space-y-1.5">
                  {activeResources.map((res, index) => (
                    <a
                      key={index}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block p-2 bg-slate-50 border border-slate-100 hover:border-indigo-200 rounded-lg text-xs font-bold text-slate-700 hover:text-indigo-600 transition-colors"
                    >
                      {res.title}
                      <span className="block text-[9px] text-slate-400 font-semibold uppercase">{res.difficulty} &bull; {res.estimatedHours} hrs</span>
                    </a>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-3.5 border-t border-slate-100 space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Related Career Skills</h4>
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
