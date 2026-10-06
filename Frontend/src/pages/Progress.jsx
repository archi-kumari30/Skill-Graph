import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  BookOpen,
  CheckCircle,
  ExternalLink,
  Lock,
  PlayCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Clock,
  Target,
  GraduationCap,
  Award,
  Check,
  ArrowRight,
  Layers
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';
import toast from 'react-hot-toast';

// Comprehensive Curriculum Topics Catalog organized by Skill & Prerequisite Chain
const LEARNING_TOPICS_CATALOG = {
  'HTML': [
    { title: 'HTML Document Structure & Tags', description: 'Doctype, head, body, headings, paragraphs, and standard page skeletons.', prerequisite: null, link: 'https://developer.mozilla.org/en-US/docs/Web/HTML' },
    { title: 'Semantic Tags & Accessibility', description: 'Header, nav, main, section, article, footer, and ARIA attributes.', prerequisite: 'HTML Document Structure & Tags', link: 'https://developer.mozilla.org/en-US/docs/Web/HTML/Element' },
    { title: 'HTML Forms & Inputs', description: 'Form validation, text inputs, radio, checkboxes, select, and submit.', prerequisite: 'Semantic Tags & Accessibility', link: 'https://developer.mozilla.org/en-US/docs/Learn/Forms' },
    { title: 'Tables & Media Elements', description: 'Table rows, cells, headers, images, audio, and video.', prerequisite: 'HTML Document Structure & Tags', link: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Multimedia_and_embedding' }
  ],
  'CSS': [
    { title: 'CSS Selectors & Specificity', description: 'Class, ID, attribute, pseudo-classes, and specificity cascade.', prerequisite: null, link: 'https://developer.mozilla.org/en-US/docs/Web/CSS' },
    { title: 'Box Model & Display Properties', description: 'Margin, border, padding, content, inline vs block.', prerequisite: 'CSS Selectors & Specificity', link: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/Building_blocks/The_box_model' },
    { title: 'CSS Flexbox Layout', description: 'Flex container, flex items, justify-content, and align-items.', prerequisite: 'Box Model & Display Properties', link: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/' },
    { title: 'CSS Grid Layout', description: 'Grid templates, columns, rows, areas, and gap properties.', prerequisite: 'CSS Flexbox Layout', link: 'https://css-tricks.com/snippets/css/complete-guide-grid/' },
    { title: 'Responsive Design & Media Queries', description: 'Breakpoints, mobile-first design, and viewport units.', prerequisite: 'CSS Flexbox Layout', link: 'https://developer.mozilla.org/en-US/docs/Learn/CSS/CSS_layout/Responsive_Design' }
  ],
  'JavaScript': [
    { title: 'Variables, Data Types & Scopes', description: 'Let, const, var, primitives, objects, and block scoping.', prerequisite: null, link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types' },
    { title: 'Functions, Arrow Syntax & Closures', description: 'Function expressions, lexical scoping, and closure memory.', prerequisite: 'Variables, Data Types & Scopes', link: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Functions' },
    { title: 'DOM Tree & Event Handling', description: 'Query selectors, event listeners, bubbling, and delegation.', prerequisite: 'Functions, Arrow Syntax & Closures', link: 'https://developer.mozilla.org/en-US/docs/Learn/JavaScript/Client-side_web_APIs/Manipulating_documents' },
    { title: 'Promises, Async/Await & Event Loop', description: 'Microtasks, macrotasks, async functions, and concurrency.', prerequisite: 'DOM Tree & Event Handling', link: 'https://javascript.info/async' },
    { title: 'ES6+ Destructuring, Modules & Classes', description: 'Spread syntax, object destructuring, imports/exports, and classes.', prerequisite: 'Functions, Arrow Syntax & Closures', link: 'https://javascript.info/classes' },
    { title: 'Fetch API & AJAX Requests', description: 'HTTP methods, headers, JSON serialization, and response parsing.', prerequisite: 'Promises, Async/Await & Event Loop', link: 'https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch' }
  ],
  'React': [
    { title: 'JSX Syntax & Element Rendering', description: 'JSX compilation, expression embedding, and virtual DOM.', prerequisite: null, link: 'https://react.dev/learn/writing-markup-with-jsx' },
    { title: 'Components & Props Flow', description: 'Functional components, prop passing, and unidirectional data flow.', prerequisite: 'JSX Syntax & Element Rendering', link: 'https://react.dev/learn/passing-props-to-a-component' },
    { title: 'Component State with useState', description: 'State management, updater functions, and re-rendering.', prerequisite: 'Components & Props Flow', link: 'https://react.dev/learn/state-a-components-memory' },
    { title: 'Side Effects with useEffect', description: 'Lifecycle timing, dependency arrays, and cleanup functions.', prerequisite: 'Component State with useState', link: 'https://react.dev/learn/synchronizing-with-effects' },
    { title: 'Global State with Context API', description: 'CreateContext, Provider pattern, and useContext hook.', prerequisite: 'Side Effects with useEffect', link: 'https://react.dev/learn/passing-data-deeply-with-context' },
    { title: 'Custom React Hooks', description: 'Extracting reusable component state and lifecycle logic.', prerequisite: 'Side Effects with useEffect', link: 'https://react.dev/learn/reusing-logic-with-custom-hooks' }
  ],
  'TypeScript': [
    { title: 'TypeScript Basics & Type Annotations', description: 'Type inference, explicit typing, primitive types, and any/unknown.', prerequisite: null, link: 'https://www.typescriptlang.org/docs/handbook/2/everyday-types.html' },
    { title: 'Interfaces, Types & Enums', description: 'Custom type aliases, interface extension, optional props, and enums.', prerequisite: 'TypeScript Basics & Type Annotations', link: 'https://www.typescriptlang.org/docs/handbook/2/objects.html' },
    { title: 'Generics & Utility Types', description: 'Generic functions, constraints, keyof, Record, and Partial/Pick.', prerequisite: 'Interfaces, Types & Enums', link: 'https://www.typescriptlang.org/docs/handbook/2/generics.html' },
    { title: 'TypeScript with React & Props', description: 'Typing component props, event handlers, and custom hooks.', prerequisite: 'Interfaces, Types & Enums', link: 'https://react.dev/learn/typescript' }
  ],
  'Testing': [
    { title: 'Unit Testing Fundamentals & Jest', description: 'Test suites, expect assertions, test runners, and test assertions.', prerequisite: null, link: 'https://jestjs.io/docs/getting-started' },
    { title: 'React Testing Library & Component Tests', description: 'Render components, userEvent interactions, and screen queries.', prerequisite: 'Unit Testing Fundamentals & Jest', link: 'https://testing-library.com/docs/react-testing-library/intro/' },
    { title: 'Mocking APIs & Async Testing', description: 'Mock functions, spies, network mocks, and async/await testing.', prerequisite: 'React Testing Library & Component Tests', link: 'https://jestjs.io/docs/mock-functions' },
    { title: 'End-to-End Testing Basics', description: 'Integration workflows, coverage reports, and regression prevention.', prerequisite: 'Mocking APIs & Async Testing', link: 'https://playwright.dev/docs/intro' }
  ],
  'Node.js': [
    { title: 'V8 Engine & Event-Driven Architecture', description: 'Single-threaded event loop, libuv, and non-blocking I/O.', prerequisite: null, link: 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs' },
    { title: 'CommonJS & ES Modules', description: 'Require vs import, module caching, and package manifests.', prerequisite: 'V8 Engine & Event-Driven Architecture', link: 'https://nodejs.org/api/modules.html' },
    { title: 'File System & Stream Processing', description: 'Readable/writable streams, piping, and buffer manipulation.', prerequisite: 'CommonJS & ES Modules', link: 'https://nodejs.org/api/fs.html' },
    { title: 'Native HTTP & Server Basics', description: 'Creating raw HTTP servers, request/response headers.', prerequisite: 'File System & Stream Processing', link: 'https://nodejs.org/api/http.html' }
  ],
  'Express.js': [
    { title: 'Express App & Routing Setup', description: 'Express application instance, router mounting, and paths.', prerequisite: null, link: 'https://expressjs.com/en/starter/hello-world.html' },
    { title: 'Middleware Pipeline & Execution', description: 'Next function, request mutation, and middleware chains.', prerequisite: 'Express App & Routing Setup', link: 'https://expressjs.com/en/guide/using-middleware.html' },
    { title: 'RESTful Controllers & Response Formatting', description: 'Status codes, JSON envelopes, and controller delegation.', prerequisite: 'Middleware Pipeline & Execution', link: 'https://expressjs.com/en/guide/routing.html' },
    { title: 'Centralized Error Handling', description: 'Error middleware, operational errors, and HTTP status mapping.', prerequisite: 'RESTful Controllers & Response Formatting', link: 'https://expressjs.com/en/guide/error-handling.html' }
  ],
  'MongoDB': [
    { title: 'Document Model & NoSQL Concepts', description: 'BSON format, document flexibility, and horizontal scaling.', prerequisite: null, link: 'https://www.mongodb.com/docs/manual/core/document/' },
    { title: 'CRUD Operations & Query Operators', description: 'Find, insert, update, delete, and comparison operators.', prerequisite: 'Document Model & NoSQL Concepts', link: 'https://www.mongodb.com/docs/manual/crud/' },
    { title: 'Mongoose Schemas & Model Lifecycle', description: 'Schema definitions, validations, pre/post hooks, and virtuals.', prerequisite: 'CRUD Operations & Query Operators', link: 'https://mongoosejs.com/docs/guide.html' },
    { title: 'Aggregation Pipelines', description: 'Match, group, project, unwind, and multi-stage joins.', prerequisite: 'Mongoose Schemas & Model Lifecycle', link: 'https://www.mongodb.com/docs/manual/aggregation/' }
  ],
  'Git': [
    { title: 'Git Initialization & Commits', description: 'Staging area, git status, diff, and atomic commits.', prerequisite: null, link: 'https://git-scm.com/doc' },
    { title: 'Branch Management & Merging', description: 'Branch creation, checkout, fast-forward and 3-way merges.', prerequisite: 'Git Initialization & Commits', link: 'https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging' },
    { title: 'Remote Repositories & Collaboration', description: 'Remote tracking branches, git fetch, pull, and push.', prerequisite: 'Branch Management & Merging', link: 'https://git-scm.com/book/en/v2/Git-Basics-Working-with-Remotes' }
  ]
};

const DEFAULT_TOPICS = [
  { title: 'Core Foundations & Principles', description: 'Foundational concepts and terminology.', prerequisite: null, link: 'https://developer.mozilla.org/' },
  { title: 'Hands-on Implementation', description: 'Practical coding exercises and real-world patterns.', prerequisite: 'Core Foundations & Principles', link: 'https://developer.mozilla.org/' },
  { title: 'Optimization & Best Practices', description: 'Scalability, debugging, and production guidelines.', prerequisite: 'Hands-on Implementation', link: 'https://developer.mozilla.org/' }
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
  const [completedTopics, setCompletedTopics] = useState({});
  const [expandedChapters, setExpandedChapters] = useState({});
  const [completingTopic, setCompletingTopic] = useState({});

  // Ref to hold first incomplete topic DOM element for Resume Learning jump
  const firstIncompleteRef = useRef(null);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      setError('');

      const [rolesRes, skillsRes, progressRes] = await Promise.all([
        api.get('/roles'),
        api.get(`/users/${user._id}/skills`),
        api.get('/learning/topics/progress')
      ]);

      const fetchedRoles = rolesRes.data?.roles || rolesRes.data || [];
      setRoles(fetchedRoles);

      const targetId = user?.targetRoleId?._id || user?.targetRoleId;
      const defaultRole = fetchedRoles.find(r => r._id === targetId) || fetchedRoles[0];
      if (defaultRole) {
        setSelectedRoleId(defaultRole._id);
      }

      setUserSkills(skillsRes.data?.skills || skillsRes.data || []);

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
      setError(err?.response?.data?.error?.message || err?.message || 'Failed to retrieve learning data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    const fetchRoleSkillsData = async () => {
      if (!selectedRoleId || !user?._id) return;
      try {
        setLoadingSkills(true);
        const res = await api.get(`/recommendations/users/${user._id}/roles/${selectedRoleId}`);
        const recs = res.data?.recommendations || [];

        const mappedRoleSkills = recs.map((rec, idx) => ({
          _id: rec.skill?.id || rec.skill?._id || `skill-${idx}`,
          skillId: {
            _id: rec.skill?.id || rec.skill?._id || `skill-${idx}`,
            name: rec.skill?.name || 'Skill',
            category: rec.skill?.category || 'General'
          },
          requiredProficiency: rec.targetProficiency || 3,
          importance: rec.reason?.includes('Critical') ? 'required' : (rec.reason?.includes('Important') ? 'important' : 'nice_to_have'),
          learningResources: rec.learningResources || [],
          reason: rec.reason,
          priority: rec.priority
        }));

        setRoleSkills(mappedRoleSkills);

        // Auto-expand all chapters initially
        const initialExpanded = {};
        mappedRoleSkills.forEach((_, idx) => {
          initialExpanded[idx] = true;
        });
        setExpandedChapters(initialExpanded);
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
      toast.success('Target career track updated!');
    } catch (err) {
      console.error('Failed to sync target career changes', err);
    }
  };

  const toggleTopic = async (skillId, topicTitle) => {
    const key = `${skillId}_${topicTitle}`;
    const wasCompleted = !!completedTopics[key];
    const newCompletedState = !wasCompleted;

    // Optimistic UI update
    setCompletedTopics(prev => ({ ...prev, [key]: newCompletedState }));
    setCompletingTopic(prev => ({ ...prev, [key]: true }));

    try {
      await api.post('/learning/topics/complete', {
        skillId,
        topicTitle,
        completed: newCompletedState
      });

      // Refresh skills to reflect updated proficiency in state
      const skillsRes = await api.get(`/users/${user._id}/skills`);
      setUserSkills(skillsRes.data?.skills || skillsRes.data || []);

      toast.success(newCompletedState ? 'Topic completed! (+20 Learning Points)' : 'Topic marked as incomplete.');
    } catch (err) {
      // Rollback on failure
      setCompletedTopics(prev => ({ ...prev, [key]: wasCompleted }));
      toast.error(err?.response?.data?.error?.message || 'Failed to update topic progress.');
    } finally {
      setCompletingTopic(prev => ({ ...prev, [key]: false }));
    }
  };

  const toggleChapter = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const getTopicsForSkill = (skillName) => {
    return LEARNING_TOPICS_CATALOG[skillName] || DEFAULT_TOPICS;
  };

  // Calculate Overall Metrics across all chapters
  let totalTopicsCount = 0;
  let totalCompletedCount = 0;
  let firstIncompleteFound = false;

  const chaptersData = roleSkills.map((rs, index) => {
    const skillDoc = rs.skillId || {};
    const topics = getTopicsForSkill(skillDoc.name);
    const userSkillMatch = userSkills.find(
      us => (us.skillId?._id || us.skillId || '').toString() === (skillDoc._id || '').toString()
    );
    const currentProf = userSkillMatch ? userSkillMatch.proficiency : 0;

    let chapterCompletedCount = 0;
    const enrichedTopics = topics.map((t) => {
      const key = `${skillDoc._id}_${t.title}`;
      const isCompleted = !!completedTopics[key];
      if (isCompleted) chapterCompletedCount++;

      // Check if prerequisite is met
      const isPrereqMet = !t.prerequisite || !!completedTopics[`${skillDoc._id}_${t.prerequisite}`];
      const isLocked = !isPrereqMet;

      const isNextToLearn = !isCompleted && !isLocked && !firstIncompleteFound;
      if (isNextToLearn) {
        firstIncompleteFound = true;
      }

      return {
        ...t,
        isCompleted,
        isLocked,
        isNextToLearn
      };
    });

    totalTopicsCount += topics.length;
    totalCompletedCount += chapterCompletedCount;

    const chapterProgress = topics.length > 0
      ? Math.round((chapterCompletedCount / topics.length) * 100)
      : 0;

    return {
      skillDoc,
      requiredProficiency: rs.requiredProficiency,
      importance: rs.importance,
      currentProf,
      learningResources: rs.learningResources || [],
      topics: enrichedTopics,
      progress: chapterProgress,
      isCompleted: chapterProgress === 100
    };
  });

  const overallProgressPct = totalTopicsCount > 0
    ? Math.round((totalCompletedCount / totalTopicsCount) * 100)
    : 0;

  const estimatedDays = Math.max(1, Math.ceil((totalTopicsCount - totalCompletedCount) * 1.5));
  const learningPoints = totalCompletedCount * 20;

  const handleResumeLearning = () => {
    if (firstIncompleteRef.current) {
      firstIncompleteRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      firstIncompleteRef.current.classList.add('ring-4', 'ring-indigo-400', 'transition-all');
      setTimeout(() => {
        firstIncompleteRef.current?.classList.remove('ring-4', 'ring-indigo-400');
      }, 2000);
    } else {
      toast.success('You have completed all active topics in this track! 🎉');
    }
  };

  if (loading) return <LoadingSpinner message="Assembling guided career learning path..." />;
  if (error) return <ErrorState message={error} onRetry={fetchInitialData} />;

  return (
    <div className="space-y-8 font-sans max-w-6xl mx-auto animate-in fade-in duration-200">
      
      {/* 1. Header & Track Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Guided Path &bull; Prerequisite Roadmap
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">Career Learning Roadmap</h1>
          <p className="text-xs text-zinc-500 font-medium mt-1">
            Topologically ordered chapters and milestones designed to eliminate skill gaps for your career role.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider whitespace-nowrap">Career Track:</span>
          <select
            value={selectedRoleId}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer shadow-xs"
          >
            {roles.map(r => (
              <option key={r._id} value={r._id}>{r.name} ({r.department || 'Tech'})</option>
            ))}
          </select>
        </div>
      </div>

      {/* 2. Top Progress Dashboard (Naukri Code 360 Reference Concept) */}
      <div className="bg-white rounded-3xl border border-zinc-200/80 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Overall Progression</span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-zinc-900">{overallProgressPct}%</span>
              <span className="text-xs text-zinc-500 font-semibold">Track Completion</span>
            </div>
          </div>

          <button
            onClick={handleResumeLearning}
            className="w-full sm:w-auto px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black tracking-wide shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            <PlayCircle className="w-4 h-4" />
            Resume Learning
          </button>
        </div>

        {/* Dynamic Progress Bar */}
        <div className="space-y-2">
          <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-200/60">
            <div
              className="bg-indigo-600 h-full rounded-full transition-all duration-700 ease-out"
              style={{ width: `${overallProgressPct}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] font-bold text-zinc-400">
            <span>{totalCompletedCount} of {totalTopicsCount} Topics Mastered</span>
            <span>{chaptersData.filter(c => c.isCompleted).length} of {chaptersData.length} Chapters Finished</span>
          </div>
        </div>

        {/* Milestone KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-zinc-100">
          <div className="p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5 text-zinc-400" /> Total Topics
            </span>
            <p className="text-xl font-black text-zinc-900">{totalTopicsCount}</p>
          </div>
          <div className="p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Completed
            </span>
            <p className="text-xl font-black text-emerald-600">{totalCompletedCount}</p>
          </div>
          <div className="p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-indigo-500" /> Est. Schedule
            </span>
            <p className="text-xl font-black text-indigo-600">~{estimatedDays} Days</p>
          </div>
          <div className="p-4 bg-zinc-50/80 rounded-2xl border border-zinc-200/60 space-y-1">
            <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Skill Points
            </span>
            <p className="text-xl font-black text-amber-600">+{learningPoints} XP</p>
          </div>
        </div>
      </div>

      {/* 3. Chapters & Topics Accordion */}
      {loadingSkills ? (
        <LoadingSpinner message="Calculating course criteria parameters..." />
      ) : chaptersData.length === 0 ? (
        <div className="bg-white border border-zinc-200 rounded-3xl p-12 text-center max-w-md mx-auto space-y-3 shadow-xs">
          <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto" />
          <h4 className="font-extrabold text-zinc-900 text-base">All Requirements Met!</h4>
          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
            You have satisfied all core required competencies and proficiencies for the{' '}
            <strong>{roles.find(r => r._id === selectedRoleId)?.name || 'selected'}</strong> career track.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center px-1">
            <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
              Curriculum Chapters ({chaptersData.length})
            </h2>
            <button
              onClick={() => {
                const allExpanded = Object.values(expandedChapters).every(Boolean);
                const nextState = {};
                chaptersData.forEach((_, idx) => {
                  nextState[idx] = !allExpanded;
                });
                setExpandedChapters(nextState);
              }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 cursor-pointer"
            >
              {Object.values(expandedChapters).every(Boolean) ? 'Collapse All Chapters' : 'Expand All Chapters'}
            </button>
          </div>

          {chaptersData.map((chapter, cIdx) => {
            const isExpanded = !!expandedChapters[cIdx];
            const isCompleted = chapter.isCompleted;

            return (
              <div
                key={chapter.skillDoc._id || cIdx}
                className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Chapter Accordion Header */}
                <div
                  onClick={() => toggleChapter(cIdx)}
                  className="p-6 cursor-pointer hover:bg-zinc-50/50 transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-100 text-emerald-700'
                        : chapter.progress > 0
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {isCompleted ? <Check className="w-5 h-5 stroke-[3]" /> : cIdx + 1}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-zinc-100 text-zinc-600">
                          {chapter.skillDoc.category}
                        </span>
                        <h3 className="font-black text-zinc-900 text-base leading-snug">
                          Chapter {cIdx + 1}: {chapter.skillDoc.name}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isCompleted
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : chapter.progress > 0
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {isCompleted ? '✓ Completed' : chapter.progress > 0 ? `${chapter.progress}% In Progress` : 'Not Started'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 font-medium">
                        Target Proficiency: Level {chapter.requiredProficiency}/5 &bull; Current: Level {chapter.currentProf}/5
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-black text-zinc-900">
                        {chapter.topics.filter(t => t.isCompleted).length} / {chapter.topics.length} Done
                      </p>
                      <p className="text-[10px] text-zinc-400 font-semibold">{chapter.progress}% Completed</p>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-500">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Chapter Topics Content */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 p-6 bg-zinc-50/30 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {chapter.topics.map((t, tIdx) => {
                        const isDone = t.isCompleted;
                        const isLocked = t.isLocked;
                        const isNext = t.isNextToLearn;

                        return (
                          <div
                            key={tIdx}
                            ref={isNext ? firstIncompleteRef : null}
                            className={`p-5 rounded-2xl border transition-all flex flex-col justify-between space-y-4 ${
                              isLocked
                                ? 'bg-zinc-100/50 border-zinc-200/60 text-zinc-400 opacity-70'
                                : isDone
                                ? 'bg-emerald-50/20 border-emerald-200/80 text-zinc-800'
                                : isNext
                                ? 'bg-white border-indigo-300 shadow-xs ring-2 ring-indigo-500/20'
                                : 'bg-white border-zinc-200 hover:border-zinc-300 shadow-xs'
                            }`}
                          >
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-3">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[10px] text-zinc-400 font-bold">
                                      {cIdx + 1}.{tIdx + 1}
                                    </span>
                                    <h4 className="font-extrabold text-zinc-900 text-sm leading-snug">
                                      {t.title}
                                    </h4>
                                  </div>
                                </div>

                                {isLocked ? (
                                  <div className="p-1 rounded bg-zinc-200/80 text-zinc-500">
                                    <Lock className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => toggleTopic(chapter.skillDoc._id, t.title)}
                                    disabled={completingTopic[`${chapter.skillDoc._id}_${t.title}`]}
                                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                                      isDone
                                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                        : 'border-2 border-zinc-300 hover:border-indigo-600 bg-white'
                                    }`}
                                  >
                                    {isDone && <Check className="w-4 h-4 stroke-[3]" />}
                                  </button>
                                )}
                              </div>

                              <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                                {t.description}
                              </p>

                              {isLocked && t.prerequisite && (
                                <p className="text-[11px] font-bold text-rose-600 flex items-center gap-1 pt-1">
                                  <Lock className="w-3 h-3" />
                                  Prerequisite Required: Complete "{t.prerequisite}" first
                                </p>
                              )}
                            </div>

                            <div className="pt-3 border-t border-zinc-100 flex items-center justify-between">
                              {isLocked ? (
                                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                                  Locked Step
                                </span>
                              ) : (
                                <>
                                  <a
                                    href={t.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
                                  >
                                    Practice & Read
                                    <ExternalLink className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                                  </a>

                                  <button
                                    onClick={() => toggleTopic(chapter.skillDoc._id, t.title)}
                                    className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition-colors ${
                                      isDone
                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                        : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                                    }`}
                                  >
                                    {isDone ? '✓ Completed' : 'Mark Done'}
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Chapter Learning Resources & Docs */}
                    {chapter.learningResources && chapter.learningResources.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-zinc-200/60 space-y-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-zinc-400" />
                          Recommended Interactive References
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {chapter.learningResources.map(res => (
                            <a
                              key={res.id || res._id}
                              href={res.url}
                              target="_blank"
                              rel="noreferrer"
                              className="p-3 bg-white rounded-xl border border-zinc-200/80 hover:border-indigo-300 flex items-center justify-between text-xs font-semibold text-zinc-800 transition-colors group shadow-xs"
                            >
                              <span className="font-bold truncate pr-2">{res.title}</span>
                              <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-indigo-600 shrink-0" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
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
