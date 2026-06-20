import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BsBarChartFill, BsX, BsArrowClockwise, BsLightning, BsChatQuote, BsQuestionCircle } from 'react-icons/bs';
import { aiService } from '../../services';

const SENTIMENT_COLORS = {
  positive: 'text-green-600 dark:text-green-400',
  neutral: 'text-slate-500 dark:text-slate-400',
  negative: 'text-red-600 dark:text-red-400',
  mixed: 'text-amber-600 dark:text-amber-400'
};

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500',
  'bg-purple-500', 'bg-cyan-500', 'bg-pink-500', 'bg-teal-500'
];

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}m ${s}s`;
};

const SpeakerAnalytics = ({ roomId, onClose }) => {
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [expandedSpeaker, setExpandedSpeaker] = useState(null);
  const [error, setError] = useState(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiService.getSpeakerAnalytics(roomId);
      setAnalytics(res.data || []);
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      await aiService.generateSpeakerAnalytics(roomId);
      await fetchAnalytics();
    } catch (err) {
      setError(err.message || 'Failed to analyze speakers.');
    } finally {
      setAnalyzing(false);
    }
  };

  // Calculate total talk time for percentage bars
  const totalTalkTime = analytics.reduce((sum, s) => sum + (s.totalSpeakTime || 0), 0);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 doodle-border dark:border-slate-600 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-slate-700 dark:to-slate-700">
        <div className="flex items-center gap-2">
          <BsBarChartFill className="text-purple-500" size={18} />
          <h3 className="font-patrick text-lg font-bold dark:text-white">Speaker Analytics</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded dark:text-white">
          <BsX size={18} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <button
          onClick={handleAnalyze}
          disabled={analyzing}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold font-sans hover:bg-purple-200 transition disabled:opacity-50"
        >
          <BsLightning size={12} />
          {analyzing ? 'Analyzing...' : 'Analyze Speakers'}
        </button>
        <button onClick={fetchAnalytics} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <BsArrowClockwise size={14} />
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-xs text-amber-700 dark:text-amber-300 font-sans">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : analytics.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 font-patrick">
            <BsBarChartFill size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No analytics yet</p>
            <p className="text-xs mt-1 text-center">Analyze speakers from meeting captions</p>
          </div>
        ) : (
          <>
            {/* Talk Time Distribution Bar */}
            <div className="mb-2">
              <p className="text-[10px] font-sans font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Talk Time Distribution</p>
              <div className="h-4 rounded-full overflow-hidden flex">
                {analytics.map((speaker, i) => {
                  const pct = totalTalkTime > 0 ? ((speaker.totalSpeakTime / totalTalkTime) * 100) : 0;
                  return (
                    <div
                      key={speaker._id}
                      className={`${AVATAR_COLORS[i % AVATAR_COLORS.length]} transition-all`}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                      title={`${speaker.userName}: ${pct.toFixed(1)}%`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Speaker Cards */}
            {analytics.map((speaker, i) => {
              const pct = totalTalkTime > 0 ? ((speaker.totalSpeakTime / totalTalkTime) * 100).toFixed(1) : 0;
              const isExpanded = expandedSpeaker === speaker._id;
              
              return (
                <motion.div
                  key={speaker._id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600 cursor-pointer hover:shadow-md transition"
                  onClick={() => setExpandedSpeaker(isExpanded ? null : speaker._id)}
                >
                  {/* Top Row */}
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 ${AVATAR_COLORS[i % AVATAR_COLORS.length]} rounded-full flex items-center justify-center text-white font-bold text-sm font-sans shrink-0`}>
                      {speaker.userName?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold font-sans text-slate-800 dark:text-white truncate">{speaker.userName}</h4>
                        <span className="text-xs font-sans text-purple-600 dark:text-purple-400 font-bold">{pct}%</span>
                      </div>
                      {/* Talk time bar */}
                      <div className="h-1.5 bg-slate-200 dark:bg-slate-600 rounded-full mt-1 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: i * 0.15 }}
                          className={`h-full ${AVATAR_COLORS[i % AVATAR_COLORS.length]} rounded-full`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
                      {formatDuration(speaker.totalSpeakTime || 0)}
                    </span>
                    <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
                      {speaker.wordCount || 0} words
                    </span>
                    <span className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
                      {speaker.wordsPerMinute || 0} wpm
                    </span>
                    <span className={`text-[10px] font-sans font-bold ${SENTIMENT_COLORS[speaker.sentiment?.label] || SENTIMENT_COLORS.neutral}`}>
                      {speaker.sentiment?.label || 'neutral'}
                    </span>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-2"
                    >
                      {/* Topics */}
                      {speaker.topics?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1">Topics</p>
                          <div className="flex flex-wrap gap-1">
                            {speaker.topics.map((t, j) => (
                              <span key={j} className="text-[10px] bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Questions */}
                      {speaker.questions?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <BsQuestionCircle size={10} /> Questions ({speaker.questions.length})
                          </p>
                          {speaker.questions.slice(0, 3).map((q, j) => (
                            <p key={j} className="text-[11px] font-sans text-slate-600 dark:text-slate-300 italic">
                              &ldquo;{q}&rdquo;
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Filler Words */}
                      {(speaker.fillerWords?.total || 0) > 0 && (
                        <div>
                          <p className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                            <BsChatQuote size={10} /> Filler Words ({speaker.fillerWords.total})
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(speaker.fillerWords.breakdown || {}).map(([word, count]) => (
                              <span key={word} className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded-full">
                                {word}: {count}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interruptions */}
                      {(speaker.interruptions || 0) > 0 && (
                        <p className="text-[10px] font-sans text-slate-500 dark:text-slate-400">
                          Interruptions: <span className="font-bold text-red-500">{speaker.interruptions}</span>
                        </p>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default SpeakerAnalytics;
