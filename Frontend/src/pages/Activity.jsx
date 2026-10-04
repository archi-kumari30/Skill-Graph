import React, { useState, useEffect } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Flame,
  Clock,
  CalendarCheck,
  Plus,
  CheckCircle2,
  Award,
  FolderGit2,
  BookOpen,
  Sparkles,
  BarChart2,
  X
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const ACTIVITY_ICONS = {
  topic_completed: BookOpen,
  assessment_passed: Award,
  assessment_attempted: Award,
  project_added: FolderGit2,
  practice_session: Clock,
  skill_added: Sparkles
};

const Activity = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [details, setDetails] = useState('');
  const [minutesSpent, setMinutesSpent] = useState(30);

  const fetchActivity = async () => {
    try {
      setLoading(true);
      const res = await api.get('/activity');
      setSummary(res?.data);
    } catch (err) {
      toast.error('Failed to load activity summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const handleLogSubmit = async (e) => {
    e.preventDefault();
    if (!title) {
      toast.error('Please enter a session title');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/activity', {
        title,
        details,
        minutesSpent: Number(minutesSpent),
        activityType: 'practice_session'
      });

      toast.success('Study session recorded!');
      setModalOpen(false);
      setTitle('');
      setDetails('');
      setMinutesSpent(30);
      fetchActivity();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to log practice');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Calculating study streaks and activity logs..." />;
  }

  const streak = summary?.streak || 0;
  const hoursThisWeek = summary?.hoursThisWeek || 0;
  const totalHours = summary?.totalHours || 0;
  const last7Days = summary?.last7Days || [];
  const recentActivities = summary?.recentActivities || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      
      {/* Hero Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" /> Daily Habits & Mastery
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-zinc-900 tracking-tight">
            Study Activity & Streaks
          </h1>
          <p className="text-sm text-zinc-600">
            Consistent deliberate practice is the single strongest predictor of career advancement. Track your daily learning sessions, maintain your active streak, and monitor your weekly study output.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm shadow-indigo-200 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> Log Study Session
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Streak Card */}
        <div className="bg-white p-6 rounded-3xl border border-amber-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0">
            <Flame className="w-7 h-7 fill-amber-500 text-amber-500" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Current Streak</p>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900">{streak} Days</p>
            <span className="text-xs text-amber-700 font-semibold">
              {streak > 0 ? 'Consistent momentum active!' : 'Complete an activity today to start!'}
            </span>
          </div>
        </div>

        {/* Weekly Hours */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">This Week</p>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900">{hoursThisWeek} Hours</p>
            <span className="text-xs text-zinc-500 font-semibold">Dedicated study & building</span>
          </div>
        </div>

        {/* Total Time */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200/80 shadow-xs flex items-center space-x-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0">
            <CalendarCheck className="w-7 h-7" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">Total Output</p>
            <p className="text-2xl sm:text-3xl font-black text-zinc-900">{totalHours} Hours</p>
            <span className="text-xs text-emerald-700 font-semibold">Cumulative lifetime progress</span>
          </div>
        </div>
      </div>

      {/* 7-Day Chart Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="font-extrabold text-lg text-zinc-900">7-Day Study Output</h2>
            <p className="text-xs text-zinc-500">Minutes practiced per day</p>
          </div>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Last 7 Days
          </span>
        </div>

        <div className="grid grid-cols-7 gap-2 sm:gap-4 pt-4 items-end h-44">
          {last7Days.map((day, idx) => {
            const heightPercent = Math.min(100, Math.max(10, (day.minutes / 90) * 100));
            const hasActivity = day.minutes > 0;

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end space-y-2">
                <span className="text-[10px] font-bold text-zinc-400">
                  {day.minutes}m
                </span>
                <div
                  className={`w-full rounded-xl transition-all duration-300 ${
                    hasActivity
                      ? 'bg-indigo-600 shadow-xs hover:bg-indigo-700'
                      : 'bg-zinc-150'
                  }`}
                  style={{ height: `${heightPercent}%` }}
                  title={`${day.date}: ${day.minutes} minutes`}
                />
                <span className="text-xs font-bold text-zinc-600 uppercase">
                  {day.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-6">
        <h2 className="font-extrabold text-lg text-zinc-900">Recent Progress Events</h2>

        {recentActivities.length === 0 ? (
          <p className="text-xs text-zinc-500 py-4 text-center">No recent activities logged yet.</p>
        ) : (
          <div className="space-y-4">
            {recentActivities.map(act => {
              const Icon = ACTIVITY_ICONS[act.activityType] || Clock;

              return (
                <div
                  key={act._id}
                  className="flex items-start space-x-3.5 p-4 rounded-2xl bg-[#FAF9F6] border border-zinc-200/80 hover:border-zinc-300 transition-colors"
                >
                  <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-xs">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <p className="text-xs sm:text-sm font-bold text-zinc-900 truncate">
                        {act.title}
                      </p>
                      <span className="text-[11px] font-semibold text-zinc-400 whitespace-nowrap ml-2">
                        {act.date}
                      </span>
                    </div>
                    {act.details && (
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                        {act.details}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-zinc-200 text-zinc-600">
                        +{act.minutesSpent} mins
                      </span>
                      <span className="text-[10px] font-semibold text-zinc-400 capitalize">
                        {act.activityType?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Log Activity Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-100">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-zinc-200">
            
            <div className="flex justify-between items-center pb-2 border-b border-zinc-100">
              <h2 className="text-lg font-extrabold text-zinc-900">
                Log Study or Practice Session
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLogSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Built MongoDB aggregation queries"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Duration (Minutes) *
                </label>
                <input
                  type="number"
                  required
                  min="5"
                  max="480"
                  value={minutesSpent}
                  onChange={e => setMinutesSpent(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider">
                  Notes & Accomplishments
                </label>
                <textarea
                  rows={3}
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  placeholder="What concepts did you practice or build today?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-600/30 focus:border-indigo-600 text-xs sm:text-sm bg-white"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-zinc-300 text-xs font-bold text-zinc-700 hover:bg-zinc-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Recording...' : 'Log Practice'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};

export default Activity;
