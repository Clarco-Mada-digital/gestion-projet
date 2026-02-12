import { createContext, useState, ReactNode, useEffect, useContext } from 'react';
import { UploadedFile } from '../services/collaboration/cloudinaryService';
import { MediaViewer } from '../components/UI/MediaViewer';

interface ModalOptions {
  title?: string;
  content: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

interface ModalContextType {
  openModal: (options: ModalOptions) => void;
  closeModal: () => void;
  modalContent: React.ReactNode | null;
  isModalOpen: boolean;
  openMediaViewer: (file: UploadedFile, files?: UploadedFile[]) => void;
  closeMediaViewer: () => void;
  mediaViewerFile: UploadedFile | null;
  mediaViewerFiles: UploadedFile[];
  isMediaViewerOpen: boolean;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal doit être utilisé dans un ModalProvider');
  }
  return context;
};

interface ModalProviderProps {
  children: React.ReactNode;
}

export const ModalProvider: React.FC<ModalProviderProps> = ({ children }) => {
  const [modalContent, setModalContent] = useState<React.ReactNode | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mediaViewerFile, setMediaViewerFile] = useState<UploadedFile | null>(null);
  const [mediaViewerFiles, setMediaViewerFiles] = useState<UploadedFile[]>([]);
  const [isMediaViewerOpen, setIsMediaViewerOpen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  const openModal = (options: ModalOptions) => {
    setModalContent(
      <div className="relative p-6 rounded-lg bg-white dark:bg-gray-800 shadow-lg">
        {options.title && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {options.title}
            </h2>
            <button
              onClick={closeModal}
              className="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className={`space-y-4 ${options.size === 'lg' ? 'max-w-2xl' : ''}`}>
          {options.content}
        </div>
      </div>
    );
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setModalContent(null);
    setIsModalOpen(false);
  };

  const openMediaViewer = (file: UploadedFile, files: UploadedFile[] = []) => {
    setMediaViewerFile(file);
    setMediaViewerFiles(files.length > 0 ? files : [file]);
    setCurrentMediaIndex(files.length > 0 ? files.findIndex(f => f.url === file.url) : 0);
    setIsMediaViewerOpen(true);
  };

  const closeMediaViewer = () => {
    setMediaViewerFile(null);
    setMediaViewerFiles([]);
    setIsMediaViewerOpen(false);
    setCurrentMediaIndex(0);
  };

  const handleNextMedia = () => {
    if (currentMediaIndex < mediaViewerFiles.length - 1) {
      const nextIndex = currentMediaIndex + 1;
      setCurrentMediaIndex(nextIndex);
      setMediaViewerFile(mediaViewerFiles[nextIndex]);
    }
  };

  const handlePreviousMedia = () => {
    if (currentMediaIndex > 0) {
      const prevIndex = currentMediaIndex - 1;
      setCurrentMediaIndex(prevIndex);
      setMediaViewerFile(mediaViewerFiles[prevIndex]);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  return (
    <ModalContext.Provider value={{ 
      openModal, 
      closeModal, 
      modalContent, 
      isModalOpen,
      openMediaViewer,
      closeMediaViewer,
      mediaViewerFile,
      mediaViewerFiles,
      isMediaViewerOpen
    }}>
      {children}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal} />
          <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div
              className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {modalContent}
              <div className="sticky bottom-0 bg-white dark:bg-gray-800 px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600"
                  onClick={closeModal}
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* MediaViewer Modal */}
      {mediaViewerFile && (
        <MediaViewer
          file={mediaViewerFile}
          files={mediaViewerFiles}
          isOpen={isMediaViewerOpen}
          onClose={closeMediaViewer}
          onNext={mediaViewerFiles.length > 1 ? handleNextMedia : undefined}
          onPrevious={mediaViewerFiles.length > 1 ? handlePreviousMedia : undefined}
        />
      )}
    </ModalContext.Provider>
  );
}
