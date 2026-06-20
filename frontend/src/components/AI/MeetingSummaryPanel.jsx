import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { BsFileText, BsLightning, BsX, BsArrowClockwise, BsStar, BsEmojiSmile } from 'react-icons/bs';
import { aiService } from '../../services';

const MeetingSummaryPanel = ({ roomId, onClose }) => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const [error, setError] = useState(null);

  const fetchSummaries = useCallback(async () => {
    setLoading(true);
    try {
      const res = await aiService.getSummaries(roomId);
      setSummaries(res.data || []);
    } catch (err) {
      console.error('Failed to fetch summaries', err);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  // Fetch existing summaries
  useEffect(() => {
    fetchSummaries();
  }, [fetchSummaries]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      await aiService.generateSummary(roomId);
      await fetchSummaries();
    } catch (err) {
      setError(err.message || 'Failed to generate summary. Ensure captions have been recorded.');
    } finally {
      setGenerating(false);
    }
  };

  const latest = summaries[0];

  const sentimentEmoji = {
    positive: '😊', neutral: '😐', negative: '😟', mixed: '🤔'
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 doodle-border dark:border-slate-600 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-slate-700 dark:to-slate-700">
        <div className="flex items-center gap-2">
          <BsFileText className="text-emerald-500" size={18} />
          <h3 className="font-patrick text-lg font-bold dark:text-white">Meeting Summary</h3>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded dark:text-white">
          <BsX size={18} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 rounded-lg text-xs font-bold font-sans hover:bg-emerald-200 transition disabled:opacity-50"
        >
          <BsLightning size={12} />
          {generating ? 'Generating...' : 'Generate Summary'}
        </button>
        <button onClick={fetchSummaries} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <BsArrowClockwise size={14} />
        </button>
      </div>

      {error && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-xs text-amber-700 dark:text-amber-300 font-sans">
          {error}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : !latest ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 font-patrick">
            <BsFileText size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No summaries yet</p>
            <p className="text-xs mt-1">Generate a summary from meeting captions</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Tabs */}
            <div className="flex gap-1 text-xs font-sans font-bold border-b border-slate-200 dark:border-slate-600 pb-2">
              {['summary', 'keyPoints', 'topics', 'participants'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-2.5 py-1 rounded-t transition ${
                    activeTab === tab
                      ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {tab === 'keyPoints' ? 'Key Points' : tab === 'participants' ? 'People' : tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            {/* Summary Tab */}
            {activeTab === 'summary' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {latest.title && (
                  <h4 className="text-base font-patrick font-bold dark:text-white flex items-center gap-2">
                    <BsStar className="text-amber-400" size={14} />
                    {latest.title}
                  </h4>
                )}
                <p className="text-sm font-sans text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {latest.summary}
                </p>
                {/* Sentiment */}
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700">
                  <BsEmojiSmile className="text-slate-400" size={14} />
                  <span className="text-xs font-sans font-bold text-slate-500 dark:text-slate-400">Sentiment:</span>
                  <span className="text-lg">{sentimentEmoji[latest.sentiment?.overall] || '😐'}</span>
                  <span className="text-xs font-sans text-slate-500 dark:text-slate-400 capitalize">
                    {latest.sentiment?.overall || 'neutral'}
                  </span>
                </div>
              </motion.div>
            )}

            {/* Key Points Tab */}
            {activeTab === 'keyPoints' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {(latest.keyPoints || []).map((point, i) => (
                  <div key={i} className="flex gap-2 p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800">
                    <span className="text-emerald-500 font-bold text-xs font-sans mt-0.5">{i + 1}</span>
                    <p className="text-sm font-sans text-slate-700 dark:text-slate-200">{point}</p>
                  </div>
                ))}
                {(!latest.keyPoints || latest.keyPoints.length === 0) && (
                  <p className="text-sm text-slate-400 font-sans text-center py-4">No key points extracted</p>
                )}
              </motion.div>
            )}

            {/* Topics Tab */}
            {activeTab === 'topics' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {(latest.topics || []).map((topic, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <h5 className="text-sm font-bold font-sans text-slate-800 dark:text-white">{topic.topic}</h5>
                    <p className="text-xs font-sans text-slate-500 dark:text-slate-400 mt-1">{topic.description}</p>
                  </div>
                ))}
                {(!latest.topics || latest.topics.length === 0) && (
                  <p className="text-sm text-slate-400 font-sans text-center py-4">No topics identified</p>
                )}
              </motion.div>
            )}

            {/* Participants Tab */}
            {activeTab === 'participants' && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                {(latest.participantSummary || []).map((p, i) => (
                  <div key={i} className="p-2.5 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-200 dark:border-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold font-sans text-slate-800 dark:text-white">{p.name}</span>
                      <span className="text-xs font-sans text-emerald-600 dark:text-emerald-400 font-bold">
                        {p.contributions} contributions
                      </span>
                    </div>
                    {(p.mainTopics || []).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.mainTopics.map((t, j) => (
                          <span key={j} className="text-[10px] font-sans bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {(!latest.participantSummary || latest.participantSummary.length === 0) && (
                  <p className="text-sm text-slate-400 font-sans text-center py-4">No participant data</p>
                )}
              </motion.div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingSummaryPanel;
