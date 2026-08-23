import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Compass, BookOpen, Layers, CheckCircle, Target, HelpCircle, ArrowRight, Zap, Info, X, Award } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const CareerExplorer = () => {
  const { user, updateUserProfile } = useAuth();
  
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedRole, setSelectedRole] = useState(null);
  const [selectedRoleSkills, setSelectedRoleSkills] = useState([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  
  const [actionLoading, setActionLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Questionnaire States
  const [showHelper, setShowHelper] = useState(false);
  const [answers, setAnswers] = useState({ interests: '', strengths: '' });
  const [recommendation, setRecommendation] = useState(null);

  const fetchCareers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.get('/roles');
      const fetchedRoles = res.data.roles || [];
      setRoles(fetchedRoles);
      
      // Auto-select target role or first role
      const targetId = user?.targetRoleId?._id || user?.targetRoleId;
      const targetMatch = fetchedRoles.find(r => r._id === targetId);
      setSelectedRole(targetMatch || fetchedRoles[0]);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to fetch engineering career directories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCareers();
  }, [user]);

  // Fetch required skills whenever selected career changes
  useEffect(() => {
    const fetchRoleRequirements = async () => {
      if (!selectedRole?._id) return;
      try {
        setLoadingSkills(true);
        const res = await api.get(`/roles/${selectedRole._id}/skills`);
        setSelectedRoleSkills(res.data.skills || []);
      } catch (err) {
        setSelectedRoleSkills([]);
      } finally {
        setLoadingSkills(false);
      }
    };
    fetchRoleRequirements();
  }, [selectedRole]);

  const handleSelectTarget = async (roleId) => {
    setActionLoading(true);
    setSuccessMsg('');
    try {
      const res = await api.put(`/users/${user._id}`, { targetRoleId: roleId });
      updateUserProfile(res.data.user);
      setSuccessMsg('Target career track set successfully!');
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to set target career');
    } finally {
      setActionLoading(false);
    }
  };

  const handleQuestionnaireSubmit = (e) => {
    e.preventDefault();
    if (!answers.interests || !answers.strengths) return;

    let targetName = 'Software Developer';
    if (answers.interests === 'frontend') {
      targetName = 'Frontend Developer';
    } else if (answers.interests === 'backend') {
      targetName = 'Backend Developer';
    } else if (answers.interests === 'devops') {
      targetName = 'DevOps Engineer';
    } else if (answers.interests === 'fullstack') {
      targetName = 'Full Stack Developer';
    }

    const matchedRole = roles.find(r => r.name.toLowerCase().includes(targetName.toLowerCase())) || roles[0];
    setRecommendation(matchedRole);
  };

  const getCareerTechStack = (roleName) => {
    const name = roleName || '';
    const lower = name.toLowerCase();
    
    if (lower.includes('frontend') || lower.includes('mobile')) {
      return [
        { title: 'Fundamentals', desc: 'HTML5, CSS3/Sass, Git version control, responsive layouts' },
        { title: 'Core Languages', desc: 'JavaScript (ES6+), TypeScript safety parameters' },
        { title: 'Client Frameworks', desc: 'React.js component lifecycles, Next.js routing, Tailwind CSS, React Native mobile' }
      ];
    }
    if (lower.includes('backend') || lower.includes('full')) {
      return [
        { title: 'API Protocols', desc: 'REST API design patterns, JSON Web Tokens, GraphQL schemas' },
        { title: 'Core Environments', desc: 'Node.js runtime parameters, Express.js routing, Git branching' },
        { title: 'Data Storage', desc: 'MongoDB Document storage, SQL relational queries (PostgreSQL/MySQL)' }
      ];
    }
    if (lower.includes('devops') || lower.includes('cloud')) {
      return [
        { title: 'Containers', desc: 'Docker containerization, Kubernetes cluster orchestration, Dockerfiles' },
        { title: 'Infrastructure', desc: 'AWS/GCP cloud environments, Terraform Infrastructure as Code configurations' },
        { title: 'Automation', desc: 'Git branching, Bash command line scripting, GitHub Actions CI/CD pipelines' }
      ];
    }
    if (lower.includes('data') || lower.includes('machine') || lower.includes('ml') || lower.includes('ai')) {
      return [
        { title: 'Foundations', desc: 'Probability & Statistics, Linear Algebra, Calculus, Pandas dataframes' },
        { title: 'Languages', desc: 'Python scripting, SQL relational queries' },
        { title: 'AI Libraries', desc: 'TensorFlow, PyTorch neural networks, Scikit-learn model parameters' }
      ];
    }
    if (lower.includes('security') || lower.includes('cyber')) {
      return [
        { title: 'Networking', desc: 'TCP/IP socket protocol, DNS configurations, routing firewalls' },
        { title: 'Security Tools', desc: 'Nmap port scanner, Wireshark packet capture analysis, Metasploit penetration testing' },
        { title: 'Auditing', desc: 'OWASP web security vulnerability lists, encryption standards, IAM policy keys' }
      ];
    }
    if (lower.includes('qa') || lower.includes('test')) {
      return [
        { title: 'Scripting languages', desc: 'JavaScript web triggers, Python parsing script metrics, Bash runs' },
        { title: 'Testing Frameworks', desc: 'Jest unit tests, Selenium Webdriver, Cypress components, Playwright testing engines' },
        { title: 'Quality Tools', desc: 'Postman API collections, Git branching pipelines, CI/CD validation gates' }
      ];
    }
    return [
      { title: 'Fundamentals', desc: 'Data Structures & Algorithms, OOP principles, Git control' },
      { title: 'Core Languages', desc: 'JavaScript programming, Python scripting, Java architectures' },
      { title: 'Runtime Environment', desc: 'Node.js backend, Docker virtualization' }
    ];
  };

  const getCareerProgression = (roleName) => {
    const name = roleName || '';
    const lower = name.toLowerCase();

    if (lower.includes('frontend') || lower.includes('mobile')) {
      return [
        { step: 'Stage 1: Client Basics', desc: 'Acquire deep competency in CSS Grid/Flexbox, semantic markup, and DOM logic triggers.' },
        { step: 'Stage 2: Dynamic Views', desc: 'Study dynamic component render engines (React state, React Context, hooks, React Native modules).' },
        { step: 'Stage 3: Scale Applications', desc: 'Establish server-side renders (SSR/Next.js router), optimize asset bundles, and host applications.' }
      ];
    }
    if (lower.includes('backend') || lower.includes('full')) {
      return [
        { step: 'Stage 1: Server Basics', desc: 'Acquire competency in Node.js runtime, build HTTP routers, handle body parsing, and configure REST endpoints.' },
        { step: 'Stage 2: Databases', desc: 'Master database connections, transaction locks, relational schemas, indexing, and ORM/ODM models.' },
        { step: 'Stage 3: Scaling & Security', desc: 'Establish JWT token authentications, deploy microservices, rate-limiting, and caching layers.' }
      ];
    }
    if (lower.includes('devops') || lower.includes('cloud')) {
      return [
        { step: 'Stage 1: Script & Code', desc: 'Acquire competency in standard Linux server bash parameters, terminal configs, and Git version control.' },
        { step: 'Stage 2: Virtualization', desc: 'Write Dockerfiles, build compose scripts, run container registries, and write Kubernetes manifests.' },
        { step: 'Stage 3: Infrastructure', desc: 'Configure automatic CI/CD pipelines, write Terraform IaC deployments, and deploy cloud clusters.' }
      ];
    }
    if (lower.includes('data') || lower.includes('machine') || lower.includes('ml') || lower.includes('ai')) {
      return [
        { step: 'Stage 1: Analytics', desc: 'Master statistics, extract raw datasets, perform cleanings, and build SQL queries.' },
        { step: 'Stage 2: Machine Learning', desc: 'Train decision trees, execute regressions, and evaluate precision/recall coefficients.' },
        { step: 'Stage 3: Neural Networks', desc: 'Build convolutional layers, train deep learning networks, and deploy ML models.' }
      ];
    }
    if (lower.includes('security') || lower.includes('cyber')) {
      return [
        { step: 'Stage 1: Systems Auditing', desc: 'Study standard networking protocols, inspect routing firewalls, and learn Linux commands.' },
        { step: 'Stage 2: Defense Mitigation', desc: 'Configure authentication protocols, execute penetration scans, and implement SSL/TLS encryption.' },
        { step: 'Stage 3: Incident Response', desc: 'Create intrusion threat models, trace packets, and report on vulnerability audits.' }
      ];
    }
    if (lower.includes('qa') || lower.includes('test')) {
      return [
        { step: 'Stage 1: Manual Verification', desc: 'Write comprehensive test specifications, map checklist edge cases, and inspect logs manually.' },
        { step: 'Stage 2: Automation scripts', desc: 'Write browser tests, build mock APIs, and compile regression test suites.' },
        { step: 'Stage 3: Pipeline hooks', desc: 'Integrate automated quality gates directly inside continuous integration check pipelines.' }
      ];
    }
    return [
      { step: 'Stage 1: Core Fundamentals', desc: 'Acquire deep competency in algorithm analysis and core programming parameters.' },
      { step: 'Stage 2: Technology Libraries', desc: 'Study recommended framework structures (React, Express) resolving prereqs.' },
      { step: 'Stage 3: Systems Deployments', desc: 'Establish deployment scripts using Docker and secure REST service targets.' }
    ];
  };

  if (loading) return <LoadingSpinner message="Querying career catalog matrices..." />;
  if (error) return <ErrorState message={error} onRetry={fetchCareers} />;

  return (
    <div className="space-y-8 font-sans max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">Career Explorer</h1>
          <p className="text-xs text-slate-400 font-semibold">Explore engineering career milestones, requirements, and skill pathways.</p>
        </div>

        <button
          onClick={() => { setShowHelper(true); setRecommendation(null); }}
          className="mt-4 sm:mt-0 px-4 py-2 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-xl transition-all flex items-center space-x-1 shadow-sm cursor-pointer"
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help Me Choose</span>
        </button>
      </div>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 p-3 rounded-2xl text-xs font-bold flex items-center">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-600 mr-2 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Careers List */}
        <div className="lg:col-span-4 bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm space-y-3.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2.5">
            Engineering Tracks
          </h3>
          <div className="space-y-2">
            {roles.map((role) => {
              const isSelected = selectedRole?._id === role._id;
              const isTarget = (user?.targetRoleId?._id || user?.targetRoleId) === role._id;
              return (
                <button
                  key={role._id}
                  onClick={() => { setSelectedRole(role); setSuccessMsg(''); }}
                  className={`w-full text-left p-4.5 rounded-2xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-indigo-600 border-indigo-650 text-white shadow-md'
                      : 'bg-slate-50 border-slate-200/40 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <div className="space-y-1">
                    <span className="block font-extrabold text-[12.5px]">{role.name}</span>
                    <span className={isSelected ? 'text-indigo-150' : 'text-slate-400'}>{role.department} &bull; {role.level}</span>
                  </div>
                  {isTarget && (
                    <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider shrink-0 ${
                      isSelected ? 'bg-white text-indigo-650' : 'bg-indigo-50 text-indigo-750'
                    }`}>
                      Target
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Selected Career Details */}
        {selectedRole && (
          <div className="lg:col-span-8 bg-white border border-slate-200/50 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Engineering track specification</span>
                <h2 className="text-lg sm:text-xl font-extrabold text-slate-800 tracking-tight mt-1">{selectedRole.name}</h2>
              </div>
              
              <button
                onClick={() => handleSelectTarget(selectedRole._id)}
                disabled={actionLoading || (user?.targetRoleId?._id || user?.targetRoleId) === selectedRole._id}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white disabled:bg-slate-100 disabled:text-slate-400 rounded-xl text-[10.5px] font-bold uppercase tracking-wider transition-all disabled:scale-100 hover:scale-[1.02] shadow-sm flex items-center cursor-pointer"
              >
                <Target className="w-3.5 h-3.5 mr-1" />
                {(user?.targetRoleId?._id || user?.targetRoleId) === selectedRole._id ? 'Selected Target' : 'Set As Target'}
              </button>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">What the role does</h4>
              <p className="text-xs text-slate-655 leading-relaxed font-semibold">{selectedRole.description || 'Responsible for architecting and deploying engineering applications.'}</p>
            </div>

            {/* Required Core Competencies (Populated dynamically from DB) */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Required Core Competencies</h4>
              {loadingSkills ? (
                <div className="text-xs text-slate-400 font-bold animate-pulse">Loading skill requirements...</div>
              ) : selectedRoleSkills.length === 0 ? (
                <p className="text-xs text-slate-400 italic font-semibold">No specific requirements registered for this role.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedRoleSkills.map((rs, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200/40 rounded-xl text-xs font-semibold">
                      <div className="flex items-center space-x-2">
                        <Award className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="font-extrabold text-slate-800">{rs.skillId?.name}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-[10px]">
                        <span className="text-slate-455 font-bold">Lvl {rs.requiredProficiency}</span>
                        <span className={`px-2 py-0.5 rounded-lg font-black uppercase tracking-wider text-[8px] ${
                          rs.importance === 'required' ? 'bg-rose-50 text-rose-750 border border-rose-100' : 'bg-slate-100 text-slate-700'
                        }`}>{rs.importance}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Typical technology areas list */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Technology Stack Areas</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {getCareerTechStack(selectedRole.name).map((stack, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-150/40 text-xs font-semibold">
                    <span className="font-extrabold text-slate-800 block mb-0.5">{stack.title}</span>
                    <span className="text-slate-455 text-[10px] leading-relaxed">{stack.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Path stages */}
            <div className="space-y-3 pt-2">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recommended Career Progression Path</h4>
              <div className="relative pl-6 space-y-4">
                <div className="absolute top-2 bottom-2 left-2.5 w-0.5 bg-dashed border-l border-slate-200" />
                {getCareerProgression(selectedRole.name).map((s, idx) => (
                  <div key={idx} className="relative text-xs font-semibold">
                    <span className="absolute -left-6 top-1 w-2.5 h-2.5 rounded-full bg-indigo-650 border-2 border-white ring-1 ring-indigo-200" />
                    <h5 className="font-extrabold text-slate-800 leading-tight">{s.step}</h5>
                    <p className="text-[10px] text-slate-505 mt-0.5 leading-relaxed">{s.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interest Questionnaire Helper Modal */}
      {showHelper && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 border border-slate-100 animate-in zoom-in-95 duration-150">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-800 text-sm flex items-center space-x-1.5">
                <HelpCircle className="w-4.5 h-4.5 text-indigo-500" />
                <span>Career Path Helper</span>
              </h3>
              <button onClick={() => setShowHelper(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {!recommendation ? (
              <form onSubmit={handleQuestionnaireSubmit} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-black">Which technology area excites you most?</label>
                  <div className="space-y-2">
                    {[
                      { val: 'frontend', label: 'User Interfaces & Client interactions' },
                      { val: 'backend', label: 'Database architectures & Server services' },
                      { val: 'devops', label: 'Systems configuration & Orchestration' },
                      { val: 'fullstack', label: 'End-to-end fullstack development' }
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center space-x-2 bg-slate-50 border border-slate-205 p-2.5 rounded-xl text-xs font-semibold text-slate-655 cursor-pointer">
                        <input
                          type="radio"
                          name="interests"
                          value={opt.val}
                          checked={answers.interests === opt.val}
                          onChange={(e) => setAnswers(prev => ({ ...prev, interests: e.target.value }))}
                          className="text-indigo-650"
                        />
                        <span>{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block font-black">What is your core strength?</label>
                  <select
                    value={answers.strengths}
                    onChange={(e) => setAnswers(prev => ({ ...prev, strengths: e.target.value }))}
                    className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white"
                    required
                  >
                    <option value="">-- Select strength --</option>
                    <option value="visual">Visual layouts, grid styling details</option>
                    <option value="oop">Object-Oriented Programming (OOP) and code designs</option>
                    <option value="deploy">Networks configurations & Docker</option>
                    <option value="math">Algorithms & relational databases</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={!answers.interests || !answers.strengths}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Analyze Suggestions
                </button>
              </form>
            ) : (
              <div className="text-center space-y-5 py-4">
                <span className="text-3xl">🚀</span>
                <div className="space-y-1">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Recommended Match</span>
                  <h4 className="font-extrabold text-slate-800 text-base">{recommendation.name}</h4>
                  <p className="text-[10px] text-slate-455">Department: {recommendation.department} &bull; {recommendation.level}</p>
                </div>

                <div className="flex space-x-3 pt-2">
                  <button
                    onClick={() => setShowHelper(false)}
                    className="flex-1 py-2.5 border border-slate-205 text-slate-650 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => { handleSelectTarget(recommendation._id); setShowHelper(false); }}
                    className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    Select Target
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default CareerExplorer;
