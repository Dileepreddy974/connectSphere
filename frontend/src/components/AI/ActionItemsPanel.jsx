import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsCheckSquare, BsX, BsArrowClockwise, BsLightning, BsTrash } from 'react-icons/bs';
import { aiService } from '../../services';

const PRIORITY_COLORS = {
  critical: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700',
  high: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700',
  medium: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700',
  low: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700'
};

const STATUS_ICONS = {
  pending: '○',
  'in-progress': '◐',
  completed: '●',
  cancelled: '✕'
};

const ActionItemsPanel = ({ roomId, onClose }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const statusFilter = filter === 'all' ? null : filter;
      const res = await aiService.getActionItems(roomId, statusFilter);
      setItems(res.data || []);
    } catch (err) {
      console.error('Failed to fetch action items', err);
    } finally {
      setLoading(false);
    }
  }, [roomId, filter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleExtract = async () => {
    setExtracting(true);
    setError(null);
    try {
      await aiService.extractActionItems(roomId);
      await fetchItems();
    } catch (err) {
      setError(err.message || 'Failed to extract action items.');
    } finally {
      setExtracting(false);
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'pending' : 
                        currentStatus === 'pending' ? 'in-progress' : 'completed';
    try {
      await aiService.updateActionItem(id, { status: nextStatus });
      setItems(prev => prev.map(item => item._id === id ? { ...item, status: nextStatus } : item));
    } catch (err) {
      console.error('Failed to update status', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await aiService.deleteActionItem(id);
      setItems(prev => prev.filter(item => item._id !== id));
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const counts = {
    all: items.length,
    pending: items.filter(i => i.status === 'pending').length,
    'in-progress': items.filter(i => i.status === 'in-progress').length,
    completed: items.filter(i => i.status === 'completed').length
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 doodle-border dark:border-slate-600 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-slate-700 dark:to-slate-700">
        <div className="flex items-center gap-2">
          <BsCheckSquare className="text-amber-500" size={18} />
          <h3 className="font-patrick text-lg font-bold dark:text-white">Action Items</h3>
          <span className="text-xs bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded-full font-bold font-sans">
            {items.length}
          </span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded dark:text-white">
          <BsX size={18} />
        </button>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
        <button
          onClick={handleExtract}
          disabled={extracting}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 rounded-lg text-xs font-bold font-sans hover:bg-amber-200 transition disabled:opacity-50"
        >
          <BsLightning size={12} />
          {extracting ? 'Extracting...' : 'Extract from Meeting'}
        </button>
        <button onClick={fetchItems} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
          <BsArrowClockwise size={14} />
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-1 px-3 py-2 border-b border-slate-100 dark:border-slate-700 text-xs font-sans font-bold overflow-x-auto">
        {['all', 'pending', 'in-progress', 'completed'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-2 py-1 rounded whitespace-nowrap transition ${
              filter === f
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {f === 'in-progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
            {counts[f] > 0 && <span className="ml-1 opacity-60">({counts[f]})</span>}
          </button>
        ))}
      </div>

      {error && (
        <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/30 text-xs text-amber-700 dark:text-amber-300 font-sans">
          {error}
        </div>
      )}

      {/* Items List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 font-patrick">
            <BsCheckSquare size={32} className="mb-2 opacity-40" />
            <p className="text-sm">No action items</p>
            <p className="text-xs mt-1">Extract items from meeting captions</p>
          </div>
        ) : (
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={item._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className={`p-3 rounded-lg border font-sans transition-all
                  ${item.status === 'completed' 
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' 
                    : 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600'
                  }`}
              >
                <div className="flex items-start gap-2">
                  {/* Status Toggle */}
                  <button
                    onClick={() => handleToggleStatus(item._id, item.status)}
                    className={`mt-0.5 text-lg transition-colors ${
                      item.status === 'completed' ? 'text-green-500' : 'text-slate-300 hover:text-indigo-500'
                    }`}
                  >
                    {STATUS_ICONS[item.status]}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug ${
                      item.status === 'completed' ? 'line-through text-slate-400 dark:text-slate-500' : 'text-slate-700 dark:text-slate-200'
                    }`}>
                      {item.text}
                    </p>

                    {/* Meta */}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      {/* Priority */}
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.medium}`}>
                        {item.priority}
                      </span>

                      {/* Assignee */}
                      {item.assignee?.name && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400">
                          → {item.assignee.name}
                        </span>
                      )}

                      {/* Speaker context */}
                      {item.context?.speakerName && (
                        <span className="text-[10px] text-indigo-500 dark:text-indigo-400 italic">
                          said by {item.context.speakerName}
                        </span>
                      )}
                    </div>

                    {/* Tags */}
                    {item.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {item.tags.map((tag, j) => (
                          <span key={j} className="text-[9px] bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="p-1 text-slate-300 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition"
                  >
                    <BsTrash size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default ActionItemsPanel;
