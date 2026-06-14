import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BsMicFill, BsMicMuteFill, BsTranslate, BsX } from 'react-icons/bs';
import { onCaptionUpdate, sendLiveCaption, startCaptions, stopCaptions } from '../../services/socket';

const MAX_VISIBLE_CAPTIONS = 8;

const LiveCaptions = ({ roomId, user, onClose }) => {
  const [captions, setCaptions] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [language, setLanguage] = useState('en-US');
  const [isMinimized, setIsMinimized] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const recognitionRef = useRef(null);

  // Listen for caption updates from socket
  useEffect(() => {
    onCaptionUpdate((data) => {
      const id = Date.now() + Math.random();
      setCaptions((prev) => {
        const updated = [...prev, {
          id,
          speakerId: data.speakerId,
          speakerName: data.speakerName || 'Speaker',
          text: data.text,
          isFinal: data.isFinal,
          timestamp: data.timestamp || new Date().toISOString()
        }];
        return updated.slice(-MAX_VISIBLE_CAPTIONS * 2);
      });
    });
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [captions]);

  // Start browser Web Speech API
  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Speech recognition not supported in this browser. Use Chrome or Edge.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const isFinal = event.results[i].isFinal;
          sendLiveCaption(roomId, transcript, isFinal, user?._id, user?.name);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          setError(`Recognition error: ${event.error}`);
        }
      };

      recognition.onend = () => {
        // Auto-restart if still listening
        if (isListening) {
          try { recognition.start(); } catch {}
        }
      };

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
      setError(null);
      startCaptions(roomId, language.split('-')[0]);
    } catch (err) {
      setError('Failed to start speech recognition');
    }
  }, [roomId, language, isListening, user]);

  // Stop browser speech recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = null;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    stopCaptions(roomId);
  }, [roomId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const clearCaptions = () => setCaptions([]);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-slate-800 doodle-border dark:border-slate-600 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-200 dark:border-slate-700 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-slate-700 dark:to-slate-700">
        <div className="flex items-center gap-2">
          <BsTranslate className="text-indigo-500" size={18} />
          <h3 className="font-patrick text-lg font-bold dark:text-white">Live Captions</h3>
          {isListening && (
            <span className="flex items-center gap-1 text-xs bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full font-bold">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              LIVE
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setIsMinimized(!isMinimized)} className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-sm dark:text-white">
            {isMinimized ? '□' : '—'}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-rose-100 dark:hover:bg-rose-900 rounded dark:text-white">
            <BsX size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Controls */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 dark:border-slate-700">
            <button
              onClick={toggleListening}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition-all
                ${isListening
                  ? 'bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 hover:bg-red-200'
                  : 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-200'
                }`}
            >
              {isListening ? <BsMicMuteFill size={14} /> : <BsMicFill size={14} />}
              {isListening ? 'Stop' : 'Start'}
            </button>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded px-2 py-1.5 font-sans dark:text-white"
            >
              <option value="en-US">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="es-ES">Spanish</option>
              <option value="fr-FR">French</option>
              <option value="de-DE">German</option>
              <option value="hi-IN">Hindi</option>
              <option value="ja-JP">Japanese</option>
              <option value="ko-KR">Korean</option>
              <option value="zh-CN">Chinese</option>
              <option value="pt-BR">Portuguese</option>
            </select>

            <button
              onClick={clearCaptions}
              className="text-xs px-2 py-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 font-sans"
            >
              Clear
            </button>
          </div>

          {error && (
            <div className="px-3 py-2 bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-700 text-xs text-amber-700 dark:text-amber-300 font-sans">
              {error}
            </div>
          )}

          {/* Captions List */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
            <AnimatePresence>
              {captions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 font-patrick">
                  <BsTranslate size={32} className="mb-2 opacity-40" />
                  <p className="text-sm">No captions yet</p>
                  <p className="text-xs mt-1">Click Start to begin live transcription</p>
                </div>
              ) : (
                captions.map((caption) => (
                  <motion.div
                    key={caption.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className={`p-2.5 rounded-lg text-sm font-sans transition-all
                      ${caption.isFinal
                        ? 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600'
                        : 'bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 italic'
                      }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                        {caption.speakerName || 'Speaker'}
                      </span>
                      {!caption.isFinal && (
                        <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">interim</span>
                      )}
                    </div>
                    <p className="text-slate-700 dark:text-slate-200 leading-relaxed">{caption.text}</p>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>
        </>
      )}
    </div>
  );
};

export default LiveCaptions;
