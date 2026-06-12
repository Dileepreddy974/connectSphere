import { useState, useEffect, useRef } from 'react';
import socketService from '../../services/socket';
import { messageService } from '../../services';

const ChatPanel = ({ roomId, user, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await messageService.getRoomMessages(roomId);
        setMessages(response.data);
      } catch (err) {
        console.error('Failed to fetch messages:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();

    // Listen for incoming messages
    socketService.onReceiveMessage((message) => {
      if (message.roomId === roomId) {
        setMessages((prev) => [...prev, message]);
      }
    });

    return () => {
      const socket = socketService.getSocket();
      socket.off('receive-message');
    };
  }, [roomId]);

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      roomId,
      content: newMessage,
      senderId: {
        _id: user._id,
        name: user.name
      },
      createdAt: new Date().toISOString()
    };

    try {
      // 1. Emit via socket for instant delivery
      socketService.sendSocketMessage(roomId, messageData);
      
      // 2. Persist to database
      await messageService.sendMessage({
        roomId,
        content: newMessage
      });

      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  return (
    <aside className="w-80 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h3 className="text-sm font-bold flex items-center gap-2">
          <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
          Group Chat
        </h3>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors px-3 py-1 hover:bg-slate-800 rounded-lg font-semibold"
        >
          Close
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-4 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center px-4">
            <div className="text-2xl mb-2">No messages</div>
            <p className="text-xs font-medium uppercase tracking-tight">No messages yet</p>
            <p className="text-[10px] opacity-70">Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isSelf = msg.senderId._id === user._id || msg.senderId === user._id;
            return (
              <div 
                key={msg._id || index} 
                className={`flex flex-col ${isSelf ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-2 mb-1 px-1">
                  {!isSelf && <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-tighter">{msg.senderId.name}</span>}
                  <span className="text-[9px] text-slate-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div 
                  className={`max-w-[90%] px-4 py-2 text-sm rounded-2xl shadow-sm ${
                    isSelf 
                      ? 'bg-indigo-600 text-white rounded-tr-none' 
                      : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-800">
        <form onSubmit={handleSendMessage} className="relative flex items-end gap-2">
          <div className="flex-1 relative">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage(e);
                }
              }}
              placeholder="Type your message..."
              rows="1"
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-sm outline-none focus:border-indigo-500 transition-all resize-none max-h-32 text-slate-200 placeholder:text-slate-600"
            />
          </div>
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white px-4 py-2 rounded-2xl transition-all shadow-lg active:scale-95 flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
            <span className="text-sm font-bold">Send</span>
          </button>
        </form>
      </div>
    </aside>
  );
};

export default ChatPanel;
