import { useState, useEffect } from 'react';
import { fileService } from '../../services';

const FilePanel = ({ roomId, onClose }) => {
  const [files, setFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadError, setUploadError] = useState(null);

  const fetchFiles = async () => {
    try {
      const response = await fileService.getRoomFiles(roomId);
      setFiles(response.data);
    } catch (err) {
      console.error('Failed to fetch files:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await fileService.uploadFile(file, roomId);
      // If API returned success flag false, surface message
      if (res && res.success === false) {
        setUploadError(res.message || 'Upload failed');
      } else {
        fetchFiles(); // Refresh list
      }
    } catch (err) {
      console.error('Upload failed:', err);
      const msg = err?.message || err?.error || JSON.stringify(err);
      setUploadError(msg || 'File upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = async (fileId, fileName) => {
    try {
      const blob = await fileService.downloadFile(fileId);
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <aside className="w-80 bg-slate-900 border border-slate-800 rounded-3xl flex flex-col overflow-hidden shadow-2xl animate-in slide-in-from-right duration-300">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/80">
        <h3 className="text-sm font-bold flex items-center gap-2 text-slate-900">
          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
          Shared Files
        </h3>
        <button 
          onClick={onClose}
          className="text-slate-500 hover:text-slate-900 transition-colors p-1 hover:bg-slate-100 rounded-lg"
        >
          ✕
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-slate-500 text-xs">
            Loading files...
          </div>
        ) : files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-600 text-center px-4">
            <div className="text-2xl mb-2">📁</div>
            <p className="text-xs font-medium uppercase tracking-tight">No files shared</p>
            <p className="text-[10px] opacity-70">Upload resources for the team.</p>
          </div>
        ) : (
          files.map((file) => (
            <div key={file._id} className="bg-white border border-slate-200 rounded-2xl p-3 group hover:border-indigo-500 transition">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-900 truncate" title={file.fileName}>
                    {file.fileName}
                  </p>
                  <p className="text-[10px] text-slate-500">
                    {formatSize(file.fileSize)} • {new Date(file.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button 
                  onClick={() => handleDownload(file._id, file.fileName)}
                  className="p-2 bg-white hover:bg-indigo-600 rounded-xl transition text-slate-500 hover:text-white border"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="p-4 bg-white/90 backdrop-blur-sm border-t border-slate-200">
        {uploadError && (
          <div className="mb-2 text-xs text-red-600">{uploadError}</div>
        )}
        <label className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-2xl cursor-pointer transition-all shadow active:scale-95 font-semibold text-sm">
          {isUploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
              <span>Upload File</span>
            </>
          )}
          <input 
            type="file" 
            className="hidden" 
            onChange={handleFileUpload}
            disabled={isUploading}
          />
        </label>
        <p className="text-[9px] text-center text-slate-500 mt-2">Max file size: 100MB</p>
      </div>
    </aside>
  );
};

export default FilePanel;
