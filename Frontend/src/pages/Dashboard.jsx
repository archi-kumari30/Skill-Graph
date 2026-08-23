import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
  Award,
  Compass,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle,
  Clock,
  Sparkles,
  BookOpen,
  ArrowUpRight,
  Bookmark,
  Bell,
  Check,
  Zap,
  MapPin,
  CheckSquare,
  Play
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorState from '../components/ErrorState';

const Dashboard = () => {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [personalGapData, setPersonalGapData] = useState(null);
  const [userSkills, setUserSkills] = useState([]);
  const [learningProgress, setLearningProgress] = useState([]);
  const [topicProgress, setTopicProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Reassessment Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProgress, setSelectedProgress] = useState(null);
  const [newProficiency, setNewProficiency] = useState(1);
  const [newExperience, setNewExperience] = useState(1);
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const summaryRes = await api.get('/dashboard/summary');
      setSummaryData(summaryRes.data);

      const profileRes = await api.get(`/users/${user._id}`);
      const freshUser = profileRes.data?.user || user;
      setUserProfile(freshUser);

      const targetRoleId = freshUser.targetRoleId?._id || freshUser.targetRoleId;
      if (targetRoleId) {
        try {
          const gapRes = await api.get(`/skill-gap/users/${user._id}/roles/${targetRoleId}`);
          setPersonalGapData(gapRes.data || null);
        } catch (gapErr) {
          console.error("No gap analysis found for this role", gapErr);
          setPersonalGapData(null);
        }
      } else {
        setPersonalGapData(null);
      }

      const skillsRes = await api.get(`/users/${user._id}/skills`);
      setUserSkills(skillsRes.data.skills || []);

      const progressRes = await api.get('/learning/my-progress');
      setLearningProgress(progressRes.data.progress || []);

      try {
        const topicProgRes = await api.get('/learning/topics/progress');
        setTopicProgress(topicProgRes.data?.completedTopics || []);
      } catch (topicErr) {
        setTopicProgress([]);
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Failed to retrieve skill journey summary.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id) {
      fetchData();
    }
  }, [user]);

  const handleMarkComplete = async (resourceId, progressObj) => {
    try {
      setLoading(true);
      await api.post(`/learning/${resourceId}/complete`);
      // Open the reassessment modal
      setSelectedProgress(progressObj);
      // Pre-fill existing user proficiency if present
      const skillIdObj = progressObj.resourceId?.skillId;
      const skillIdStr = skillIdObj?._id || skillIdObj;
      const existingSkill = userSkills.find(us => (us.skillId?._id || us.skillId).toString() === skillIdStr?.toString());
      setNewProficiency(existingSkill ? existingSkill.proficiency : 2);
      setNewExperience(existingSkill ? existingSkill.yearsOfExperience : 1);
      setIsModalOpen(true);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to complete course');
    } finally {
      setLoading(false);
      fetchData();
    }
  };

  const handleReassessSubmit = async (e) => {
    e.preventDefault();
    if (!selectedProgress) return;
    setModalSubmitting(true);

    try {
      const skillIdObj = selectedProgress.resourceId?.skillId;
      const skillIdStr = skillIdObj?._id || skillIdObj;
      const existingSkill = userSkills.find(us => (us.skillId?._id || us.skillId).toString() === skillIdStr?.toString());

      if (existingSkill) {
        // PUT update
        await api.put(`/users/${user._id}/skills/${skillIdStr}`, {
          proficiency: Number(newProficiency),
          yearsOfExperience: Number(newExperience)
        });
      } else {
        // POST create
        await api.post(`/users/${user._id}/skills`, {
          skillId: skillIdStr,
          proficiency: Number(newProficiency),
          yearsOfExperience: Number(newExperience),
          source: 'self'
        });
      }

      setIsModalOpen(false);
      setSelectedProgress(null);
    } catch (err) {
      alert(err.response?.data?.error?.message || 'Failed to update skill profile');
    } finally {
      setModalSubmitting(false);
      fetchData();
    }
  };

  if (loading) return <LoadingSpinner message="Opening your skill journey dashboard..." />;
  if (error) return <ErrorState message={error} onRetry={fetchData} />;

  // Dynamic calculations
  const totalSkills = userSkills.length;
  const strongSkills = userSkills.filter(us => us.proficiency >= 4).length;
  const inProgressSkills = userSkills.filter(us => us.proficiency > 0 && us.proficiency < 4).length;
  const skillGapsCount = personalGapData ? personalGapData.skills?.filter(s => s.status !== 'mastered').length : 0;
  const targetRoleName = userProfile?.targetRoleId?.name || 'No Target Selected';
  const readiness = personalGapData ? personalGapData.readinessScore : 0;
  const gapSkillsList = personalGapData ? personalGapData.skills || [] : [];
  const nextRecommended = gapSkillsList.find(s => s.status !== 'mastered')?.skill?.name || 'None';

  // Extract recent activities based on actual database skills list
  const recentActivities = userSkills.slice(0, 3).map((us, i) => ({
    id: us._id,
    type: 'Added skill',
    skillName: us.skillId?.name || 'Skill',
    time: i === 0 ? 'Recently' : `${i + 1} days ago`
  }));

  const SKILL_TOTAL_TOPICS = {
    'HTML': 7,
    'CSS': 7,
    'JavaScript': 10,
    'React': 8,
    'Git': 4,
    'Node.js': 7,
    'Express': 6,
    'MongoDB': 6
  };

  const completedCountMap = {};
  topicProgress.forEach(tp => {
    const sId = (tp.skillId?._id || tp.skillId || '').toString();
    if (sId) {
      completedCountMap[sId] = (completedCountMap[sId] || 0) + 1;
    }
  });

  const activeLearningItems = gapSkillsList.map(gs => {
    const skillDoc = gs.skill;
    if (!skillDoc) return null;

    const sId = skillDoc.id || skillDoc._id;
    const sIdStr = sId?.toString();
    const completedCount = completedCountMap[sIdStr] || 0;
    const totalCount = SKILL_TOTAL_TOPICS[skillDoc.name] || 3;
    const progressPct = Math.round((completedCount / totalCount) * 100);

    return {
      skillId: sIdStr,
      skillName: skillDoc.name,
      completedCount,
      totalCount,
      progressPct
    };
  }).filter(Boolean);

  // Coordinates for rendering the "Your Skill Universe" SVG network dynamically
  const nodeCoordinates = [
    { cx: 160, cy: 110, color: '#6366f1' }, // Center (You)
    { cx: 80, cy: 60, color: '#8b5cf6' },   // Top-Left
    { cx: 240, cy: 60, color: '#0ea5e9' },  // Top-Right
    { cx: 60, cy: 160, color: '#0d9488' },  // Bottom-Left
    { cx: 260, cy: 160, color: '#f43f5e' }, // Bottom-Right
    { cx: 160, cy: 200, color: '#fbbf24' }  // Bottom-Center
  ];

  return (
    <div className="space-y-12 font-sans relative">
      
      {/* 1. Dashboard Visual Hero */}
      <div className="relative rounded-3xl bg-gradient-to-tr from-indigo-50/60 via-white to-pink-50/45 border border-slate-150/40 p-8 md:p-12 shadow-sm overflow-hidden z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[360px]">
        
        {/* Left Side: Typography and CTAs */}
        <div className="lg:col-span-5 flex flex-col space-y-5">
          <div className="inline-flex items-center space-x-2 bg-indigo-50 border border-indigo-100 rounded-full px-3 py-1 text-xs font-bold text-indigo-750 w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Personal Development Workspace</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-black tracking-tight text-slate-900 leading-[1.1]">
            Build Your <span className="text-indigo-650">Skills.</span> <br />
            Shape Your <span className="bg-gradient-to-r from-purple-650 to-pink-500 bg-clip-text text-transparent">Future.</span>
          </h1>

          <p className="text-slate-500 text-xs sm:text-sm leading-relaxed max-w-sm">
            Explore your current skills, discover what you're missing, and follow a personalized path toward your goals.
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              to="/skills"
              className="px-5 py-3 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs uppercase tracking-wider font-extrabold shadow-md shadow-indigo-650/15 flex items-center transition-all hover:scale-[1.02]"
            >
              Explore My Skills
              <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
            </Link>
            <Link
              to="/skill-graph"
              className="px-5 py-3 border border-indigo-100 bg-white hover:bg-slate-50 text-indigo-650 rounded-xl text-xs uppercase tracking-wider font-extrabold transition-all"
            >
              View Skill Graph
            </Link>
          </div>
        </div>

        {/* Right Side: Workspace illustration composition */}
        <div className="lg:col-span-7 flex justify-center relative">
          <div className="absolute top-2 left-16 bg-purple-650 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-md animate-float pointer-events-none">
            React
          </div>
          <div className="absolute top-12 -left-4 bg-indigo-650 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-md animate-float-delayed pointer-events-none">
            Node.js
          </div>
          <div className="absolute bottom-16 right-16 bg-emerald-600 text-white text-[9px] font-bold px-2.5 py-1 rounded-lg shadow-md animate-float-delayed pointer-events-none">
            MongoDB
          </div>

          <svg className="w-full max-w-[420px] h-auto drop-shadow-2xl" viewBox="0 0 500 360" fill="none">
            <path d="M 50 310 Q 250 340 450 310 L 470 340 L 30 340 Z" fill="#e2e8f0" opacity="0.6" />
            
            <g>
              <ellipse cx="410" cy="305" rx="20" ry="6" fill="#1e1b4b" />
              <path d="M 410 300 C 420 250 440 220 420 160" stroke="#1e1b4b" strokeWidth="5" fill="none" />
              <path d="M 420 160 L 380 150" stroke="#1e1b4b" strokeWidth="4" />
              <path d="M 380 135 L 360 165 A 12 12 0 0 0 380 175 L 400 145 Z" fill="#312e81" />
              <polygon points="360,165 200,260 270,310 380,175" fill="#fef08a" opacity="0.12" />
            </g>

            <g>
              <rect x="420" y="200" width="18" height="100" fill="#3b82f6" rx="2" />
              <rect x="440" y="208" width="18" height="92" fill="#8b5cf6" rx="2" />
            </g>

            <g>
              <rect x="180" y="275" width="24" height="30" rx="6" fill="#1e1b4b" />
              <path d="M 180 282 C 170 282 170 298 180 298" stroke="#1e1b4b" strokeWidth="3" fill="none" />
            </g>

            <g>
              <path d="M 215 270 L 235 270 L 230 295 L 220 295 Z" fill="#d1d5db" />
              <path d="M 225 270 Q 210 240 205 210" stroke="#10b981" strokeWidth="2" fill="none" />
              <ellipse cx="205" cy="210" rx="4" ry="8" fill="#10b981" />
              <path d="M 225 270 Q 240 240 245 220" stroke="#10b981" strokeWidth="1.5" fill="none" />
              <ellipse cx="245" cy="220" rx="4" ry="8" fill="#10b981" />
            </g>

            <g>
              <rect x="220" y="280" width="130" height="15" rx="3" fill="#f97316" />
              <rect x="215" y="265" width="140" height="15" rx="3" fill="#fef3c7" />
              <rect x="225" y="250" width="120" height="15" rx="3" fill="#3b82f6" />
            </g>

            <g id="laptop">
              <path d="M 215 240 L 355 240 L 370 252 L 200 252 Z" fill="#475569" />
              <rect x="230" y="150" width="110" height="88" rx="6" fill="#0f172a" stroke="#cbd5e1" strokeWidth="2.5" />
              <rect x="234" y="154" width="102" height="80" rx="3" fill="#1e293b" />
              
              <g id="screen-network" opacity="0.95">
                <line x1="285" y1="194" x2="265" y2="175" stroke="#6366f1" strokeWidth="1" />
                <line x1="285" y1="194" x2="305" y2="175" stroke="#6366f1" strokeWidth="1" />
                <line x1="285" y1="194" x2="260" y2="194" stroke="#8b5cf6" strokeWidth="1" />
                <line x1="285" y1="194" x2="310" y2="194" stroke="#8b5cf6" strokeWidth="1" />
                <line x1="285" y1="194" x2="265" y2="213" stroke="#0ea5e9" strokeWidth="1" />
                
                <circle cx="285" cy="194" r="10" fill="#e0e7ff" stroke="#6366f1" strokeWidth="1" />
                <text x="285" y="196" fontSize="4.5" fontWeight="bold" fill="#312e81" textAnchor="middle">You</text>
                
                <circle cx="265" cy="175" r="5" fill="#1e1b4b" stroke="#6366f1" strokeWidth="0.8" />
                <circle cx="305" cy="175" r="5" fill="#1e1b4b" stroke="#8b5cf6" strokeWidth="0.8" />
                <circle cx="260" cy="194" r="5" fill="#1e1b4b" stroke="#0ea5e9" strokeWidth="0.8" />
                <circle cx="310" cy="194" r="5" fill="#1e1b4b" stroke="#0d9488" strokeWidth="0.8" />
                <circle cx="265" cy="213" r="5" fill="#1e1b4b" stroke="#f43f5e" strokeWidth="0.8" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* 2. Snapshot Cards & Learn Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left Column */}
        <div className="lg:col-span-8 space-y-10">
          
          {/* Snapshot Grid */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Your Skill Snapshot</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Skills', value: totalSkills, desc: 'Logged skills' },
                { label: 'Strong', value: strongSkills, desc: 'Mastered level' },
                { label: 'Growing', value: inProgressSkills, desc: 'In progress' },
                { label: 'Gaps', value: skillGapsCount, desc: 'Needs study' }
              ].map((c, i) => (
                <div key={i} className="bg-white border border-slate-200/50 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                  <h4 className="text-2xl font-black text-slate-800 tracking-tight">{c.value}</h4>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-455 mt-1">{c.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Your Skill Universe */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-4 relative overflow-hidden bg-grid-pattern">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold text-slate-850 tracking-tight">Your Skill Universe</h3>
              <p className="text-[11px] text-slate-450 font-semibold leading-relaxed">
                See how your current skills connect and where your next opportunities lie.
              </p>
            </div>

            <div className="flex justify-center py-4 border-t border-slate-100">
              {userSkills.length === 0 ? (
                <div className="text-center py-8 space-y-4">
                  <p className="text-xs text-slate-500 font-semibold italic">You haven't added any skills yet.</p>
                  <Link
                    to="/skills"
                    className="inline-flex px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 cursor-pointer"
                  >
                    Add Your First Skill
                  </Link>
                </div>
              ) : (
                <svg className="w-full max-w-[340px] h-auto" viewBox="0 0 320 240">
                  {userSkills.slice(0, 5).map((us, idx) => {
                    const targetCoords = nodeCoordinates[idx + 1] || nodeCoordinates[1];
                    return (
                      <line
                        key={`line-${idx}`}
                        x1={nodeCoordinates[0].cx}
                        y1={nodeCoordinates[0].cy}
                        x2={targetCoords.cx}
                        y2={targetCoords.cy}
                        stroke="#e2e8f0"
                        strokeWidth="2"
                      />
                    );
                  })}

                  <g>
                    <circle cx={nodeCoordinates[0].cx} cy={nodeCoordinates[0].cy} r="18" fill="#e0e7ff" stroke="#6366f1" strokeWidth="2.5" />
                    <text x={nodeCoordinates[0].cx} y={nodeCoordinates[0].cy + 3} fontSize="8" fontWeight="bold" fill="#312e81" textAnchor="middle">You</text>
                  </g>

                  {userSkills.slice(0, 5).map((us, idx) => {
                    const coords = nodeCoordinates[idx + 1] || nodeCoordinates[1];
                    const skillInitial = us.skillId?.name?.substring(0, 5) || 'Skill';
                    return (
                      <g key={us._id}>
                        <circle cx={coords.cx} cy={coords.cy} r="14" fill="#ffffff" stroke={coords.color} strokeWidth="2.2" />
                        <text x={coords.cx} y={coords.cy + 3} fontSize="6.5" fontWeight="bold" fill="#334155" textAnchor="middle">
                          {skillInitial}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* Continue Learning */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Continue Learning</h3>
            
            {activeLearningItems.length === 0 ? (
              <div className="bg-white border border-slate-200/50 rounded-3xl p-8 text-center space-y-3 shadow-sm">
                <Bookmark className="w-8 h-8 text-slate-355 mx-auto" />
                <p className="text-xs text-slate-500 font-semibold italic">No target career required skills mapped. Select a target career in Profile or Career Explorer.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {activeLearningItems.map((item) => (
                  <div key={item.skillId} className="bg-white border border-slate-250/30 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between space-y-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center text-[8.5px] font-bold uppercase tracking-wider">
                        <span className="text-indigo-650 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {item.skillName}
                        </span>
                        <span className="text-slate-400">{item.completedCount} / {item.totalCount} topics ({item.progressPct}%)</span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-805 line-clamp-1">{item.skillName} Roadmap</h4>
                    </div>

                    <div className="flex items-center justify-between gap-4 pt-1">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-650" style={{ width: `${item.progressPct}%` }} />
                      </div>
                      
                      <Link
                        to="/learning"
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 text-[10px] font-bold rounded-lg transition-colors flex items-center shrink-0 cursor-pointer text-center"
                      >
                        Continue &rarr;
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Learning Journey */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-5">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">Your Learning Journey</h3>
            
            <div className="flex flex-col space-y-4.5 text-xs font-semibold text-slate-700">
              {[
                { step: 'Discover', desc: 'Explore capabilities catalog' },
                { step: 'Learn', desc: 'Study recommended courses' },
                { step: 'Practice', desc: 'Build inventories levels' },
                { step: 'Grow', desc: 'Unlock targeted career roles' }
              ].map((s, i) => (
                <div key={i} className="flex items-center space-x-3.5">
                  <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-700 font-black text-[10px] flex items-center justify-center shrink-0 border border-indigo-150/40">
                    {i + 1}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-800 text-xs leading-none">{s.step}</h4>
                    <p className="text-[10px] text-slate-400 mt-1">{s.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-slate-100 text-[10px] text-slate-500 italic leading-relaxed text-center p-2">
              "The beautiful thing about learning is that no one can take it away from you."
            </div>
          </div>

          {/* Career Readiness Card */}
          <div className="bg-white border border-slate-200/50 rounded-3xl p-6 shadow-sm space-y-4.5 bg-grid-pattern">
            <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider border-b border-slate-100 pb-3 flex justify-between items-center">
              <span>Goal: {targetRoleName}</span>
              {personalGapData && (
                <span className="text-[10px] text-indigo-650 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-lg font-black">
                  Readiness: {readiness}%
                </span>
              )}
            </h3>

            {personalGapData ? (
              <div className="space-y-4 text-xs font-semibold text-slate-655">
                {/* Visual Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10px] text-slate-450 uppercase font-bold">
                    <span>Career Readiness</span>
                    <span>{readiness}%</span>
                  </div>
                  <div className="h-2 bg-slate-50 border border-slate-150/40 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${readiness}%` }} />
                  </div>
                </div>

                {/* Skills breakdown */}
                <div className="space-y-2">
                  <span className="text-[9px] uppercase font-bold text-slate-400">Target Requirements</span>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {gapSkillsList.map((g, idx) => {
                      const isMastered = g.status === 'mastered';
                      const isGrowing = g.status === 'needs_improvement';
                      return (
                        <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 border border-slate-200/30 rounded-xl">
                          <span className="text-slate-805">{g.skill?.name}</span>
                          <span className={`text-[9px] font-black uppercase tracking-wider ${
                            isMastered ? 'text-emerald-600' : isGrowing ? 'text-indigo-600' : 'text-rose-600'
                          }`}>
                            {isMastered ? 'Satisfied ✓' : isGrowing ? 'In Progress ~' : 'Missing ✗'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Next Recommended */}
                <div className="p-3 bg-indigo-50/40 border border-indigo-100/50 rounded-2xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[8.5px] uppercase font-bold text-indigo-400">Next Recommended Skill</span>
                    <p className="font-extrabold text-indigo-900 text-xs">{nextRecommended}</p>
                  </div>
                  <Link
                    to="/recommendations"
                    className="p-1 bg-white hover:bg-indigo-50 text-indigo-655 rounded-lg shadow-sm border border-indigo-100 transition-colors cursor-pointer"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 space-y-3.5">
                <p className="text-xs text-slate-450 italic">No target career selected yet.</p>
                <Link
                  to="/careers"
                  className="inline-flex px-4 py-2 bg-indigo-650 hover:bg-indigo-750 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/10 cursor-pointer"
                >
                  Choose Target Career
                </Link>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          {recentActivities.length > 0 && (
            <div className="bg-white border border-slate-200/50 rounded-3xl p-5 shadow-sm space-y-3.5">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Recent Activity</h4>
              <div className="space-y-2">
                {recentActivities.map((act) => (
                  <div key={act.id} className="flex justify-between items-center text-[10.5px] font-semibold text-slate-600">
                    <span className="truncate pr-2">{act.type} {act.skillName}</span>
                    <span className="text-[9px] text-slate-400 uppercase shrink-0">{act.time}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* 3. Reassessment Overlay Modal */}
      {isModalOpen && selectedProgress && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="text-center space-y-2">
              <span className="text-3xl">🎉</span>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-800 tracking-tight">Course Completed!</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                Now that you have completed <strong>"{selectedProgress.resourceId?.title}"</strong>, how would you rate your level in <strong>{selectedProgress.resourceId?.skillId?.name}</strong>?
              </p>
            </div>

            <form onSubmit={handleReassessSubmit} className="space-y-4">
              {/* Proficiency selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rate Proficiency (1-5)</label>
                <select
                  value={newProficiency}
                  onChange={(e) => setNewProficiency(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                >
                  <option value="1">1 - Beginner (Novice concepts)</option>
                  <option value="2">2 - Basic (Simple tasks capability)</option>
                  <option value="3">3 - Intermediate (Independent contributor)</option>
                  <option value="4">4 - Advanced (System designs builder)</option>
                  <option value="5">5 - Expert (Mentorship & architecture)</option>
                </select>
              </div>

              {/* Years of Experience */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Years of Experience</label>
                <input
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={newExperience}
                  onChange={(e) => setNewExperience(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsModalOpen(false); setSelectedProgress(null); }}
                  className="flex-1 py-2.5 border border-slate-205 text-slate-650 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Skip Reassessment
                </button>
                <button
                  type="submit"
                  disabled={modalSubmitting}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {modalSubmitting ? 'Updating profile...' : 'Update Skill Level'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Dashboard;
