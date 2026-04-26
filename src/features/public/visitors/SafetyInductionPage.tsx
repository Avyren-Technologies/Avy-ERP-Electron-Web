import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { publicApi } from '@/lib/api/public-client';

interface InductionQuestion {
  question: string;
  options: string[];
  correctIndex: number;
}

interface InductionData {
  required: boolean;
  status?: string;
  message?: string;
  induction?: {
    name: string;
    type: 'VIDEO' | 'SLIDES' | 'QUESTIONNAIRE' | 'DECLARATION';
    contentUrl?: string;
    questions?: InductionQuestion[];
    durationSeconds?: number;
    passingScore?: number;
  };
}

export function SafetyInductionPage() {
  const { visitCode } = useParams<{ visitCode: string }>();
  const [data, setData] = useState<InductionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState<{ passed: boolean; score?: number } | null>(null);

  // Video state
  const [videoWatched, setVideoWatched] = useState(false);
  const [videoTimeRemaining, setVideoTimeRemaining] = useState(0);
  const videoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Questionnaire state
  const [answers, setAnswers] = useState<Record<number, number>>({});

  // Declaration/Slides state
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!visitCode) return;
    publicApi
      .get(`/public/visit/${visitCode}/induction`)
      .then((res) => {
        const result = res.data?.data;
        setData(result);
        // Start video timer if it's a video induction
        if (result?.required && result.induction?.type === 'VIDEO' && result.induction.durationSeconds) {
          setVideoTimeRemaining(result.induction.durationSeconds);
        }
      })
      .catch((err) => {
        if (axios.isAxiosError(err)) {
          setError(err.response?.data?.message || 'Induction not found.');
        } else {
          setError('An unexpected error occurred.');
        }
      })
      .finally(() => setLoading(false));
  }, [visitCode]);

  // Video countdown timer
  const startVideoTimer = () => {
    if (videoTimerRef.current) return;
    videoTimerRef.current = setInterval(() => {
      setVideoTimeRemaining((prev) => {
        if (prev <= 1) {
          if (videoTimerRef.current) clearInterval(videoTimerRef.current);
          videoTimerRef.current = null;
          setVideoWatched(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    };
  }, []);

  const handleSubmitInduction = async (score?: number, passed?: boolean) => {
    if (!visitCode) return;
    setSubmitting(true);
    try {
      const res = await publicApi.post(`/public/visit/${visitCode}/induction`, {
        score,
        passed: passed ?? true,
      });
      const result = res.data?.data;
      setCompleted({ passed: result?.passed ?? passed ?? true, score: result?.score ?? score });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.message || 'Failed to submit induction.');
      } else {
        setError('An unexpected error occurred.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuestionnaireSubmit = () => {
    const questions = data?.induction?.questions ?? [];
    if (questions.length === 0) return;

    const totalQuestions = questions.length;
    const unanswered = totalQuestions - Object.keys(answers).length;
    if (unanswered > 0) {
      setError(`Please answer all questions. ${unanswered} remaining.`);
      return;
    }
    setError(null);

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (answers[idx] === q.correctIndex) {
        correctCount++;
      }
    });

    const score = Math.round((correctCount / totalQuestions) * 100);
    const passingScore = data?.induction?.passingScore ?? 80;
    const passed = score >= passingScore;

    handleSubmitInduction(score, passed);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Loading
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-7 h-7 rounded-full border-2 border-indigo-200 border-t-indigo-600 animate-spin" />
      </div>
    );
  }

  // Error
  if (error && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Induction Not Available</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  // Completed state
  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className={`w-16 h-16 mx-auto mb-4 rounded-full ${completed.passed ? 'bg-green-100' : 'bg-red-100'} flex items-center justify-center`}>
            <svg className={`w-8 h-8 ${completed.passed ? 'text-green-500' : 'text-red-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {completed.passed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              )}
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            {completed.passed ? 'Induction Completed' : 'Induction Failed'}
          </h2>
          <p className="text-gray-500 mb-4">
            {completed.passed
              ? 'You have successfully completed your safety induction. You may now proceed.'
              : 'You did not meet the passing score. Please contact the reception desk for assistance.'}
          </p>
          {completed.score !== undefined && (
            <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${completed.passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              Score: {completed.score}%
            </div>
          )}
          <div className="mt-6">
            <Link
              to={`/visit/${visitCode}/badge`}
              className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
            >
              View Digital Badge
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Not required
  if (!data?.required) {
    const statusLabel = data?.status === 'COMPLETED' ? 'Already Completed' : data?.status === 'FAILED' ? 'Previously Failed' : 'Not Required';
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-indigo-100 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">{statusLabel}</h2>
          <p className="text-gray-500">{data?.message || 'Safety induction is not required for this visit.'}</p>
          <div className="mt-6">
            <Link
              to={`/visit/${visitCode}/badge`}
              className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition"
            >
              View Digital Badge
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const induction = data.induction!;

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-6 py-8 text-white">
          <h1 className="text-2xl font-bold">Safety Induction</h1>
          <p className="text-indigo-100 mt-1">{induction.name}</p>
        </div>

        {/* Content */}
        <div className="bg-white border border-gray-200 rounded-b-2xl shadow-lg px-6 py-6">
          {/* Inline error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}

          {/* VIDEO type */}
          {induction.type === 'VIDEO' && (
            <div className="space-y-4">
              {induction.contentUrl && (
                <div className="aspect-video rounded-lg overflow-hidden bg-black">
                  {induction.contentUrl.includes('youtube.com') || induction.contentUrl.includes('youtu.be') ? (
                    <iframe
                      src={induction.contentUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                      className="w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title="Safety induction video"
                      onLoad={startVideoTimer}
                    />
                  ) : induction.contentUrl.includes('vimeo.com') ? (
                    <iframe
                      src={induction.contentUrl.replace('vimeo.com/', 'player.vimeo.com/video/')}
                      className="w-full h-full"
                      allow="autoplay; fullscreen; picture-in-picture"
                      allowFullScreen
                      title="Safety induction video"
                      onLoad={startVideoTimer}
                    />
                  ) : (
                    <video
                      src={induction.contentUrl}
                      controls
                      className="w-full h-full"
                      onPlay={startVideoTimer}
                    />
                  )}
                </div>
              )}

              {!videoWatched && videoTimeRemaining > 0 && (
                <div className="text-center">
                  <p className="text-sm text-gray-500">
                    Please watch the full video. Time remaining: <span className="font-mono font-semibold text-indigo-600">{formatTime(videoTimeRemaining)}</span>
                  </p>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={videoWatched}
                  disabled={videoTimeRemaining > 0}
                  onChange={(e) => setVideoWatched(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                />
                <span className={`text-sm ${videoTimeRemaining > 0 ? 'text-gray-400' : 'text-gray-700'}`}>
                  I have watched the full video and understand the safety requirements
                </span>
              </label>

              <button
                onClick={() => handleSubmitInduction(undefined, true)}
                disabled={!videoWatched || submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg py-2.5 text-sm transition"
              >
                {submitting ? 'Submitting...' : 'Complete Induction'}
              </button>
            </div>
          )}

          {/* QUESTIONNAIRE type */}
          {induction.type === 'QUESTIONNAIRE' && (
            <div className="space-y-6">
              {induction.passingScore && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-700">
                  Passing score: {induction.passingScore}%. Please answer all questions carefully.
                </div>
              )}

              {(induction.questions as InductionQuestion[] ?? []).map((q, qIdx) => (
                <div key={qIdx} className="border border-gray-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-800 mb-3">
                    {qIdx + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, optIdx) => (
                      <label key={optIdx} className="flex items-center gap-3 cursor-pointer p-2 rounded-lg hover:bg-gray-50 transition">
                        <input
                          type="radio"
                          name={`question-${qIdx}`}
                          checked={answers[qIdx] === optIdx}
                          onChange={() => setAnswers((prev) => ({ ...prev, [qIdx]: optIdx }))}
                          className="h-4 w-4 border-gray-300 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}

              <button
                onClick={handleQuestionnaireSubmit}
                disabled={submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg py-2.5 text-sm transition"
              >
                {submitting ? 'Submitting...' : 'Submit Answers'}
              </button>
            </div>
          )}

          {/* DECLARATION type */}
          {induction.type === 'DECLARATION' && (
            <div className="space-y-4">
              {induction.contentUrl && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  <div className="prose prose-sm text-gray-700 whitespace-pre-wrap">{induction.contentUrl}</div>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  I acknowledge and accept the safety declaration above
                </span>
              </label>

              <button
                onClick={() => handleSubmitInduction(undefined, true)}
                disabled={!acknowledged || submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg py-2.5 text-sm transition"
              >
                {submitting ? 'Submitting...' : 'Accept & Complete Induction'}
              </button>
            </div>
          )}

          {/* SLIDES type */}
          {induction.type === 'SLIDES' && (
            <div className="space-y-4">
              {induction.contentUrl && (
                <div className="text-center">
                  <a
                    href={induction.contentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium rounded-lg text-sm hover:bg-indigo-100 transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Open Safety Slides
                  </a>
                  <p className="text-xs text-gray-400 mt-2">Opens in a new tab</p>
                </div>
              )}

              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledged}
                  onChange={(e) => setAcknowledged(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700">
                  I have reviewed the safety slides and understand the requirements
                </span>
              </label>

              <button
                onClick={() => handleSubmitInduction(undefined, true)}
                disabled={!acknowledged || submitting}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-lg py-2.5 text-sm transition"
              >
                {submitting ? 'Submitting...' : 'Complete Induction'}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
