import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Target,
  Compass,
  Award,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Clock,
  Layers,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const PROFICIENCY_LABELS = {
  1: 'Novice (Basic syntax & fundamentals)',
  2: 'Familiar (Can build simple features with docs)',
  3: 'Working Competence (Independent builder)',
  4: 'Advanced (Deep architectural understanding)',
  5: 'Expert (System-level mastery & optimization)'
};

const Onboarding = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [roles, setRoles] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);

  // Form State
  const [selectedRoleId, setSelectedRoleId] = useState(user?.targetRoleId?._id || user?.targetRoleId || '');
  const [experienceLevel, setExperienceLevel] = useState(user?.experienceLevel || 'beginner');
  const [weeklyStudyHours, setWeeklyStudyHours] = useState(user?.weeklyStudyHours || 10);
  const [primaryFocus, setPrimaryFocus] = useState(user?.primaryFocus || 'Full Stack Development');
  const [userSkills, setUserSkills] = useState({}); // { skillId: proficiency }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [rolesRes, skillsRes, userSkillsRes] = await Promise.all([
          api.get('/roles'),
          api.get('/skills'),
          user?._id ? api.get(`/users/${user._id}/skills`).catch(() => ({ data: { skills: [] } })) : Promise.resolve({ data: { skills: [] } })
        ]);

        const loadedRoles = rolesRes?.data?.roles || rolesRes?.data || [];
        const loadedSkills = skillsRes?.data?.skills || skillsRes?.data || [];
        setRoles(loadedRoles);
        setAvailableSkills(loadedSkills);

        if (!selectedRoleId && loadedRoles.length > 0) {
          setSelectedRoleId(loadedRoles[0]._id);
        }

        // Preload any existing skills
        const existing = {};
        const userSkillsList = userSkillsRes?.data?.skills || [];
        userSkillsList.forEach(us => {
          if (us.skillId?._id || us.skillId) {
            existing[us.skillId?._id || us.skillId] = us.proficiency;
          }
        });
        setUserSkills(existing);
      } catch (err) {
        toast.error('Failed to load career setup options');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleToggleSkill = (skillId) => {
    setUserSkills(prev => {
      const copy = { ...prev };
      if (copy[skillId]) {
        delete copy[skillId];
      } else {
        copy[skillId] = 2; // Default proficiency: familiar
      }
      return copy;
    });
  };

  const handleProficiencyChange = (skillId, val) => {
    setUserSkills(prev => ({
      ...prev,
      [skillId]: Number(val)
    }));
  };

  const handleComplete = async () => {
    try {
      setSubmitting(true);
      const formattedSkills = Object.entries(userSkills).map(([skillId, proficiency]) => ({
        skillId,
        proficiency
      }));

      const payload = {
        targetRoleId: selectedRoleId,
        experienceLevel,
        weeklyStudyHours,
        primaryFocus,
        skills: formattedSkills
      };

      const res = await api.post('/users/onboarding', payload);
      toast.success('Career Profile configured successfully!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to complete setup');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9F6] flex items-center justify-center">
        <LoadingSpinner message="Preparing your career orientation..." />
      </div>
    );
  }

  const selectedRole = roles.find(r => r._id === selectedRoleId);

  return (
    <div className="min-h-screen bg-[#FAF9F6] text-zinc-900 flex flex-col font-sans">
      {/* Header */}
      <header className="w-full bg-white border-b border-zinc-200/80 py-4 px-6 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
              SG
            </div>
            <span className="font-extrabold text-base tracking-tight">Career Launchpad</span>
          </div>
          <div className="text-xs font-semibold text-zinc-500">
            Step {step} of 4
          </div>
        </div>
      </header>

      {/* Progress Line */}
      <div className="w-full bg-zinc-200 h-1">
        <div
          className="bg-indigo-600 h-1 transition-all duration-300"
          style={{ width: `${(step / 4) * 100}%` }}
        />
      </div>

      {/* Wizard Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-10 flex flex-col justify-between">
        <div className="space-y-8">
          
          {/* STEP 1: TARGET ROLE */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase flex items-center gap-1.5">
                  <Compass className="w-4 h-4" /> Career Direction
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
                  What role are you targeting next?
                </h1>
                <p className="text-sm text-zinc-600 max-w-xl">
                  SkillGraph uses industry skill requirements for this role to calculate your personalized career readiness score and topic learning path.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {roles.map(role => {
                  const isSelected = selectedRoleId === role._id;
                  return (
                    <div
                      key={role._id}
                      onClick={() => setSelectedRoleId(role._id)}
                      className={`p-5 rounded-2xl border-2 cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/40 shadow-sm'
                          : 'border-zinc-200/90 bg-white hover:border-zinc-300 hover:shadow-xs'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-bold text-zinc-900 text-base">{role.name}</h3>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                          isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 text-zinc-600'
                        }`}>
                          {role.level || 'Mid'}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 line-clamp-2 mb-3">
                        {role.description || 'Core engineering role in modern software development.'}
                      </p>
                      <div className="text-[11px] font-semibold text-zinc-400">
                        Department: <span className="text-zinc-600">{role.department || 'Engineering'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: EXPERIENCE & HABITS */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase flex items-center gap-1.5">
                  <Target className="w-4 h-4" /> Study Commitment
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
                  Your baseline & weekly schedule
                </h1>
                <p className="text-sm text-zinc-600 max-w-xl">
                  Setting honest baselines ensures recommendations are tailored to your pace.
                </p>
              </div>

              {/* Experience Level */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Current Professional Experience Level
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'beginner', title: 'Beginner', desc: 'Student, bootcamp grad, or transitioning career' },
                    { id: 'intermediate', title: 'Intermediate', desc: '1–3 years experience or solid foundation' },
                    { id: 'advanced', title: 'Advanced', desc: '3+ years experience seeking lead/senior mastery' }
                  ].map(lvl => (
                    <div
                      key={lvl.id}
                      onClick={() => setExperienceLevel(lvl.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        experienceLevel === lvl.id
                          ? 'border-indigo-600 bg-indigo-50/40 font-bold'
                          : 'border-zinc-200 bg-white hover:border-zinc-300'
                      }`}
                    >
                      <p className="text-sm font-bold text-zinc-900">{lvl.title}</p>
                      <p className="text-xs text-zinc-500 mt-1">{lvl.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly Study Hours */}
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                    Weekly Learning Goal
                  </label>
                  <span className="text-sm font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    {weeklyStudyHours} hours / week
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {[5, 10, 15, 20].map(hrs => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setWeeklyStudyHours(hrs)}
                      className={`py-3 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                        weeklyStudyHours === hrs
                          ? 'border-indigo-600 bg-indigo-600 text-white'
                          : 'border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300'
                      }`}
                    >
                      {hrs} hrs
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Focus */}
              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Primary Learning Area
                </label>
                <input
                  type="text"
                  value={primaryFocus}
                  onChange={(e) => setPrimaryFocus(e.target.value)}
                  placeholder="e.g. MERN Stack, Cloud Systems, React Native"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-sm bg-white"
                />
              </div>
            </div>
          )}

          {/* STEP 3: LOG SKILLS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <span className="text-xs font-bold text-indigo-600 tracking-wider uppercase flex items-center gap-1.5">
                  <Award className="w-4 h-4" /> Skills Inventory
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
                  Select the technologies you already know
                </h1>
                <p className="text-sm text-zinc-600 max-w-xl">
                  Pick the skills you have worked with. You will verify them via targeted assessments next.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 pt-2">
                  {availableSkills.map(skill => {
                    const isSelected = Boolean(userSkills[skill._id]);
                    return (
                      <button
                        key={skill._id}
                        type="button"
                        onClick={() => handleToggleSkill(skill._id)}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white text-zinc-700 border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {skill.name}
                      </button>
                    );
                  })}
                </div>

                {/* Sliders for Selected Skills */}
                {Object.keys(userSkills).length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-zinc-200">
                    <h3 className="text-xs font-bold text-zinc-600 uppercase tracking-wider">
                      Rate Your Current Proficiency
                    </h3>
                    <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                      {Object.entries(userSkills).map(([skillId, prof]) => {
                        const skillObj = availableSkills.find(s => s._id === skillId);
                        return (
                          <div
                            key={skillId}
                            className="p-3 bg-white border border-zinc-200/90 rounded-xl space-y-2"
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-bold text-xs text-zinc-900">
                                {skillObj?.name || 'Skill'}
                              </span>
                              <span className="text-[11px] font-bold text-indigo-600">
                                Level {prof}/5 — {PROFICIENCY_LABELS[prof]?.split('(')[0]}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="5"
                              value={prof}
                              onChange={(e) => handleProficiencyChange(skillId, e.target.value)}
                              className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 4: PROJECTION SUMMARY */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="space-y-2">
                <span className="text-xs font-bold text-emerald-600 tracking-wider uppercase flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Ready to Launch
                </span>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900">
                  Career Plan Summary
                </h1>
                <p className="text-sm text-zinc-600 max-w-xl">
                  Here is what your career pathway looks like based on your goals.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                
                <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 space-y-2 shadow-xs">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Target Goal</span>
                  <p className="text-lg font-black text-indigo-700">{selectedRole?.name || 'Engineer'}</p>
                  <p className="text-xs text-zinc-500">{selectedRole?.description?.slice(0, 70)}...</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 space-y-2 shadow-xs">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Logged Skills</span>
                  <p className="text-lg font-black text-zinc-900">{Object.keys(userSkills).length} Technologies</p>
                  <p className="text-xs text-zinc-500">Ready for skill verification assessments</p>
                </div>

                <div className="p-5 rounded-2xl bg-white border border-zinc-200/80 space-y-2 shadow-xs">
                  <span className="text-zinc-400 text-xs font-bold uppercase tracking-wider">Study Rhythm</span>
                  <p className="text-lg font-black text-emerald-600">{weeklyStudyHours} hrs / week</p>
                  <p className="text-xs text-zinc-500">Experience level: <span className="capitalize font-semibold">{experienceLevel}</span></p>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/60 border border-indigo-100 flex items-start space-x-3.5">
                <CheckCircle2 className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                <div className="text-xs text-indigo-900 space-y-1">
                  <p className="font-bold">Next Steps on Your Career Command Center:</p>
                  <ul className="list-disc list-inside space-y-0.5 text-indigo-750">
                    <li>Take your first verified skill assessment to earn credibility badges</li>
                    <li>Inspect your exact skill gaps vs target job specifications</li>
                    <li>Add hands-on project evidence to demonstrate real-world competence</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Navigation Buttons */}
        <div className="pt-10 flex justify-between items-center border-t border-zinc-200 mt-8">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </button>
          ) : <div />}

          {step < 4 ? (
            <button
              type="button"
              onClick={() => setStep(s => s + 1)}
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              Continue <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleComplete}
              disabled={submitting}
              className="px-8 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-sm flex items-center gap-2 shadow-md shadow-indigo-200 transition-all disabled:opacity-50"
            >
              {submitting ? 'Setting Up...' : 'Enter Career Command Center'}
              <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default Onboarding;
