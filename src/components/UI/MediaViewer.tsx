import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Download,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  ChevronLeft,
  ChevronRight,
  FileText,
  Eye,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw
} from 'lucide-react';
import { UploadedFile, cloudinaryService } from '../../services/collaboration/cloudinaryService';

interface MediaViewerProps {
  file: UploadedFile;
  files?: UploadedFile[];
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export function MediaViewer({
  file,
  files = [],
  isOpen,
  onClose,
  onNext,
  onPrevious
}: MediaViewerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [rotation, setRotation] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const category = (() => {
    const primaryCategory = cloudinaryService.categorizeFile(file.type || '', file.name || '');
    if (primaryCategory !== 'other') return primaryCategory;

    const url = file.url.toLowerCase();

    if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i)) return 'image';
    if (url.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) return 'audio';
    if (url.match(/\.(mp4|mov|avi|webm|mkv|flv)$/i)) return 'video';
    if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp|md|csv|json|xml|log|ini|yaml|yml|toml)$/i)) return 'document';

    if (url.includes('/image/')) return 'image';
    if (url.includes('/audio/')) return 'audio';
    if (url.includes('/video/')) return 'video';

    return 'other';
  })();

  const currentIndex = files.findIndex(f => f.url === file.url);
  const hasMultipleFiles = files.length > 1;

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isFullscreen) {
          handleFullscreen();
        } else {
          onClose();
        }
      }
    };

    const handleKeyboardNavigation = (e: KeyboardEvent) => {
      if (!hasMultipleFiles) return;
      if (e.key === 'ArrowLeft' && onPrevious) onPrevious();
      else if (e.key === 'ArrowRight' && onNext) onNext();
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      document.addEventListener('keydown', handleKeyboardNavigation);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.removeEventListener('keydown', handleKeyboardNavigation);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isFullscreen, onClose, onPrevious, onNext, hasMultipleFiles]);

  const handlePlayPause = () => {
    if (category === 'video' && videoRef.current) {
      if (isPlaying) videoRef.current.pause();
      else videoRef.current.play();
    } else if (category === 'audio' && audioRef.current) {
      if (isPlaying) audioRef.current.pause();
      else audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    if (videoRef.current) videoRef.current.muted = !isMuted;
    if (audioRef.current) audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) containerRef.current.requestFullscreen();
      setZoomLevel(1);
      setRotation(0);
    } else {
      if (document.exitFullscreen) document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleTimeUpdate = () => {
    const ref = category === 'video' ? videoRef.current : audioRef.current;
    if (ref) {
      setCurrentTime(ref.currentTime);
      setDuration(ref.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    const ref = category === 'video' ? videoRef.current : audioRef.current;
    if (ref) ref.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.5, 5));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const resetZoom = () => { setZoomLevel(1); setRotation(0); };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = file.url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMediaContent = () => {
    switch (category) {
      case 'image':
        return (
          <div className="flex items-center justify-center h-full w-full relative overflow-auto custom-scrollbar">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/20">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            <div
              className="min-h-full min-w-full flex items-center justify-center p-12"
              style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
            >
              <div
                className="relative transition-all duration-200 ease-out origin-center"
                style={{
                  transform: `scale(${zoomLevel}) rotate(${rotation}deg)`,
                  width: 'fit-content',
                  height: 'fit-content'
                }}
              >
                <img
                  src={file.url}
                  alt={file.name}
                  className="max-w-[85vw] max-h-[75vh] object-contain shadow-2xl rounded-sm"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
              </div>
            </div>

            <div className="absolute bottom-4 left-4 flex items-center space-x-2 bg-black/60 backdrop-blur-sm rounded-lg p-2 z-30">
              <button onClick={handleZoomOut} className="p-1 text-white hover:bg-white/20 rounded transition-colors"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-white text-xs font-medium min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={handleZoomIn} className="p-1 text-white hover:bg-white/20 rounded transition-colors"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={handleRotate} className="p-1 text-white hover:bg-white/20 rounded transition-colors"><RotateCw className="w-4 h-4" /></button>
              <button onClick={resetZoom} className="p-1 text-white hover:bg-white/20 rounded transition-colors"><X className="w-4 h-4" /></button>
            </div>
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>
            )}
            <video
              ref={videoRef}
              src={file.url}
              className="max-w-full max-h-full object-contain"
              onLoadedData={() => setIsLoading(false)}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              controls={false}
            />
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
            <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center"><Volume2 className="w-16 h-16 text-white" /></div>
            <audio
              ref={audioRef}
              src={file.url}
              onLoadedData={() => setIsLoading(false)}
              onTimeUpdate={handleTimeUpdate}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">{file.name}</h3>
              <p className="text-gray-300">Audio Player</p>
            </div>
          </div>
        );

      case 'document':
        return (
          <div className={`flex flex-col ${isFullscreen ? 'h-full' : 'items-center justify-center h-full'} p-4`}>
            <div className={`${isFullscreen ? 'h-full' : 'w-screen flex-1'} flex flex-col`}>
              {file.url.toLowerCase().includes('.pdf') && (
                <div className={`flex-1 ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-14rem)]'} bg-white rounded-lg overflow-hidden shadow-2xl`}>
                  <iframe src={file.url} className="w-full h-full border-0" title={`Aperçu PDF: ${file.name}`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
              )}

              {file.url.toLowerCase().match(/\.(txt|md|csv|json|xml)$/i) && (
                <div className={`flex-1 ${isFullscreen ? 'h-[calc(100vh-8rem)]' : 'h-[calc(100vh-14rem)]'} bg-white rounded-lg overflow-hidden shadow-2xl`}>
                  <iframe src={file.url} className="w-full h-full border-0" title={`Aperçu texte: ${file.name}`}
                    onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                </div>
              )}

              {!file.url.toLowerCase().includes('.pdf') && !file.url.toLowerCase().match(/\.(txt|md|csv|json|xml)$/i) && (
                <div className="flex-1 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-400 rounded-lg flex items-center justify-center mb-4"><FileText className="w-8 h-8 text-white" /></div>
                    <h3 className="text-gray-700 font-medium mb-2">{file.name}</h3>
                    <p className="text-gray-500 text-sm mb-4">Aperçu non disponible</p>
                    <div className="flex justify-center space-x-3">
                      <button onClick={handleDownload} className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"><Download className="w-4 h-4" /><span>Télécharger</span></button>
                      <button onClick={() => window.open(file.url, '_blank')} className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"><Eye className="w-4 h-4" /><span>Ouvrir</span></button>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between p-3 bg-gray-800/50 w-full lg:w-1/2 mx-auto backdrop-blur-sm rounded-lg border border-gray-700/50 mt-4">
                <div className="flex items-center space-x-3 text-left">
                  <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-white" /></div>
                  <div className="min-w-0">
                    <h3 className="text-white font-medium text-sm truncate">{file.name}</h3>
                    <p className="text-gray-300 text-xs">
                      {file.url.toLowerCase().includes('.pdf') ? 'PDF' :
                        file.url.toLowerCase().match(/\.(doc|docx)$/i) ? 'Word' :
                          file.url.toLowerCase().match(/\.(xls|xlsx)$/i) ? 'Excel' :
                            file.url.toLowerCase().match(/\.(ppt|pptx)$/i) ? 'PowerPoint' : 'Document'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button onClick={handleDownload} className="p-2 text-blue-400 hover:text-blue-300 hover:bg-white/10 rounded-lg transition-all" title="Télécharger"><Download className="w-4 h-4" /></button>
                  <button onClick={() => window.open(file.url, '_blank')} className="p-2 text-gray-400 hover:text-gray-300 hover:bg-white/10 rounded-lg transition-all" title="Ouvrir"><Eye className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
            <div className="w-32 h-32 bg-gray-500 rounded-lg flex items-center justify-center"><FileText className="w-16 h-16 text-white" /></div>
            <div className="text-center text-white">
              <h3 className="text-xl font-semibold mb-2">{file.name}</h3>
              <p className="text-gray-300 mb-4">Fichier non supporté</p>
              <button onClick={handleDownload} className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"><Download className="w-5 h-5" /><span>Télécharger</span></button>
            </div>
          </div>
        );
    }
  };

  const renderMediaControls = () => {
    if (category !== 'video' && category !== 'audio') return null;
    return (
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-center space-x-4">
          <button onClick={handlePlayPause} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">{isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}</button>
          <button onClick={handleMute} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">{isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}</button>
          <div className="flex-1 flex items-center space-x-2">
            <span className="text-white text-sm">{formatTime(currentTime)}</span>
            <input type="range" min="0" max={duration || 0} value={currentTime} onChange={handleSeek} className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer" />
            <span className="text-white text-sm">{formatTime(duration)}</span>
          </div>
          <button onClick={handleFullscreen} className="p-2 text-white hover:bg-white/20 rounded-full transition-colors">{isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}</button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div ref={containerRef} className="relative w-screen h-screen flex flex-col">
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <h2 className="text-white font-medium truncate text-sm">{file.name}</h2>
              <span className="text-gray-300 text-xs flex-shrink-0">{category}</span>
            </div>
            <div className="flex items-center space-x-1 flex-shrink-0">
              {hasMultipleFiles && (
                <>
                  <button onClick={onPrevious} disabled={currentIndex === 0} className="p-1.5 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
                  <span className="text-white text-xs min-w-[3rem] text-center">{currentIndex + 1} / {files.length}</span>
                  <button onClick={onNext} disabled={currentIndex === files.length - 1} className="p-1.5 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
                </>
              )}
              <button onClick={handleDownload} className="p-1.5 text-white hover:bg-white/20 rounded-full transition-colors" title="Télécharger"><Download className="w-4 h-4" /></button>
              <button onClick={onClose} className="p-1.5 text-white hover:bg-white/20 rounded-full transition-colors" title="Fermer"><X className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">{renderMediaContent()}</div>
        {renderMediaControls()}
        {isLoading && category !== 'document' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50"><Loader2 className="w-8 h-8 animate-spin text-white" /></div>
        )}
      </div>
    </div>
  );
}
