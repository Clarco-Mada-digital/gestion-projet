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
  Loader2
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
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const category = (() => {
    // D'abord essayer la détection par type MIME et nom de fichier
    const primaryCategory = cloudinaryService.categorizeFile(file.type || '', file.name || '');
    if (primaryCategory !== 'other') return primaryCategory;
    
    // Détection basée sur l'URL pour les fichiers externes
    // Donner la priorité à l'extension de fichier plutôt qu'au chemin
    const url = file.url.toLowerCase();
    
    // Debug logs
    console.log('MediaViewer - File info:', {
      name: file.name,
      type: file.type,
      url: file.url
    });
    
    // Vérifier les extensions en premier (plus fiable)
    if (url.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg|ico)$/i)) {
      console.log('MediaViewer - Detected as image by extension');
      return 'image';
    }
    if (url.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
      console.log('MediaViewer - Detected as audio by extension');
      return 'audio';
    }
    if (url.match(/\.(mp4|mov|avi|webm|mkv|flv)$/i)) {
      console.log('MediaViewer - Detected as video by extension');
      return 'video';
    }
    if (url.match(/\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|rtf|odt|ods|odp|md|csv|json|xml|log|ini|yaml|yml|toml)$/i)) {
      console.log('MediaViewer - Detected as document by extension');
      return 'document';
    }
    
    // Ensuite vérifier les chemins Cloudinary (moins fiable)
    if (url.includes('/image/')) {
      console.log('MediaViewer - Detected as image by path');
      return 'image';
    }
    if (url.includes('/audio/')) {
      console.log('MediaViewer - Detected as audio by path');
      return 'audio';
    }
    if (url.includes('/video/')) {
      console.log('MediaViewer - Detected as video by path (fallback)');
      return 'video'; // seulement si l'extension n'a pas été détectée
    }
    
    console.log('MediaViewer - Could not detect file type, defaulting to other');
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
      
      if (e.key === 'ArrowLeft' && onPrevious) {
        onPrevious();
      } else if (e.key === 'ArrowRight' && onNext) {
        onNext();
      }
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
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    } else if (category === 'audio' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
    setIsPlaying(!isPlaying);
  };

  const handleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
    setCurrentTime(newTime);
  };

  const formatTime = (time: number): string => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

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
          <div className="flex items-center justify-center h-full">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
            )}
            <img
              src={file.url}
              alt={file.name}
              className="max-w-full max-h-full object-contain"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                // En cas d'erreur, on peut afficher un message ou une icône
                console.error('Erreur lors du chargement de l\'image:', file.url);
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center h-full relative">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
              </div>
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
            <div className="w-32 h-32 bg-blue-500 rounded-full flex items-center justify-center">
              <Volume2 className="w-16 h-16 text-white" />
            </div>
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
          <div className={`flex flex-col ${isFullscreen ? 'h-full' : 'items-center justify-center h-full'} space-y-4 p-8`}>
            {!isFullscreen && (
              <div className="w-32 h-32 bg-red-500 rounded-lg flex items-center justify-center">
                <FileText className="w-16 h-16 text-white" />
              </div>
            )}
            <div className={`${isFullscreen ? 'h-full' : 'text-center'} flex-1 flex flex-col`}>
              {!isFullscreen && (
                <>
                  <h3 className="text-xl font-semibold text-white mb-2">{file.name}</h3>
                  <p className="text-gray-300 mb-4">
                    {file.url.toLowerCase().includes('.pdf') ? 'Document PDF' : 'Document'}
                  </p>
                </>
              )}
              
              {/* Aperçu intégré pour les PDF */}
              {file.url.toLowerCase().includes('.pdf') && (
                <div className={`mb-4 w-full ${isFullscreen ? 'h-full' : 'max-w-4xl max-h-96'} bg-white rounded-lg overflow-hidden flex-1`}>
                  <iframe
                    src={file.url}
                    className={`w-full ${isFullscreen ? 'h-full' : 'h-96'} border-0`}
                    title={`Aperçu PDF: ${file.name}`}
                    onError={(e) => {
                      console.error('Erreur lors du chargement du PDF:', file.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Aperçu pour les fichiers texte */}
              {(file.url.toLowerCase().match(/\.(txt|md|csv|json|xml)$/i)) && (
                <div className={`mb-4 w-full ${isFullscreen ? 'h-full' : 'max-w-4xl max-h-96'} bg-white rounded-lg overflow-hidden flex-1`}>
                  <iframe
                    src={file.url}
                    className={`w-full ${isFullscreen ? 'h-full' : 'h-96'} border-0`}
                    title={`Aperçu texte: ${file.name}`}
                    onError={(e) => {
                      console.error('Erreur lors du chargement du fichier texte:', file.url);
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {!isFullscreen && (
                <div className="flex space-x-3">
                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Download className="w-5 h-5" />
                    <span>Télécharger</span>
                  </button>
                  
                  {/* Bouton pour ouvrir dans un nouvel onglet si l'aperçu échoue */}
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className="flex items-center space-x-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                    <span>Ouvrir</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full space-y-8 p-8">
            <div className="w-32 h-32 bg-gray-500 rounded-lg flex items-center justify-center">
              <FileText className="w-16 h-16 text-white" />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-2">{file.name}</h3>
              <p className="text-gray-300 mb-4">Fichier non supporté pour l'aperçu</p>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-5 h-5" />
                <span>Télécharger</span>
              </button>
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
          <button
            onClick={handlePlayPause}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          </button>
          
          <button
            onClick={handleMute}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>

          <div className="flex-1 flex items-center space-x-2">
            <span className="text-white text-sm">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="flex-1 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-white text-sm">{formatTime(duration)}</span>
          </div>

          <button
            onClick={handleFullscreen}
            className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div 
        ref={containerRef}
        className="relative w-full h-full flex flex-col"
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-white font-medium truncate max-w-md">{file.name}</h2>
              <span className="text-gray-300 text-sm">
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* Navigation buttons */}
              {hasMultipleFiles && (
                <>
                  <button
                    onClick={onPrevious}
                    disabled={currentIndex === 0}
                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <span className="text-white text-sm">
                    {currentIndex + 1} / {files.length}
                  </span>
                  <button
                    onClick={onNext}
                    disabled={currentIndex === files.length - 1}
                    className="p-2 text-white hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              <button
                onClick={handleDownload}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title="Télécharger"
              >
                <Download className="w-5 h-5" />
              </button>

              <button
                onClick={onClose}
                className="p-2 text-white hover:bg-white/20 rounded-full transition-colors"
                title="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Media Content */}
        <div className="flex-1 flex items-center justify-center">
          {renderMediaContent()}
        </div>

        {/* Media Controls */}
        {renderMediaControls()}

        {/* Loading overlay */}
        {isLoading && category !== 'document' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        )}
      </div>
    </div>
  );
}
