import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import {
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  RotateCcw,
  Network,
  BookOpen
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const AssessmentRunner = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { questionId: selectedOptionId }
  const [secondsRemaining, setSecondsRemaining] = useState(0);

  // Result state
  const [result, setResult] = useState(null);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/assessments/${id}`);
        const data = res?.data;
        if (!data) {
          toast.error('Assessment not found');
          navigate('/assessments');
          return;
        }
        setAssessment(data);
        setSecondsRemaining((data.timeLimitMinutes || 15) * 60);
      } catch (err) {
        toast.error('Failed to load assessment');
        navigate('/assessments');
      } finally {
        setLoading(false);
      }
    };

    fetchAssessment();
  }, [id, navigate]);

  // Countdown timer
  useEffect(() => {
    if (!assessment || result || secondsRemaining <= 0) return;

    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true); // Auto submit on expiration
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [assessment, result, secondsRemaining]);

  const handleSelectOption = (questionId, optionId) => {
    if (result) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionId
    }));
  };

  const handleSubmit = async (auto = false) => {
    if (submitting || result) return;

    if (!auto && Object.keys(selectedAnswers).length < (assessment?.questions?.length || 0)) {
      const confirmSubmit = window.confirm(
        `You have answered ${Object.keys(selectedAnswers).length} of ${assessment.questions.length} questions. Are you sure you want to submit?`
      );
      if (!confirmSubmit) return;
    }

    try {
      setSubmitting(true);
      const answersPayload = (assessment?.questions || []).map(q => ({
        questionId: q._id,
        selectedOptionId: selectedAnswers[q._id] || ''
      }));

      const res = await api.post(`/assessments/${id}/submit`, {
        answers: answersPayload
      });

      setResult(res.data);
      if (res.data?.passed) {
        toast.success(`Congratulations! Passed with ${res.data.score}%!`);
      } else {
        toast.error(`Scored ${res.data.score}%. Passing threshold is ${res.data.passingScore}%.`);
      }
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Failed to submit assessment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner message="Preparing test questions..." />
      </div>
    );
  }

  const questions = assessment?.questions || [];
  const currentQ = questions[currentIndex];
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const isTimerLow = secondsRemaining < 120;

  // RENDER TEST RESULT SCREEN
  if (result) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-200">
        
        {/* Outcome Card */}
        <div className={`p-8 rounded-3xl border text-center space-y-4 ${
          result.passed
            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/60 border-amber-200 text-amber-950'
        }`}>
          <div className="inline-flex p-3 rounded-2xl bg-white shadow-xs">
            {result.passed ? (
              <CheckCircle2 className="w-12 h-12 text-emerald-600" />
            ) : (
              <AlertCircle className="w-12 h-12 text-amber-600" />
            )}
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-black">
              {result.passed ? 'Skill Verification Confirmed!' : 'Assessment Attempt Recorded'}
            </h1>
            <p className="text-xs sm:text-sm font-semibold opacity-80">
              {result.passed
                ? `You have earned an official verified badge in ${assessment?.skillId?.name}!`
                : `You scored ${result.score}%. Review the explanations below and try again to verify.`}
            </p>
          </div>

          <div className="inline-flex items-center gap-6 bg-white py-3 px-8 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Your Score</p>
              <p className="text-2xl font-black text-zinc-900">{result.score}%</p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Passing Score</p>
              <p className="text-2xl font-black text-zinc-900">{result.passingScore}%</p>
            </div>
            <div className="w-px h-8 bg-zinc-200" />
            <div>
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Correct</p>
              <p className="text-2xl font-black text-zinc-900">{result.correctCount}/{result.totalQuestions}</p>
            </div>
          </div>
        </div>

        {/* Strong / Weak Topic Insights */}
        {(result.weakTopics?.length > 0 || result.strongTopics?.length > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {result.strongTopics?.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-emerald-100 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Strong Competencies
                </span>
                <ul className="text-xs text-zinc-700 space-y-1 font-semibold list-disc list-inside">
                  {result.strongTopics.map((t, idx) => <li key={idx}>{t}</li>)}
                </ul>
              </div>
            )}
            {result.weakTopics?.length > 0 && (
              <div className="p-5 rounded-2xl bg-white border border-amber-100 shadow-xs space-y-2">
                <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Recommended Study Topics
                </span>
                <ul className="text-xs text-zinc-700 space-y-1 font-semibold list-disc list-inside">
                  {result.weakTopics.map((t, idx) => <li key={idx}>{t}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Detailed Question Review */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-6">
          <h2 className="font-extrabold text-lg text-zinc-900">Question by Question Review</h2>

          <div className="space-y-6 divide-y divide-zinc-100">
            {result.answers?.map((ans, idx) => {
              return (
                <div key={ans.questionId} className="pt-6 first:pt-0 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <p className="text-sm font-bold text-zinc-900">
                      {idx + 1}. {ans.prompt}
                    </p>
                    {ans.isCorrect ? (
                      <span className="text-xs font-bold text-emerald-600 flex items-center gap-1 shrink-0 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-600 flex items-center gap-1 shrink-0 bg-rose-50 px-2.5 py-0.5 rounded-full">
                        <XCircle className="w-3.5 h-3.5" /> Incorrect
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-700 space-y-1">
                    <p className="font-semibold text-zinc-500">Explanation:</p>
                    <p>{ans.explanation}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Post Result Navigation Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4">
          <Link
            to="/assessments"
            className="px-5 py-2.5 rounded-xl border border-zinc-300 text-zinc-700 hover:bg-zinc-100 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" /> All Assessments
          </Link>
          <div className="flex items-center space-x-3">
            <Link
              to="/skill-graph"
              className="px-5 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs flex items-center gap-1.5 transition-colors"
            >
              <Network className="w-3.5 h-3.5" /> View on Skill Graph
            </Link>
            <Link
              to="/dashboard"
              className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all"
            >
              Back to Command Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

      </div>
    );
  }

  // RENDER ACTIVE ASSESSMENT TEST INTERFACE
  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-200">
      
      {/* Test Header with Timer & Progress */}
      <div className="bg-white rounded-3xl p-6 border border-zinc-200/90 shadow-xs flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            {assessment?.skillId?.name} Assessment
          </span>
          <h1 className="text-lg font-extrabold text-zinc-900">{assessment?.title}</h1>
        </div>

        {/* Timer */}
        <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-2xl border font-mono font-bold text-sm ${
          isTimerLow
            ? 'bg-rose-50 border-rose-200 text-rose-600 animate-pulse'
            : 'bg-zinc-50 border-zinc-200 text-zinc-700'
        }`}>
          <Clock className="w-4 h-4" />
          <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
        </div>
      </div>

      {/* Progress Dots / Bar */}
      <div className="flex items-center gap-2">
        {questions.map((q, idx) => {
          const isAnswered = Boolean(selectedAnswers[q._id]);
          const isCurrent = idx === currentIndex;
          return (
            <button
              key={q._id}
              onClick={() => setCurrentIndex(idx)}
              className={`h-2 flex-1 rounded-full transition-all ${
                isCurrent
                  ? 'bg-indigo-600'
                  : isAnswered
                  ? 'bg-indigo-200'
                  : 'bg-zinc-200'
              }`}
              title={`Question ${idx + 1}`}
            />
          );
        })}
      </div>

      {/* Question Card */}
      {currentQ && (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/90 shadow-xs space-y-6">
          <div className="flex justify-between items-center text-xs font-bold text-zinc-400">
            <span>Question {currentIndex + 1} of {questions.length}</span>
            <span className="capitalize">{currentQ.difficulty || 'Intermediate'} level</span>
          </div>

          <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 leading-snug">
            {currentQ.prompt}
          </h2>

          {/* Optional Code Snippet */}
          {currentQ.codeSnippet && (
            <pre className="p-4 rounded-2xl bg-zinc-900 text-zinc-100 font-mono text-xs overflow-x-auto leading-relaxed border border-zinc-800">
              <code>{currentQ.codeSnippet}</code>
            </pre>
          )}

          {/* Options */}
          <div className="space-y-3 pt-2">
            {currentQ.options?.map(opt => {
              const isSelected = selectedAnswers[currentQ._id] === opt.id;
              return (
                <div
                  key={opt.id}
                  onClick={() => handleSelectOption(currentQ._id, opt.id)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center space-x-3 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs'
                      : 'border-zinc-200 hover:border-zinc-300 bg-white'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-600 text-white'
                      : 'border-zinc-300'
                  }`}>
                    {isSelected && <span className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-zinc-800">{opt.text}</span>
                </div>
              );
            })}
          </div>

          {/* Question Nav Controls */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => setCurrentIndex(i => Math.max(0, i - 1))}
              disabled={currentIndex === 0}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 disabled:opacity-30 disabled:pointer-events-none flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Previous
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex(i => Math.min(questions.length - 1, i + 1))}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                Next <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {submitting ? 'Submitting...' : 'Submit Assessment'}
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default AssessmentRunner;
