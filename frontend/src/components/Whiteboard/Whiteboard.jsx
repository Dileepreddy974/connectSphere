import { useEffect, useRef, useState } from 'react';
import socketService from '../../services/socket';

const Whiteboard = ({ roomId }) => {
  const canvasRef = useRef(null);
  const contextRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#6366f1'); // Indigo-500
  const [brushSize, setBrushSize] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    const resizeCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.round(rect.width * ratio);
      canvas.height = Math.round(rect.height * ratio);
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const context = canvas.getContext('2d');
      context.scale(ratio, ratio);
      context.lineCap = 'round';
      context.strokeStyle = color;
      context.lineWidth = brushSize;
      contextRef.current = context;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Listen for remote drawing
    const socketListener = (update) => {
      if (update.roomId === roomId) {
        drawRemote(update.data);
      }
    };
    socketService.onWhiteboardUpdate(socketListener);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      const socket = socketService.getSocket();
      if (socket && socket.off) socket.off('whiteboard-update', socketListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  useEffect(() => {
    if (contextRef.current) {
      contextRef.current.strokeStyle = color;
      contextRef.current.lineWidth = brushSize;
    }
  }, [color, brushSize]);

  const startDrawing = (event) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX || event.touches?.[0]?.clientX) - rect.left;
    const y = (event.clientY || event.touches?.[0]?.clientY) - rect.top;
    contextRef.current.beginPath();
    contextRef.current.moveTo(x, y);
    setIsDrawing(true);
    // Emit start so remote peers begin a new path
    socketService.updateWhiteboard(roomId, {
      x,
      y,
      color,
      brushSize,
      type: 'start'
    });
  };

  const draw = (event) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (event.clientX || event.touches?.[0]?.clientX) - rect.left;
    const y = (event.clientY || event.touches?.[0]?.clientY) - rect.top;
    contextRef.current.lineTo(x, y);
    contextRef.current.stroke();

    // Emit drawing data
    socketService.updateWhiteboard(roomId, {
      x,
      y,
      color,
      brushSize,
      type: 'draw'
    });
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    contextRef.current.closePath();
    setIsDrawing(false);
    // Emit end of path
    socketService.updateWhiteboard(roomId, { type: 'end' });
  };

  const drawRemote = (data) => {
    const context = contextRef.current;
    if (!context) return;

    if (data.type === 'start') {
      context.beginPath();
      context.moveTo(data.x, data.y);
      context.strokeStyle = data.color;
      context.lineWidth = data.brushSize;
    } else if (data.type === 'draw') {
      context.strokeStyle = data.color;
      context.lineWidth = data.brushSize;
      context.lineTo(data.x, data.y);
      context.stroke();
    } else if (data.type === 'end') {
      context.closePath();
      context.beginPath(); // Prepare for next path
    } else if (data.type === 'clear') {
      context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const context = contextRef.current;
    // clear using CSS size coordinates
    const rect = canvas.getBoundingClientRect();
    context.clearRect(0, 0, rect.width, rect.height);
    socketService.updateWhiteboard(roomId, { type: 'clear' });
  };

  return (
    <div className="flex-1 flex flex-col bg-white rounded-3xl overflow-hidden shadow-inner">
      <div className="p-3 bg-slate-100 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            {[ '#6366f1', '#ef4444', '#22c55e', '#f59e0b', '#000000' ].map(c => (
              <button
                key={c}
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full border-2 transition ${color === c ? 'border-slate-400 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="h-6 w-px bg-slate-300" />
          <input 
            type="range" 
            min="1" 
            max="20" 
            value={brushSize} 
            onChange={(e) => setBrushSize(parseInt(e.target.value))}
            className="w-24 accent-indigo-500"
          />
        </div>
        <button 
          onClick={clearCanvas}
          className="text-xs font-bold text-rose-500 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition"
        >
          CLEAR BOARD
        </button>
      </div>
      <canvas
        ref={canvasRef}
        className="flex-1 cursor-crosshair touch-none"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
        onPointerDown={startDrawing}
        onPointerMove={draw}
        onPointerUp={stopDrawing}
      />
    </div>
  );
};

export default Whiteboard;
