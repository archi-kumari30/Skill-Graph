import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  Info,
  Lock,
  CheckSquare
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

// Pre-defined learning topics catalog with titles, descriptions, links, and prerequisites
const LEARNING_TOPICS_CATALOG = {
  'HTML': [
    { title: 'HTML Introduction', description: 'Understand standard HTML markup foundations and document structures.', prerequisite: null, link: 'https://www.w3schools.com/html/html_intro.asp' },
    { title: 'HTML Elements', description: 'Master HTML tags, nesting rules, and basic tags.', prerequisite: 'HTML Introduction', link: 'https://www.w3schools.com/html/html_elements.asp' },
    { title: 'HTML Attributes', description: 'Learn class, src, href, id, and tag configurations.', prerequisite: 'HTML Elements', link: 'https://www.w3schools.com/html/html_attributes.asp' },
    { title: 'HTML Headings', description: 'Organize text structures with headings, paragraphs, and lists.', prerequisite: 'HTML Elements', link: 'https://www.w3schools.com/html/html_headings.asp' },
    { title: 'HTML Forms', description: 'Understand checkboxes, inputs, textareas, and submit behaviors.', prerequisite: 'HTML Attributes', link: 'https://www.w3schools.com/html/html_forms.asp' },
    { title: 'HTML Tables', description: 'Map out grid and matrix data using standard tr/td cells.', prerequisite: 'HTML Elements', link: 'https://www.w3schools.com/html/html_tables.asp' },
    { title: 'HTML Semantic HTML', description: 'Improve SEO and accessibility using article, section, and nav elements.', prerequisite: 'HTML Elements', link: 'https://www.w3schools.com/html/html_semantic.asp' }
  ],
  'CSS': [
    { title: 'CSS Introduction', description: 'Understand styling syntax, link rules, and styles integration.', prerequisite: null, link: 'https://www.w3schools.com/css/css_intro.asp' },
    { title: 'CSS Selectors', description: 'Target class, id, attribute, and pseudo selectors.', prerequisite: 'CSS Introduction', link: 'https://www.w3schools.com/css/css_selectors.asp' },
    { title: 'CSS Colors', description: 'Master hexadecimal, RGB, and HSL color styling.', prerequisite: 'CSS Selectors', link: 'https://www.w3schools.com/css/css_colors.asp' },
    { title: 'CSS Box Model', description: 'Understand margins, borders, paddings, and content sizing.', prerequisite: 'CSS Selectors', link: 'https://www.w3schools.com/css/css_boxmodel.asp' },
    { title: 'CSS Flexbox', description: 'Build flexible one-dimensional layouts.', prerequisite: 'CSS Box Model', link: 'https://www.w3schools.com/css/css3_flexbox.asp' },
    { title: 'CSS Grid', description: 'Implement multi-dimensional layout systems.', prerequisite: 'CSS Box Model', link: 'https://www.w3schools.com/css/css_grid.asp' },
    { title: 'CSS Responsive Design', description: 'Create fluid responsive grids using media queries.', prerequisite: 'CSS Flexbox', link: 'https://www.w3schools.com/css/css_rwd_intro.asp' }
  ],
  'JavaScript': [
    { title: 'JavaScript Variables', description: 'Learn scope boundaries using const, let, and var declarations.', prerequisite: null, link: 'https://www.w3schools.com/js/js_variables.asp' },
    { title: 'JavaScript Data Types', description: 'Work with strings, arrays, booleans, and complex structures.', prerequisite: 'JavaScript Variables', link: 'https://www.w3schools.com/js/js_datatypes.asp' },
    { title: 'JavaScript Functions', description: 'Write basic parameter inputs and arrow callback utilities.', prerequisite: 'JavaScript Variables', link: 'https://www.w3schools.com/js/js_functions.asp' },
    { title: 'JavaScript Arrays', description: 'Traverse, filter, map, and reduce collection lists.', prerequisite: 'JavaScript Functions', link: 'https://www.w3schools.com/js/js_arrays.asp' },
    { title: 'JavaScript Objects', description: 'Instantiate and access properties, values, and functions.', prerequisite: 'JavaScript Arrays', link: 'https://www.w3schools.com/js/js_objects.asp' },
    { title: 'JavaScript DOM', description: 'Query DOM trees and dynamically alter structures.', prerequisite: 'JavaScript Objects', link: 'https://www.w3schools.com/js/js_htmldom.asp' },
    { title: 'JavaScript Events', description: 'Listen to clicks, keyboard events, and load triggers.', prerequisite: 'JavaScript DOM', link: 'https://www.w3schools.com/js/js_events.asp' },
    { title: 'JavaScript Async JavaScript', description: 'Coordinate timeouts, intervals, and async operations.', prerequisite: 'JavaScript Events', link: 'https://www.w3schools.com/js/js_callback.asp' },
    { title: 'JavaScript Promises', description: 'Handle resolves, rejects, and async/await wrappers.', prerequisite: 'JavaScript Async JavaScript', link: 'https://www.w3schools.com/js/js_promise.asp' },
    { title: 'JavaScript Fetch API', description: 'Fetch and parse data from external API servers.', prerequisite: 'JavaScript Promises', link: 'https://www.w3schools.com/js/js_api_intro.asp' }
  ],
  'React': [
    { title: 'React Introduction', description: 'Establish basic project scaffolds and virtual DOM structures.', prerequisite: null, link: 'https://react.dev/learn' },
    { title: 'React Components', description: 'Build reusable JSX template structures.', prerequisite: 'React Introduction', link: 'https://react.dev/learn/your-first-component' },
    { title: 'React Props', description: 'Pass parameter values down components tree.', prerequisite: 'React Components', link: 'https://react.dev/learn/passing-props-to-a-component' },
    { title: 'React State', description: 'Utilize useState hook to manage responsive interface scopes.', prerequisite: 'React Props', link: 'https://react.dev/learn/state-a-components-memory' },
    { title: 'React Events', description: 'Attach event listeners inside JSX.', prerequisite: 'React State', link: 'https://react.dev/learn/responding-to-events' },
    { title: 'React Hooks', description: 'Understand core execution rules for hooks.', prerequisite: 'React State', link: 'https://react.dev/reference/react' },
    { title: 'React useEffect', description: 'Establish component lifecycle updates, dependencies, and cleanups.', prerequisite: 'React Hooks', link: 'https://react.dev/reference/react/useEffect' },
    { title: 'React API Integration', description: 'Query external APIs and map responses into components state.', prerequisite: 'React useEffect', link: 'https://react.dev/reference/react/useState' }
  ],
  'Node.js': [
    { title: 'Node.js Introduction', description: 'Basics of V8 runtime environment parameters.', prerequisite: null, link: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs' },
    { title: 'Node.js Modules', description: 'Learn require, exports, and module imports.', prerequisite: 'Node.js Introduction', link: 'https://nodejs.org/api/modules.html' },
    { title: 'Node.js npm', description: 'Install packages and configure package.json.', prerequisite: 'Node.js Modules', link: 'https://docs.npmjs.com/' },
    { title: 'Node.js File System', description: 'Manage local reads and writes using the fs module.', prerequisite: 'Node.js npm', link: 'https://nodejs.org/api/fs.html' },
    { title: 'Node.js HTTP', description: 'Create local low-level server socket handlers.', prerequisite: 'Node.js File System', link: 'https://nodejs.org/api/http.html' },
    { title: 'Node.js Events', description: 'Attach custom event emitter listeners.', prerequisite: 'Node.js Introduction', link: 'https://nodejs.org/api/events.html' },
    { title: 'Node.js Express', description: 'Set up Express servers.', prerequisite: 'Node.js HTTP', link: 'https://expressjs.com/' }
  ],
  'Express': [
    { title: 'Express Introduction', description: 'Install Express frameworks and initialize servers.', prerequisite: null, link: 'https://expressjs.com/en/starter/installing.html' },
    { title: 'Express Routing', description: 'Map paths and query triggers.', prerequisite: 'Express Introduction', link: 'https://expressjs.com/en/guide/routing.html' },
    { title: 'Express Middleware', description: 'Understand interceptors, body parsing, and request logging.', prerequisite: 'Express Routing', link: 'https://expressjs.com/en/guide/using-middleware.html' },
    { title: 'Express REST APIs', description: 'Design standardized CRUD resource endpoints.', prerequisite: 'Express Middleware', link: 'https://expressjs.com/en/guide/routing.html' },
    { title: 'Express Error Handling', description: 'Implement unified catch-all error handling middleware.', prerequisite: 'Express Routing', link: 'https://expressjs.com/en/guide/error-handling.html' },
    { title: 'Express Authentication', description: 'Secure route access using JWT authorization parsing.', prerequisite: 'Express Middleware', link: 'https://expressjs.com/en/guide/routing.html' }
  ],
  'MongoDB': [
    { title: 'MongoDB Documents', description: 'Design flexible BSON document properties.', prerequisite: null, link: 'https://www.mongodb.com/docs/manual/core/document/' },
    { title: 'MongoDB Collections', description: 'Group documents in namespace collections.', prerequisite: 'MongoDB Documents', link: 'https://www.mongodb.com/docs/manual/core/databases-and-collections/' },
    { title: 'MongoDB CRUD', description: 'Perform inserts, queries, updates, and deletes.', prerequisite: 'MongoDB Collections', link: 'https://www.mongodb.com/docs/manual/crud/' },
    { title: 'MongoDB Queries', description: 'Filter records using query operators.', prerequisite: 'MongoDB CRUD', link: 'https://www.mongodb.com/docs/manual/tutorial/query-documents/' },
    { title: 'MongoDB Indexes', description: 'Accelerate reads using field-level indexing.', prerequisite: 'MongoDB Queries', link: 'https://www.mongodb.com/docs/manual/indexes/' },
    { title: 'MongoDB Aggregation', description: 'Construct multi-stage processing pipelines.', prerequisite: 'MongoDB Queries', link: 'https://www.mongodb.com/docs/manual/aggregation/' }
  ],
  'Git': [
    { title: 'Git Commands (Init, Add, Commit)', description: 'Initialize local repositories, stage edits, and commit changes.', prerequisite: null, link: 'https://git-scm.com/doc' },
    { title: 'Git Branching & Merging', description: 'Create local branches, merge branches, and resolve conflicts.', prerequisite: 'Git Commands (Init, Add, Commit)', link: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging' },
    { title: 'Git Remote Repositories', description: 'Push local commits and pull updates from remote repositories.', prerequisite: 'Git Branching & Merging', link: 'https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes' },
    { title: 'Git Pull Requests', description: 'Review branches, approve modifications, and merge remote streams.', prerequisite: 'Git Remote Repositories', link: 'https://git-scm.com/doc' }
  ]
};

const DEFAULT_TOPICS = [
  { title: 'Topic Foundation Basics', description: 'Understand basic foundational concepts and prerequisite definitions.', prerequisite: null, link: 'https://www.w3schools.com/' },
  { title: 'Topic Core Operations', description: 'Implement core concepts in simple tasks.', prerequisite: 'Topic Foundation Basics', link: 'https://www.w3schools.com/' },
  { title: 'Topic Advanced Optimization', description: 'Perform optimizations and configure layouts.', prerequisite: 'Topic Core Operations', link: 'https://www.w3schools.com/' }
];

const Progress = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [roles, setRoles] = useState([]);
  const [selectedRoleId, setSelectedRoleId] = useState('');
  const [roleSkills, setRoleSkills] = useState([]);
  const [userSkills, setUserSkills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [error, setError] = useState('');
  
  // Completed topics map stored in database (keyed as "skillId_topicTitle")
  const [completedTopics, setCompletedTopics] = useState({});

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Get roles list
      const rolesRes = await api.get('/roles');
      const fetchedRoles = rolesRes.data.roles || [];
      setRoles(fetchedRoles);

      // Default selected role
      const targetId = user?.targetRoleId?._id || user?.targetRoleId;
      const defaultRole = fetchedRoles.find(r => r._id === targetId) || fetchedRoles[0];
      if (defaultRole) {
        setSelectedRoleId(defaultRole._id);
      }

      // Get user skills
      const skillsRes = await api.get(`/users/${user._id}/skills`);
      setUserSkills(skillsRes.data.skills || []);

      // Get completed topics from the backend Mongoose database
      const progressRes = await api.get('/learning/topics/progress');
      const backendTopics = progressRes.data?.completedTopics || [];
      
      const topicsMap = {};
      backendTopics.forEach(tp => {
        const sId = tp.skillId?._id || tp.skillId;
        if (sId && tp.topicTitle) {
          topicsMap[`${sId}_${tp.topicTitle}`] = true;
        }
      });
      setCompletedTopics(topicsMap);
    } catch (err) {
      setError(err.message || 'Failed to retrieve initial learning data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchInitialData();
    }
  }, [user]);

  // Fetch career-specific recommended skills roadmap when selected role changes
  useEffect(() => {
    const fetchRoleSkillsData = async () => {
      if (!selectedRoleId || !user?._id) return;
      try {
        setLoadingSkills(true);
        const res = await api.get(`/recommendations/users/${user._id}/roles/${selectedRoleId}`);
        const recs = res.data.recommendations || [];
        
        // Map recommendation data to match standard roleSkills schema shape for JSX compatibility
        const mappedRoleSkills = recs.map(rec => ({
          _id: rec.skill.id,
          skillId: {
            _id: rec.skill.id,
            name: rec.skill.name,
            category: rec.skill.category
          },
          requiredProficiency: rec.targetProficiency,
          importance: rec.reason.includes('Critical') ? 'required' : (rec.reason.includes('Important') ? 'important' : 'nice_to_have'),
          learningResources: rec.learningResources || [],
          reason: rec.reason,
          priority: rec.priority
        }));
        
        setRoleSkills(mappedRoleSkills);
      } catch (err) {
        setRoleSkills([]);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchRoleSkillsData();
  }, [selectedRoleId, user]);

  const handleRoleChange = async (roleId) => {
    setSelectedRoleId(roleId);
    try {
      const res = await api.put(`/users/${user._id}`, { targetRoleId: roleId });
      if (res.data?.user) {
        updateUserProfile(res.data.user);
      }
    } catch (err) {
      console.error('Failed to sync target career changes', err);
    }
  };

  const handleStartResource = async (resourceId, url) => {
    try {
      await api.post(`/learning/${resourceId}/start`);
    } catch (err) {
      console.error('Failed to start resource tracking:', err);
    }
    window.open(url, '_blank');
  };

  const toggleTopic = async (skillId, topicTitle) => {
    const key = `${skillId}_${topicTitle}`;
    const wasCompleted = !!completedTopics[key];
    const newCompletedState = !wasCompleted;

    // Optimistic UI update
    setCompletedTopics(prev => ({ ...prev, [key]: newCompletedState }));

    try {
      await api.post('/learning/topics/complete', {
        skillId,
        topicTitle,
        completed: newCompletedState
      });
      // Fetch fresh skills summary to update proficiencies or scores if necessary
      const skillsRes = await api.get(`/users/${user._id}/skills`);
      setUserSkills(skillsRes.data.skills || []);
    } catch (err) {
      // Rollback on failure
      setCompletedTopics(prev => ({ ...prev, [key]: wasCompleted }));
      alert(err.message || 'Failed to update topic completion progress in database.');
    }
  };

  // Get learning topics list for a skill name
  const getTopicsForSkill = (skillName) => {
    return LEARNING_TOPICS_CATALOG[skillName] || DEFAULT_TOPICS;
  };

  if (loading) return <LoadingSpinner message="Assembling custom learning pathways..." />;
  if (error) return <ErrorState message={error} onRetry={fetchInitialData} />;

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto relative">
      
      {/* 1. Header with dropdown select */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm bg-grid-pattern">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Learning Hub</h1>
          <p className="text-xs text-slate-450 font-semibold">Structured, prerequisite-aware learning paths based on your career requirements.</p>
        </div>

        <div className="mt-4 sm:mt-0 flex items-center space-x-3.5">
          <span className="text-[10px] uppercase font-bold text-slate-400">Target Track:</span>
          <select
            value={selectedRoleId}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-3.5 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white cursor-pointer"
          >
            {roles.map(r => (
              <option key={r._id} value={r._id}>{r.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Structured Learning Topics List */}
      {loadingSkills ? (
        <LoadingSpinner message="Calculating course criteria parameters..." />
      ) : roleSkills.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-sm">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="font-extrabold text-slate-800 text-base">All Requirements Met!</h4>
          <p className="text-xs text-slate-455 font-semibold leading-relaxed">
            You have satisfied all core required competencies and proficiencies for the <strong>{roles.find(r => r._id === selectedRoleId)?.name || 'selected'}</strong> career track.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {roleSkills.map((rs, index) => {
            const skillDoc = rs.skillId;
            if (!skillDoc) return null;
            
            const userSkillMatch = userSkills.find(us => (us.skillId?._id || us.skillId).toString() === skillDoc._id.toString());
            const userProficiency = userSkillMatch ? userSkillMatch.proficiency : 0;
            
            const topics = getTopicsForSkill(skillDoc.name);
            
            // Calculate completed count
            const completedCount = topics.filter(t => completedTopics[`${skillDoc._id}_${t.title}`]).length;
            const totalCount = topics.length;
            const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            let status = 'NOT STARTED';
            if (progressPct === 100) {
              status = 'COMPLETED';
            } else if (progressPct > 0) {
              status = 'IN PROGRESS';
            }

            return (
              <div key={skillDoc._id} className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-6 relative overflow-hidden">
                {/* Step Connector Label */}
                <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[9.5px] uppercase font-black tracking-wider px-3.5 py-1.5 rounded-bl-2xl">
                  Step {index + 1} of {roleSkills.length}
                </div>
                
                {/* Summary Row */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4.5 gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-750 border border-indigo-100">
                        {skillDoc.category}
                      </span>
                      <h3 className="font-extrabold text-slate-800 text-base leading-none pr-20">{skillDoc.name}</h3>
                    </div>
                    <p className="text-[10.5px] text-slate-455 font-semibold">
                      Target Proficiency: Level {rs.requiredProficiency} &bull; Urgency: <span className="uppercase text-indigo-650">{rs.importance}</span>
                    </p>
                  </div>

                  <div className="flex items-center gap-6 text-right w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right text-xs font-semibold text-slate-655">
                      <p className="font-extrabold text-slate-800 text-xs">Level {userProficiency}/5</p>
                      <p className="text-[10px] text-slate-400">{completedCount}/{totalCount} topics completed</p>
                    </div>

                    <div className="flex items-center space-x-3.5">
                      <div className="w-12 h-12 rounded-full border-4 border-slate-50 flex items-center justify-center relative bg-indigo-50/20">
                        <svg className="absolute w-full h-full transform -rotate-90">
                          <circle cx="24" cy="24" r="20" stroke="#f1f5f9" strokeWidth="3" fill="none" />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="#6366f1"
                            strokeWidth="3"
                            fill="none"
                            strokeDasharray={126}
                            strokeDashoffset={126 - (126 * progressPct) / 100}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span className="text-[10px] font-black text-indigo-700">{progressPct}%</span>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                        status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700' :
                        status === 'IN PROGRESS' ? 'bg-indigo-50 text-indigo-750' :
                        'bg-slate-105 text-slate-450 border border-slate-200'
                      }`}>{status}</span>
                    </div>
                  </div>
                </div>

                {/* Topics Progression Grid */}
                <div className="space-y-3.5">
                  <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Concept Milestones</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {topics.map((topic, tIdx) => {
                      const key = `${skillDoc._id}_${topic.title}`;
                      const isDone = !!completedTopics[key];
                      const isLocked = topic.prerequisite && !completedTopics[`${skillDoc._id}_${topic.prerequisite}`];
                      
                      return (
                        <div
                          key={tIdx}
                          className={`p-4 border rounded-3xl text-xs font-semibold transition-all relative flex flex-col justify-between space-y-4 ${
                            isLocked
                              ? 'bg-slate-50/50 border-slate-205/50 text-slate-400 opacity-60'
                              : isDone
                              ? 'bg-emerald-50/15 border-emerald-100/70 text-emerald-900'
                              : 'bg-white border-slate-205 text-slate-700 hover:border-indigo-150 hover:bg-slate-50/30'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-1">
                              <span className="block font-black text-slate-805 text-[12px] leading-snug">{topic.title}</span>
                              {isLocked ? (
                                <Lock className="w-3.5 h-3.5 text-slate-350 shrink-0" />
                              ) : (
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => toggleTopic(skillDoc._id, topic.title)}
                                  className="rounded text-indigo-650 focus:ring-indigo-500 cursor-pointer shrink-0"
                                />
                              )}
                            </div>
                            
                            <p className="text-[10.5px] text-slate-455 font-medium leading-relaxed pt-1.5">{topic.description}</p>
                            
                            {topic.prerequisite && (
                              <span className="inline-block text-[8.5px] text-slate-400 font-bold uppercase pt-1">
                                Prereq: {topic.prerequisite}
                              </span>
                            )}
                          </div>

                          <div className="pt-2 flex items-center justify-between border-t border-slate-100/60">
                            {isLocked ? (
                              <span className="text-[9px] text-slate-400 uppercase font-bold">Complete {topic.prerequisite} first</span>
                            ) : (
                              <>
                                <a
                                  href={topic.link}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[9.5px] font-extrabold uppercase tracking-wider text-indigo-655 hover:underline inline-flex items-center"
                                >
                                  Learn Topic &rarr;
                                </a>
                                <button
                                  onClick={() => toggleTopic(skillDoc._id, topic.title)}
                                  className={`px-2.5 py-1 rounded text-[9.5px] font-black uppercase tracking-wider cursor-pointer ${
                                    isDone ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-55 border border-slate-205 text-slate-655 hover:bg-slate-100'
                                  }`}
                                >
                                  {isDone ? '✓ Completed' : 'Mark Completed'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Learning Resources */}
                {rs.learningResources && rs.learningResources.length > 0 && (
                  <div className="space-y-3.5 border-t border-slate-100 pt-4.5">
                    <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                      <BookOpen className="w-3.5 h-3.5 mr-1" />
                      Recommended Learning Resources
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {rs.learningResources.map((res) => (
                        <div key={res.id} className="p-4 border border-slate-200 rounded-2xl bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between text-xs font-semibold">
                          <div className="space-y-1">
                            <span className="block font-black text-slate-805 leading-snug">{res.title}</span>
                            <span className="text-[10px] text-slate-400 font-bold uppercase">
                              Difficulty: {res.difficulty} &bull; Est. Hours: {res.estimatedHours}h
                            </span>
                          </div>
                          <button
                            onClick={() => handleStartResource(res.id, res.url)}
                            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold flex items-center gap-1 cursor-pointer transition-colors shadow-sm"
                          >
                            Start Learning
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            );
          })}
        </div>
      )}
      
    </div>
  );
};

export default Progress;
