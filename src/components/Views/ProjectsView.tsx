import React, { useState, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Plus, FolderOpen, MoreHorizontal, Edit, Trash2, Archive, AlertTriangle, Calendar, Cpu, ChevronDown, Loader2, LogOut, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { firebaseService } from '../../services/collaboration/firebaseService';
import { Card } from '../UI/Card';
import { Button } from '../UI/Button';
import { Modal } from '../UI/Modal';
import { CoverImageUpload } from '../UI/CoverImageUpload';
import { Project, Task, AISettings as AISettingsType, DEFAULT_AI_SETTINGS } from '../../types';
import { AISettings } from '../Settings/AISettings';
import { EditTaskForm } from '../Tasks/EditTaskForm';
import { Tabs, Form, Input, Select, Row, Col, InputNumber, message } from 'antd';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Fonction pour nettoyer le markdown mal formé
const cleanMarkdown = (text: string): string => {
  if (!text) return text;
  
  return text
    .replace(/\*\*\*+/g, '**')
    .replace(/\*\*(.*?)\*\*/g, '**$1**')
    .replace(/\*\*([^*]*?)\*\*/g, '**$1**');
};

// Types pour les composants Ant Design
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

// Types pour les props personnalisées
interface FormItemProps {
  label: React.ReactNode;
  required?: boolean;
  children: React.ReactNode;
}

interface SelectOptionProps {
  value: string | number;
  children: React.ReactNode;
  disabled?: boolean;
}

interface CustomFormItemProps {
  children: React.ReactNode;
  label: React.ReactNode;
  required?: boolean;
  className?: string;
}

const CustomFormItem: React.FC<CustomFormItemProps> = ({
  children,
  label,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <Form.Item label={label} required={required} className={className} {...props}>
      {children}
    </Form.Item>
  );
};

interface CustomSelectOptionProps {
  children: React.ReactNode;
  value: string | number;
  disabled?: boolean;
  className?: string;
}

const CustomSelectOption: React.FC<CustomSelectOptionProps> = ({
  children,
  value,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <Select.Option value={value} disabled={disabled} className={className} {...props}>
      {children}
    </Select.Option>
  );
};

interface CustomTabPaneProps {
  children: React.ReactNode;
  tab: React.ReactNode;
  key: string;
  disabled?: boolean;
  className?: string;
}

const CustomTabPane: React.FC<CustomTabPaneProps> = ({
  children,
  tab,
  key,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <Tabs.TabPane tab={tab} key={key} disabled={disabled} className={className} {...props}>
      {children}
    </Tabs.TabPane>
  );
};

interface CustomFormProps {
  children: React.ReactNode;
  layout?: 'horizontal' | 'vertical' | 'inline';
  className?: string;
}

const CustomForm: React.FC<CustomFormProps> = ({
  children,
  layout = 'vertical',
  className = '',
  ...props
}) => {
  return (
    <Form layout={layout} className={className} {...props}>
      {children}
    </Form>
  );
};

interface ProjectCardProps {
  project: Project;
  onEdit: (project: Project) => void;
  onArchive: (project: Project) => void;
  onDelete: (project: Project) => void;
  onManageMembers: (project: Project) => void;
  getProjectStats: (project: Project) => { totalTasks: number; completedTasks: number };
  children?: React.ReactNode;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  onEdit,
  onArchive,
  onDelete,
  onManageMembers,
  getProjectStats,
  children
}) => {
  const { state, dispatch } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const stats = getProjectStats(project);
  // Calcul du pourcentage de tâches terminées (commenté car non utilisé pour le moment)
  // const progress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <Card
      className="p-6 group cursor-pointer relative overflow-hidden"
      hover
      gradient
      onClick={() => onEdit(project)}
    >
      {/* Image de couverture */}
      {project.coverImage && (
        <div className="absolute inset-0 z-0">
          <img
            src={project.coverImage}
            alt={`Image de couverture de ${project.name}`}
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/90 dark:to-gray-900/90"></div>
        </div>
      )}
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center space-x-3 min-w-0">
            <div
              className="w-5 h-5 rounded-full shadow-lg flex-shrink-0"
              style={{ backgroundColor: project.color }}
            />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h3 className={`font-bold text-gray-900 dark:text-white truncate ${state.appSettings?.fontSize === 'small' ? 'text-lg' :
                  state.appSettings?.fontSize === 'large' ? 'text-2xl' : 'text-xl'
                  }`}>
                  {project.name}
                </h3>
                {project.source === 'firebase' && (
                  <span className="flex-shrink-0 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800 uppercase tracking-wider">
                  Cloud
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="p-2 rounded-xl hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-200"
            aria-label="Options du projet"
          >
            <MoreHorizontal className="w-5 h-5 text-gray-500" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-10 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl py-1 z-[100] border border-gray-200 dark:border-gray-700 animate-in fade-in zoom-in duration-200">
              {/* Option de Sync / Partage */}
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  setShowMenu(false);

                  if (!project.source || project.source === 'local') {
                    // Action: Synchroniser vers le cloud (Partager)
                    try {
                      const { Modal } = await import('antd');
                      Modal.confirm({
                        title: 'Partager sur le Cloud',
                        content: 'Voulez-vous partager ce projet sur le Cloud pour collaborer ?',
                        okText: 'Partager',
                        cancelText: 'Annuler',
                        onOk: async () => {
                          const hide = message.loading('Synchronisation en cours...', 0);
                          try {
                            const { firebaseService } = await import('../../services/collaboration/firebaseService');

                            if (!firebaseService.isReady()) {
                              message.error("Firebase n'est pas configuré.");
                              return;
                            }

                            const user = await firebaseService.getCurrentUser();
                            if (!user) {
                              message.warning("Vous devez être connecté. Allez dans Paramètres > Gestion des données.");
                              return;
                            }

                            const projectToSync = {
                              ...project,
                              source: 'firebase' as const,
                              ownerId: user.uid,
                              members: [user.uid],
                              isShared: true,
                              updatedAt: new Date().toISOString()
                            };

                            await firebaseService.syncProject(projectToSync);
                            dispatch({ type: 'UPDATE_PROJECT', payload: projectToSync });

                            message.success("Projet synchronisé avec succès !");
                          } catch (error: any) {
                            console.error("Détails de l'erreur de synchronisation:", error);
                            // On affiche l'erreur réelle pour aider au débug
                            message.error(`Erreur lors de la synchronisation : ${error.message || 'Erreur inconnue'}`);
                          } finally {
                            hide();
                          }
                        }
                      });
                    } catch (error) {
                      console.error("Erreur lors de l'ouverture du modal:", error);
                    }
                  } else {
                    // Action: Télécharger une copie locale (si c'est un projet cloud)
                    if (window.confirm("Créer une copie locale de ce projet ?")) {
                      message.info("La création de copie locale arrivera bientôt !");
                    }
                  }
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Cpu className="w-4 h-4 mr-3" />
                {(!project.source || project.source === 'local') ? 'Partager / Sync' : 'Copie locale'}
              </button>

              {/* Option Gérer l'équipe (visible seulement pour les projets cloud dont on est propriétaire) */}
              {project.source === 'firebase' && (state.cloudUser?.uid === project.ownerId) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowMenu(false);
                    onManageMembers(project);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <FolderOpen className="w-4 h-4 mr-3" />
                  Gérer l'équipe
                </button>
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(project);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Edit className="w-4 h-4 mr-3" />
                Modifier
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onArchive(project);
                }}
                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <Archive className="w-4 h-4 mr-3" />
                {project.status === 'archived' ? 'Désarchiver' : 'Archiver'}
              </button>
              {/* Option Supprimer (visible seulement pour les projets locaux OU les projets cloud dont on est propriétaire) */}
              {(project.source !== 'firebase' || state.cloudUser?.uid === project.ownerId) ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Supprimer
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(project); // Réutilise le même flux de confirmation
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30"
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Quitter le projet
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {project.description && (
        <div className={`text-gray-600 dark:text-gray-400 mb-6 line-clamp-2 leading-relaxed markdown-body ${state.appSettings?.fontSize === 'small' ? 'text-xs' :
          state.appSettings?.fontSize === 'large' ? 'text-base' : 'text-sm'
          }`}>
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              strong: ({children}) => <strong style={{fontWeight: 'bold', color: 'inherit'}}>{children}</strong>,
              em: ({children}) => <em style={{fontStyle: 'italic', color: 'inherit'}}>{children}</em>,
              code: ({className, children}) => {
                const isInline = !className?.includes('language-');
                return isInline 
                  ? <code style={{backgroundColor: '#f3f4f6', padding: '0.1em 0.2em', borderRadius: '2px', fontSize: '0.8em', fontFamily: 'monospace'}}>{children}</code>
                  : <code style={{backgroundColor: '#f3f4f6', padding: '0.5em', borderRadius: '4px', display: 'block', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.8em'}}>{children}</code>;
              },
              p: ({children}) => <p style={{margin: '0'}}>{children}</p>,
              ul: ({children}) => <ul style={{margin: '0', paddingLeft: '1em'}}>{children}</ul>,
              ol: ({children}) => <ol style={{margin: '0', paddingLeft: '1em'}}>{children}</ol>,
              li: ({children}) => <li style={{marginBottom: '0'}}>{children}</li>,
              h1: ({children}) => <h1 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h1>,
              h2: ({children}) => <h2 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h2>,
              h3: ({children}) => <h3 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h3>
            }}
          >
            {cleanMarkdown(project.description)}
          </ReactMarkdown>
        </div>
      )}



      {/* Reste du render... */}
      <div className="space-y-4 mb-6">
        <div className={`flex justify-between ${state.appSettings?.fontSize === 'small' ? 'text-xs' :
          state.appSettings?.fontSize === 'large' ? 'text-base' : 'text-sm'
          }`}>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Progression</span>
          <span className="font-bold text-gray-900 dark:text-white">
            {stats.completedTasks}/{stats.totalTasks}
          </span>
        </div>

        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div
            className="h-3 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-500 shadow-sm"
            style={{
              width: `${stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%`
            }}
          />
        </div>
      </div>

      {children}
      </div>
    </Card>
  );
};

// Composant pour la gestion des membres
const MembersModal = ({ isOpen, onClose, project }: { isOpen: boolean; onClose: () => void; project: Project | null }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { state, dispatch } = useApp();
  const [memberDetails, setMemberDetails] = useState<Record<string, { displayName: string, email: string, photoURL: string }>>({});

  // Charger les détails des membres quand le projet change ou s'ouvre
  useEffect(() => {
    const fetchMemberDetails = async () => {
      if (!project || !project.members) return;

      const details: Record<string, any> = {};
      const { firebaseService } = await import('../../services/collaboration/firebaseService');

      // On cherche d'abord dans les contacts locaux pour éviter des requêtes inutiles
      const contacts = state.appSettings?.contacts || [];

      // Pour chaque membre, on essaie de récupérer ses infos
      // Note: Idéalement, on aurait une méthode getUserProfile(uid) dans firebaseService
      // Pour l'instant, on va simuler ou on devrait l'ajouter.
      // On va supposer qu'on peut récupérer les infos via une requête.
      // Pour simplifier ici sans modifier firebaseService tout de suite en profondeur,
      // on va scanner la collection 'users' par ID si on a accès.

      // Mais attendons, nous avons besoin de `getUserProfile`.
      // Je vais utiliser une fonction ad-hoc importée dynamiquement si elle existait, 
      // ou on va l'ajouter à firebaseService dans l'étape suivante.
      // Pour l'instant, affichons les IDs ou cherchons dans contacts si l'email correspond (impossible sans avoir l'email du membre).

      // Solution: On va charger les profils via une nouvelle méthode qu'on ajoutera.
      // En attendant, on met un placeholder.
    };

    // fetchMemberDetails();
  }, [project, isOpen]);

  // Chargement des profils (Vraie implémentation)
  useEffect(() => {
    const loadDetails = async () => {
      if (!project?.members) return;
      const { firebaseService } = await import('../../services/collaboration/firebaseService');
      const details: any = {};

      for (const uid of project.members) {
        try {
          // On utilise une méthode qu'on va ajouter juste après: getUserProfile
          // Si elle n'existe pas encore, le build va échouer, donc je dois m'assurer d'ajouter getUserProfile dans firebaseService D'ABORD.
          // Mais je ne peux pas éditer 2 fichiers en même temps avec replace_file_content.
          // Je vais utiliser 'any' pour bypasser le check TS temporairement ou appeler getDoc directement ici ?
          // Non, restons propres. Je vais utiliser firebaseService.getUserProfile(uid)
          // et je ferai l'edit de firebaseService JUSTE AVANT ou APRES.
          // Le mieux est de faire l'edit de firebaseService d'abord.
          // STOP. Je vais annuler cet edit et faire firebaseService d'abord.
        } catch (e) { console.error(e); }
      }
    };
  }, [project]);

  if (!project) return null;

  const handleInvite = async (emailToInvite: string) => {
    const cleanEmail = emailToInvite.trim();
    if (!cleanEmail) return;
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { firebaseService } = await import('../../services/collaboration/firebaseService');
      const user = await firebaseService.findUserByEmail(cleanEmail);

      if (user) {
        if (project.members?.includes(user.uid)) {
          setError("Cet utilisateur est déjà membre du projet.");
        } else {
          const updatedProject = {
            ...project,
            members: [...(project.members || []), user.uid],
            updatedAt: new Date().toISOString()
          };

          await firebaseService.syncProject(updatedProject);
          dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
          setSuccess(`Utilisateur ${user.displayName || emailToInvite} ajouté avec succès !`);
          setEmail('');
        }
      } else {
        // L'utilisateur n'existe pas dans Firebase (n'a jamais connecté l'app)
        // Mais on veut quand même l'ajouter au projet "via email" ?
        // Sans UID, on ne peut pas gérer les droits via les règles de sécurité Firebase standard basées sur auth.uid.
        // On va afficher un message d'erreur plus explicite.
        setError(`L'utilisateur ${emailToInvite} ne s'est jamais connecté à l'application. Demandez-lui de se connecter une première fois.`);
      }
    } catch (err) {
      console.error(err);
      setError("Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gérer l'équipe : ${project.name}`}>
      <div className="space-y-6">
        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
          <p>Seuls les utilisateurs s'étant déjà connectés à l'application peuvent être invités.</p>
        </div>

        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Inviter un membre</h4>

          {/* Sélection depuis les contacts ou l'équipe locale */}
          {(() => {
            // Combiner contacts et membres de l'équipe locale
            const localTeam = state.users.filter(u => u.email && u.id !== state.cloudUser?.uid && u.email !== state.cloudUser?.email);
            const contacts = state.appSettings.contacts || [];

            // Utiliser une Map pour éviter les doublons d'email
            const candidatesMap = new Map();

            localTeam.forEach(user => {
              if (user.email) candidatesMap.set(user.email, { name: user.name, email: user.email, type: 'Équipe' });
            });

            contacts.forEach(contact => {
              if (contact.email && !candidatesMap.has(contact.email)) {
                candidatesMap.set(contact.email, { name: contact.name, email: contact.email, type: 'Contact' });
              }
            });

            const candidates = Array.from(candidatesMap.values());

            if (candidates.length === 0) return null;

            return (
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 mb-1">Depuis votre équipe ou vos contacts</label>
                <select
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
                  onChange={(e) => {
                    if (e.target.value) {
                      setEmail(e.target.value);
                    }
                  }}
                  value=""
                >
                  <option value="">Sélectionner une personne...</option>
                  {candidates.map((candidate: any) => (
                    <option key={candidate.email} value={candidate.email}>
                      {candidate.name} ({candidate.email}) - {candidate.type}
                    </option>
                  ))}
                </select>
              </div>
            );
          })()}

          <div className="flex space-x-2">
            <Input
              placeholder="Email du collaborateur"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button onClick={() => handleInvite(email)} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            </Button>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {success && <p className="text-green-500 text-sm">{success}</p>}
        </div>

        <div className="border-t pt-4 dark:border-gray-700">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Membres actuels</h4>
          <ul className="space-y-2">
            <MemberListItem
              uid={project.ownerId || ''}
              role="Propriétaire"
              isAdmin
              currentUserUid={state.cloudUser?.uid}
            />
            {project.members?.filter(id => id !== project.ownerId).map(memberId => (
              <MemberListItem key={memberId} uid={memberId} role="Membre" />
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
};

// Sous-composant pour afficher un membre avec récupération de ses infos
const MemberListItem = ({ uid, role, isAdmin, currentUserUid }: { uid: string, role: string, isAdmin?: boolean, currentUserUid?: string }) => {
  const [userData, setUserData] = useState<{ displayName?: string, email?: string } | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { firebaseService } = await import('../../services/collaboration/firebaseService');
      if (firebaseService.getUserProfile) {
        const u = await firebaseService.getUserProfile(uid);
        setUserData(u);
      }
    };
    fetchUser();
  }, [uid]);

  return (
    <li className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {uid === currentUserUid ? 'Vous' : (userData?.displayName || 'Utilisateur inconnu')}
        </span>
        <span className="text-xs text-gray-500">{userData?.email || uid}</span>
      </div>
      <span className={`text-xs px-2 py-1 rounded ${isAdmin ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-800'}`}>
        {role}
      </span>
    </li>
  );
};

export function ProjectsView() {
  const { state, dispatch } = useApp();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [managingMembersProject, setManagingMembersProject] = useState<Project | null>(null);
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProject(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openTaskModal = (task: Task) => {
    setEditingTask(task);
  };

  const resetNewProjectForm = () => {
    setNewProject({
      name: '',
      description: '',
      color: '#0EA5E9',
      status: 'active',
      estimatedDuration: 0,
      tasks: []
    });
  };
  const [activeTab, setActiveTab] = useState('general'); // État pour gérer l'onglet actif
  const [aiSettings, setAISettings] = useState<AISettingsType>({
    provider: 'openai',
    openaiApiKey: '',
    openrouterApiKey: '',
    openaiModel: 'gpt-3.5-turbo',
    openrouterModel: 'openai/gpt-3.5-turbo',
    maxTokens: 1000,
    temperature: 0.7,
    isConfigured: false
  });
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [showActive, setShowActive] = useState(true); // État pour gérer l'affichage des projets actifs
  const [showPending, setShowPending] = useState(false); // État pour gérer l'affichage des projets en attente (masqué par défaut)
  const [showCompletedProjects, setShowCompletedProjects] = useState(false);
  const [showArchivedProjects, setShowArchivedProjects] = useState(false);
  const [isGeneratingTasks, setIsGeneratingTasks] = useState(false);

  const [newProject, setNewProject] = useState<Omit<Project, 'id' | 'createdAt' | 'updatedAt'>>({
    name: '',
    description: '',
    color: '#0EA5E9',
    status: 'active',
    estimatedDuration: 0,
    tasks: []
  });

  const [newTask, setNewTask] = useState<{
    title: string;
    description: string;
    status: 'todo' | 'in-progress' | 'done';
    priority: 'low' | 'medium' | 'high';
    startDate: string;
    endDate: string;
    estimatedHours: number;
  }>({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    estimatedHours: 1,
  });

  // Fonction pour générer des tâches avec l'IA
  const generateTasksWithAI = async () => {
    if (!editingProject) return;

    setIsGeneratingTasks(true);

    try {
      const projectDetails = {
        name: editingProject.name,
        description: editingProject.description || '',
        tasks: editingProject.tasks || []
      };

      // Préparer le prompt pour l'IA
      let prompt = `Génère 3 à 5 tâches pour le projet "${editingProject.name}".`;

      if (editingProject.description) {
        prompt += ` Description du projet: ${editingProject.description}\n\n`;
      }

      if (editingProject.tasks?.length > 0) {
        prompt += `Tâches existantes (${editingProject.tasks.length}):\n`;
        editingProject.tasks.slice(0, 3).forEach((task, index) => {
          prompt += `${index + 1}. ${task.title}\n`;
        });
        if (editingProject.tasks.length > 3) {
          prompt += `... et ${editingProject.tasks.length - 3} de plus\n`;
        }
        prompt += '\n';
      }

      prompt += `Génère des tâches pertinentes et bien structurées. \nFormat de sortie JSON : [{"title":"Titre de la tâche","description":"Description détaillée","estimatedHours":2}]`;

      // Récupérer les paramètres IA du contexte de l'application
      const aiConfig = state.appSettings?.aiSettings || DEFAULT_AI_SETTINGS;
      const apiKey = aiConfig.openrouterApiKey || '';

      if (!apiKey) {
        throw new Error('Clé API OpenRouter non configurée. Veuillez configurer les paramètres IA dans les paramètres de l\'application.');
      }

      // Appeler le service IA
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Gestion de Projet App',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: aiConfig.openrouterModel || 'openrouter/auto',
          messages: [
            {
              role: 'system',
              content: 'Tu es un assistant qui aide à la gestion de projet en générant des tâches pertinentes.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: aiConfig.temperature || 0.7,
          max_tokens: aiConfig.maxTokens || 1000
        })
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la génération des tâches');
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        throw new Error('Réponse de l\'IA invalide');
      }

      // Extraire le JSON de la réponse
      const jsonMatch = content.match(/\[\s*\{.*\}\s*\]/s);
      if (!jsonMatch) {
        throw new Error('Format de réponse inattendu');
      }

      const generatedTasks = JSON.parse(jsonMatch[0]);

      // Ajouter les nouvelles tâches au projet
      if (generatedTasks && Array.isArray(generatedTasks) && generatedTasks.length > 0) {
        const updatedTasks = [...(editingProject.tasks || [])];

        generatedTasks.forEach((task: any) => {
          if (task.title) {
            const newTask: Task = {
              id: uuidv4(),
              title: task.title,
              description: task.description || '',
              status: 'todo',
              priority: 'medium',
              dueDate: '',
              startDate: new Date().toISOString().split('T')[0],
              endDate: '',
              assignees: [],
              projectId: editingProject.id,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              tags: [],
              subTasks: [],
              estimatedHours: task.estimatedHours || 4
            };
            updatedTasks.push(newTask);
          }
        });

        setEditingProject({
          ...editingProject,
          tasks: updatedTasks
        });

        message.success(`${generatedTasks.length} tâches générées avec succès !`);
      }

    } catch (error) {
      console.error('Erreur lors de la génération des tâches:', error);
      message.error('Erreur lors de la génération des tâches. Veuillez réessayer.');
    } finally {
      setIsGeneratingTasks(false);
    }
  };

  const addTask = () => {
    if (!editingProject || !newTask.title.trim()) return;

    const task: Task = {
      id: uuidv4(),
      title: newTask.title,
      description: newTask.description,
      status: 'todo',
      priority: newTask.priority,
      dueDate: newTask.endDate, // Gardé pour compatibilité
      startDate: newTask.startDate,
      endDate: newTask.endDate,
      assignees: [],
      projectId: editingProject.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
      subTasks: [],
      estimatedHours: newTask.estimatedHours || 0,
    };

    if (editingProject) {
      // Ajouter la tâche au projet en cours d'édition
      setEditingProject({
        ...editingProject,
        tasks: [...(editingProject.tasks || []), task]
      });
    } else {
      // Ajouter la tâche au nouveau projet
      setNewProject({
        ...newProject,
        tasks: [...newProject.tasks, task]
      });
    }

    // Réinitialiser le formulaire de tâche
    setNewTask({
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Demain par défaut
      estimatedHours: 1,
    });
  };

  const removeTask = (taskId: string, isEditing: boolean = false) => {
    if (isEditing) {
      if (!editingProject) return;

      const updatedTasks = editingProject.tasks?.filter(task => task.id !== taskId) || [];
      setEditingProject({
        ...editingProject,
        tasks: updatedTasks
      });
    } else {
      setNewProject({
        ...newProject,
        tasks: newProject.tasks?.filter(t => t.id !== taskId) || []
      });
    }
  };

  const createProject = () => {
    if (!newProject.name.trim()) return;

    const project: Project = {
      id: Date.now().toString(),
      name: newProject.name,
      description: newProject.description,
      color: newProject.color,
      status: 'active',
      estimatedDuration: newProject.estimatedDuration || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tasks: (newProject.tasks || []).map(task => ({
        ...task,
        id: task.id || uuidv4(),
        projectId: '', // Sera mis à jour avec l'ID du projet
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        subTasks: []
      }))
    };

    // Réinitialiser le formulaire après la création
    resetNewProjectForm();

    dispatch({ type: 'ADD_PROJECT', payload: project });
    setShowCreateModal(false);
  };

  const updateProject = () => {
    if (!editingProject) return;

    const updatedProject: Project = {
      ...editingProject,
      updatedAt: new Date().toISOString(),
      // S'assurer que les tâches ont toutes les propriétés requises
      tasks: editingProject.tasks?.map(task => ({
        ...task,
        subTasks: task.subTasks || [],
        assignees: task.assignees || [],
        tags: task.tags || [],
        dueDate: task.dueDate || new Date().toISOString().split('T')[0],
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        createdAt: task.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })) || []
    };

    dispatch({
      type: 'UPDATE_PROJECT',
      payload: updatedProject
    });

    setEditingProject(null);
  };



  const getProjectStats = (project: Project) => {
    const totalTasks = project.tasks?.length || 0;
    const completedTasks = project.tasks?.filter(t => t.status === 'done').length || 0;
    const inProgressTasks = project.tasks?.filter(t => t.status === 'in-progress').length || 0;
    const todoTasks = project.tasks?.filter(t => t.status === 'todo').length || 0;

    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const handleUpdateProjectStatus = (project: Project, newStatus: 'active' | 'on-hold' | 'archived') => {
    dispatch({
      type: 'UPDATE_PROJECT',
      payload: {
        ...project,
        status: newStatus,
        updatedAt: new Date().toISOString()
      }
    });
  };

  const handleArchiveProject = (project: Project) => {
    handleUpdateProjectStatus(project, project.status === 'archived' ? 'active' : 'archived');
    setShowMenuId(null);
  };

  const handleActivateProject = (project: Project) => {
    handleUpdateProjectStatus(project, 'active');
  };

  const handleCompleteProject = (project: Project) => {
    handleUpdateProjectStatus(project, 'completed');
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;

    console.log('Tentative de suppression du projet:', projectToDelete.name, projectToDelete.id);

    try {
      // Si c'est un projet Cloud
      if (projectToDelete.source === 'firebase') {
        const isOwner = state.cloudUser?.uid === projectToDelete.ownerId;

        if (isOwner) {
          console.log('Suppression Cloud en cours (Propriétaire)...');
          await firebaseService.deleteProject(projectToDelete.id);
          console.log('Suppression Cloud réussie');
        } else {
          console.log('Sortie du projet Cloud en cours (Collaborateur)...');
          await firebaseService.leaveProject(projectToDelete.id);
          console.log('Sortie du projet Cloud réussie');
        }
      }

      dispatch({ type: 'DELETE_PROJECT', payload: projectToDelete.id });

      message.success(`Le projet "${projectToDelete.name}" a été supprimé`);
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error);
      message.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
      setShowMenuId(null);
    }
  };

  const colors = [
    '#0EA5E9', '#3B82F6', '#6366F1', '#8B5CF6', '#A855F7',
    '#D946EF', '#EC4899', '#F43F5E', '#EF4444', '#F97316',
    '#F59E0B', '#EAB308', '#84CC16', '#22C55E', '#10B981',
    '#14B8A6', '#06B6D4', '#0891B2', '#475569', '#71717a'
  ];

  const [showProjectModal, setShowProjectModal] = useState(false);

  const handleEditProject = (project: Project) => {
    setEditingProject({ ...project, tasks: project.tasks || [] });
    if (project.aiSettings) {
      setAISettings(project.aiSettings);
    }
    setNewProject({
      name: project.name,
      description: project.description || '',
      color: project.color,
      status: project.status,
      estimatedDuration: project.estimatedDuration || 0,
      tasks: project.tasks || []
    });
    setActiveTab('general'); // Réinitialiser à l'onglet général
    setShowProjectModal(true);
  };

  const handleCreateProject = () => {
    setNewProject({
      name: '',
      description: '',
      color: '#1890ff',
      status: 'active',
      estimatedDuration: 0,
      tasks: []
    });
    setAISettings({
      provider: 'openai',
      openaiApiKey: '',
      openrouterApiKey: '',
      openaiModel: 'gpt-3.5-turbo',
      openrouterModel: 'openai/gpt-3.5-turbo',
      maxTokens: 1000,
      temperature: 0.7,
      isConfigured: false
    });
    setActiveTab('general'); // Réinitialiser à l'onglet général
    setShowProjectModal(true);
  };

  const handleSaveProject = () => {
    if (!newProject.name.trim()) {
      message.error('Veuillez saisir un nom pour le projet');
      return;
    }

    if (editingProject) {
      // Mise à jour du projet existant
      const updatedProject: Project = {
        ...editingProject,
        ...newProject,
        aiSettings: aiSettings,
        updatedAt: new Date().toISOString(),
      };
      dispatch({ type: 'UPDATE_PROJECT', payload: updatedProject });
      message.success('Projet mis à jour avec succès');
    } else {
      // Création d'un nouveau projet
      const project: Project = {
        id: `project-${Date.now()}`,
        name: newProject.name,
        description: newProject.description,
        color: newProject.color,
        status: newProject.status,
        estimatedDuration: newProject.estimatedDuration || 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tasks: [],
        aiSettings: aiSettings
      };
      dispatch({ type: 'ADD_PROJECT', payload: project });
      message.success('Projet créé avec succès');
    }

    setShowProjectModal(false);
    setNewProject({ name: '', description: '', color: '#1890ff', status: 'active', estimatedDuration: 0, tasks: [] });
    setEditingProject(null);
    setAISettings(null);
  };

  const handleManageMembers = (project: Project) => {
    setManagingMembersProject(project);
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Projets</h1>
        <Button
          icon={Plus}
          onClick={() => {
            resetNewProjectForm();
            setShowCreateModal(true);
          }}
          variant="gradient"
          size="lg"
        >
          Nouveau Projet
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {state.projects.length}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Projets</div>
        </Card>

        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {state.projects.filter(p => p.status === 'active').length}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Actifs</div>
        </Card>

        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-yellow-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {state.projects.reduce((acc, p) => acc + p.tasks.length, 0)}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Tâches</div>
        </Card>

        <Card className="p-6 text-center" hover gradient>
          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-2xl font-bold text-white">
              {state.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'done').length, 0)}
            </span>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">Terminées</div>
        </Card>
      </div>

      {/* Projets actifs */}
      <div className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className={`font-bold text-gray-800 dark:text-white ${state.appSettings?.fontSize === 'small' ? 'text-lg' :
            state.appSettings?.fontSize === 'large' ? 'text-2xl' : 'text-xl'
            }`}>
            Projets actifs
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowActive(!showActive)}
            className="flex items-center gap-2"
          >
            {showActive ? 'Masquer' : 'Afficher'} les projets actifs
            <svg
              className={`w-4 h-4 transition-transform ${showActive ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </Button>
        </div>

        {showActive && state.projects.some(p => p.status === 'active') ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {state.projects
              .filter(project => project.status === 'active')
              .map(project => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onEdit={handleEditProject}
                  onArchive={handleArchiveProject}
                  onDelete={(p) => {
                    setProjectToDelete(p);
                    setShowDeleteConfirm(true);
                  }}
                  onManageMembers={handleManageMembers}
                  getProjectStats={getProjectStats}
                />
              ))}
          </div>
        ) : showActive ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            Aucun projet actif pour le moment
          </div>
        ) : null}
      </div>

      {/* Aucun projet */}
      {state.projects.filter(p => p.status !== 'archived').length === 0 ? (
        <Card className="p-16 text-center" gradient>
          <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <FolderOpen className="w-12 h-12 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Aucun projet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-lg">
            Créez votre premier projet pour commencer à organiser vos tâches.
          </p>
          <Button
            icon={Plus}
            onClick={() => {
              resetNewProjectForm();
              setShowCreateModal(true);
            }}
            variant="gradient"
            size="lg"
          >
            Créer un projet
          </Button>
        </Card>
      ) : (
        <>
          {/* Projets en attente */}
          <div className="mb-8">
            <div
              className="flex items-center justify-between cursor-pointer mb-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setShowPending(!showPending)}
            >
              <h2 className={`flex items-center ${state.appSettings?.fontSize === 'small' ? 'text-lg' : state.appSettings?.fontSize === 'large' ? 'text-2xl' : 'text-xl'} font-bold`}>
                <AlertTriangle className="mr-2 text-yellow-500" size={state.appSettings?.fontSize === 'large' ? 24 : 20} />
                En attente
                <span className="ml-2 text-sm font-normal text-gray-500 dark:text-gray-400">
                  ({state.projects.filter(p => p.status === 'on-hold').length})
                </span>
              </h2>
              <ChevronDown
                className={`transform transition-transform ${showPending ? 'rotate-0' : '-rotate-90'} text-gray-500`}
                size={20}
              />
            </div>

            {showPending && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {state.projects
                  .filter(project => project.status === 'on-hold')
                  .map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={handleEditProject}
                      onArchive={handleArchiveProject}
                      onDelete={(project) => {
                        setProjectToDelete(project);
                        setShowDeleteConfirm(true);
                      }}
                      onManageMembers={handleManageMembers}
                      getProjectStats={getProjectStats}
                      totalTasks={getProjectStats(project).totalTasks}
                      completedTasks={getProjectStats(project).completedTasks}
                    >
                      <div className="flex justify-between mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateProject(project);
                          }}
                          className="flex-1 mr-2"
                        >
                          Activer
                        </Button>
                        {(project.source !== 'firebase' || state.cloudUser?.uid === project.ownerId) ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={16} />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              setProjectToDelete(project);
                              setShowDeleteConfirm(true);
                            }}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600"
                            title="Quitter le projet"
                          >
                            <LogOut size={16} />
                          </Button>
                        )}
                      </div>
                    </ProjectCard>
                  ))}

                {state.projects.filter(p => p.status === 'on-hold').length === 0 && (
                  <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucun projet en attente
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Projets terminés */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className={`font-bold text-gray-800 dark:text-white ${state.appSettings?.fontSize === 'small' ? 'text-lg' :
                state.appSettings?.fontSize === 'large' ? 'text-2xl' : 'text-xl'
                }`}>
                Projets terminés
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCompletedProjects(!showCompletedProjects)}
                className="flex items-center gap-2"
              >
                {showCompletedProjects ? 'Masquer' : 'Afficher'} les projets terminés
                <svg
                  className={`w-4 h-4 transition-transform ${showCompletedProjects ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>

            {showCompletedProjects && state.projects.some(p => p.status === 'completed') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {state.projects
                  .filter(project => project.status === 'completed')
                  .map(project => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={handleEditProject}
                      onArchive={handleArchiveProject}
                      onDelete={(p) => {
                        setProjectToDelete(p);
                        setShowDeleteConfirm(true);
                      }}
                      onManageMembers={handleManageMembers}
                      getProjectStats={getProjectStats}
                    >
                      <div className="flex gap-2 mt-4">
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleActivateProject(project);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Réactiver
                        </Button>
                        <Button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleArchiveProject(project);
                          }}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          Archiver
                        </Button>
                      </div>
                    </ProjectCard>
                  ))}
              </div>
            )}
            {showCompletedProjects && !state.projects.some(p => p.status === 'completed') && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun projet terminé pour le moment
              </div>
            )}
          </div>

          {/* Projets archivés */}
          <div className="mt-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 dark:text-white">Projets archivés</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowArchivedProjects(!showArchivedProjects)}
                className="flex items-center gap-2"
              >
                {showArchivedProjects ? 'Masquer' : 'Afficher'} les projets archivés
                <svg
                  className={`w-4 h-4 transition-transform ${showArchivedProjects ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Button>
            </div>

            {showArchivedProjects && state.projects.some(p => p.status === 'archived') && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {state.projects
                  .filter(project => project.status === 'archived')
                  .map(project => {
                    const stats = getProjectStats(project);
                    const progress = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;

                    return (
                      <Card
                        key={project.id}
                        className="p-6 group opacity-75 hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                        hover
                        onClick={() => handleEditProject(project)}
                      >
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div
                              className="w-5 h-5 rounded-full shadow-lg"
                              style={{ backgroundColor: project.color }}
                            />
                            <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                              {project.name}
                            </h3>
                          </div>
                          <div className="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">
                            Archivé
                          </div>
                        </div>

                        {project.description && (
                          <div className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2 markdown-body">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                strong: ({children}) => <strong style={{fontWeight: 'bold', color: 'inherit'}}>{children}</strong>,
                                em: ({children}) => <em style={{fontStyle: 'italic', color: 'inherit'}}>{children}</em>,
                                code: ({className, children}) => {
                                  const isInline = !className?.includes('language-');
                                  return isInline 
                                    ? <code style={{backgroundColor: '#f3f4f6', padding: '0.1em 0.2em', borderRadius: '2px', fontSize: '0.8em', fontFamily: 'monospace'}}>{children}</code>
                                    : <code style={{backgroundColor: '#f3f4f6', padding: '0.5em', borderRadius: '4px', display: 'block', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.8em'}}>{children}</code>;
                                },
                                p: ({children}) => <p style={{margin: '0'}}>{children}</p>,
                                ul: ({children}) => <ul style={{margin: '0', paddingLeft: '1em'}}>{children}</ul>,
                                ol: ({children}) => <ol style={{margin: '0', paddingLeft: '1em'}}>{children}</ol>,
                                li: ({children}) => <li style={{marginBottom: '0'}}>{children}</li>,
                                h1: ({children}) => <h1 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h1>,
                                h2: ({children}) => <h2 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h2>,
                                h3: ({children}) => <h3 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h3>
                              }}
                            >
                              {cleanMarkdown(project.description)}
                            </ReactMarkdown>
                          </div>
                        )}

                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                          <div className="flex space-x-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleArchiveProject(project);
                              }}
                              className="text-xs px-3 py-1 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 transition-colors"
                            >
                              Désarchiver
                            </button>
                            {(project.source !== 'firebase' || state.cloudUser?.uid === project.ownerId) ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectToDelete(project);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-xs px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                              >
                                Supprimer
                              </button>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProjectToDelete(project);
                                  setShowDeleteConfirm(true);
                                }}
                                className="text-xs px-3 py-1 rounded-full bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 transition-colors"
                              >
                                Quitter
                              </button>
                            )}
                          </div>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            )}
            {showArchivedProjects && !state.projects.some(p => p.status === 'archived') && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                Aucun projet archivé pour le moment
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de création avec design moderne */}
      <Modal
        title={editingProject ? 'Modifier le projet' : 'Nouveau projet'}
        open={showProjectModal}
        onOk={handleSaveProject}
        onCancel={() => setShowProjectModal(false)}
        width={800}
        okText={editingProject ? 'Mettre à jour' : 'Créer'}
        cancelText="Annuler"
        destroyOnClose
      >
        <Tabs activeKey={activeTab} onChange={(key: string) => setActiveTab(key)}>
          <CustomTabPane tab="Général" key="general">
            <CustomForm layout="vertical">
              <CustomFormItem label="Nom du projet" required>
                <Input
                  value={newProject.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setNewProject({ ...newProject, name: e.target.value })}
                  placeholder="Nom du projet"
                />
              </CustomFormItem>
              <CustomFormItem label="Description">
                <TextArea
                  value={newProject.description}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setNewProject({ ...newProject, description: e.target.value })}
                  placeholder="Description du projet"
                  rows={4}
                />
              </CustomFormItem>
              <Row gutter={16 as unknown as string}>
                <Col span={12 as unknown as string}>
                  <CustomFormItem label="Couleur">
                    <Select
                      value={newProject.color}
                      onChange={(value: string) =>
                        setNewProject({ ...newProject, color: value })}
                      style={{ width: '100%' }}
                    >
                      <CustomSelectOption value="#1890ff">Bleu</CustomSelectOption>
                      <CustomSelectOption value="#52c41a">Vert</CustomSelectOption>
                      <CustomSelectOption value="#faad14">Jaune</CustomSelectOption>
                      <CustomSelectOption value="#f5222d">Rouge</CustomSelectOption>
                      <CustomSelectOption value="#722ed1">Violet</CustomSelectOption>
                      <CustomSelectOption value="#eb2f96">Rose</CustomSelectOption>
                      <CustomSelectOption value="#fa8c16">Orange</CustomSelectOption>
                      <CustomSelectOption value="#13c2c2">Cyan</CustomSelectOption>
                      <CustomSelectOption value="#ff4d4f">Corail</CustomSelectOption>
                      <CustomSelectOption value="#2f54eb">Indigo</CustomSelectOption>
                    </Select>
                    <div className="mt-4 flex items-center gap-3">
                      <span className="text-sm text-gray-500 dark:text-gray-400">Ou personnalisée :</span>
                      <input
                        type="color"
                        value={newProject.color}
                        onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                        className="w-12 h-8 rounded-lg cursor-pointer bg-transparent border-0 p-0"
                      />
                      <Input
                        value={newProject.color}
                        onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                        className="w-28 text-center font-mono text-xs"
                        placeholder="#000000"
                      />
                    </div>
                  </CustomFormItem>
                </Col>
                <Col span={12}>
                  <CustomFormItem label="Statut">
                    <Select
                      value={newProject.status}
                      onChange={(value: string) => setNewProject({ ...newProject, status: value })}
                      style={{ width: '100%' }}
                    >
                      <CustomSelectOption value="active">Actif</CustomSelectOption>
                      <CustomSelectOption value="completed">Terminé</CustomSelectOption>
                      <CustomSelectOption value="archived">Archivé</CustomSelectOption>
                    </Select>
                  </CustomFormItem>
                </Col>
              </Row>
              <CustomFormItem label="Durée estimée (jours)">
                <InputNumber
                  min={1}
                  value={newProject.estimatedDuration}
                  onChange={(value: number | null) => setNewProject({ ...newProject, estimatedDuration: Math.max(1, value || 1) })}
                  style={{ width: '100%' }}
                  placeholder="Durée estimée en jours"
                />
              </CustomFormItem>
            </CustomForm>
          </CustomTabPane>
          <CustomTabPane
            tab={
              <span>
                <Cpu size={16} style={{ marginRight: 8 }} />
                IA
              </span>
            }
            key="ai"
            disabled={!editingProject}
          >
            {editingProject ? (
              <AISettings
                value={aiSettings}
                onChange={(settings) => setAISettings(settings)}
                showTitle={false}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '20px' }}>
                <p>Veuillez d'abord enregistrer le projet pour configurer les paramètres IA.</p>
              </div>
            )}
          </CustomTabPane>
        </Tabs>
      </Modal>

      {/* Modal d'édition de projet */}
      <Modal
        isOpen={!!editingProject}
        onClose={() => setEditingProject(null)}
        title="Modifier le projet"
        size="lg"
      >
        <div className="space-y-6">
          {/* Image de couverture - déplacé en haut */}
          <div className="mb-4">
            <CoverImageUpload
              currentImage={editingProject?.coverImage}
              onImageUploaded={(imageUrl) => editingProject && setEditingProject({ ...editingProject, coverImage: imageUrl })}
              onImageRemoved={() => editingProject && setEditingProject({ ...editingProject, coverImage: undefined })}
              projectId={editingProject?.id}
              projectSource={editingProject?.source || 'local'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom du projet *
              </label>
              <input
                type="text"
                value={editingProject?.name || ''}
                onChange={(e) => editingProject && setEditingProject({ ...editingProject, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                placeholder="Ex: Site e-commerce"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Statut
              </label>
              <select
                value={editingProject?.status || 'active'}
                onChange={(e) => editingProject && setEditingProject({ ...editingProject, status: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
              >
                <option value="active">Actif</option>
                <option value="on-hold">En attente</option>
                <option value="completed">Terminé</option>
                <option value="archived">Archivé</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={editingProject?.description || ''}
                onChange={(e) => editingProject && setEditingProject({ ...editingProject, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white min-h-[100px]"
                placeholder="Description du projet..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Durée estimée (jours)
              </label>
              <input
                type="number"
                min="1"
                value={editingProject?.estimatedDuration || 1}
                onChange={(e) => editingProject && setEditingProject({ ...editingProject, estimatedDuration: Math.max(1, Number(e.target.value)) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                placeholder="Durée estimée en jours"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Couleur du projet
            </label>
            <div className="flex flex-wrap gap-3 items-center">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => editingProject && setEditingProject({ ...editingProject, color })}
                  className={`w-10 h-10 rounded-2xl border-2 transition-all duration-200 transform hover:scale-110 shadow-lg ${editingProject?.color === color ? 'border-gray-400 scale-110' : 'border-transparent'
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="flex items-center gap-2 ml-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="relative group">
                  <input
                    type="color"
                    value={editingProject?.color || '#000000'}
                    onChange={(e) => editingProject && setEditingProject({ ...editingProject, color: e.target.value })}
                    className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-transparent cursor-pointer bg-transparent shadow-lg transform hover:scale-110 transition-transform"
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                    Couleur libre
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Liste des tâches existantes */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                Tâches du projet ({editingProject?.tasks?.length || 0})
              </h3>
              <button
                onClick={generateTasksWithAI}
                disabled={isGeneratingTasks}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
              >
                {isGeneratingTasks ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Génération...
                  </>
                ) : (
                  <>
                    <Cpu className="w-4 h-4" />
                    Générer avec l'IA
                  </>
                )}
              </button>
            </div>

            {editingProject?.tasks?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {editingProject.tasks.map((task) => (
                  <div 
                    key={task.id} 
                    className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 cursor-pointer transition-all hover:shadow-md"
                    onClick={() => openTaskModal(task)}
                  >
                    <div className="p-4">
                      {/* En-tête de la tâche */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors line-clamp-2">
                            {task.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            {/* Statut */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.status === 'done' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                              task.status === 'in-progress' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' :
                              task.status === 'blocked' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                              'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                            }`}>
                              {task.status === 'done' ? 'Terminé' :
                               task.status === 'in-progress' ? 'En cours' :
                               task.status === 'blocked' ? 'Bloqué' : 'À faire'}
                            </span>
                            
                            {/* Priorité */}
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                              task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                              task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                            }`}>
                              {task.priority === 'high' ? 'Haute' :
                               task.priority === 'medium' ? 'Moyenne' : 'Faible'}
                            </span>
                          </div>
                        </div>
                        
                        {/* Actions */}
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openTaskModal(task);
                            }}
                            className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            title="Modifier la tâche"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeTask(task.id, true);
                            }}
                            className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Supprimer la tâche"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Description (tronquée) */}
                      {task.description && (
                        <div className="mb-3">
                          <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2 leading-relaxed markdown-body">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                strong: ({children}) => <strong style={{fontWeight: 'bold', color: 'inherit'}}>{children}</strong>,
                                em: ({children}) => <em style={{fontStyle: 'italic', color: 'inherit'}}>{children}</em>,
                                code: ({className, children}) => {
                                  const isInline = !className?.includes('language-');
                                  return isInline 
                                    ? <code style={{backgroundColor: '#f3f4f6', padding: '0.1em 0.2em', borderRadius: '2px', fontSize: '0.8em', fontFamily: 'monospace'}}>{children}</code>
                                    : <code style={{backgroundColor: '#f3f4f6', padding: '0.5em', borderRadius: '4px', display: 'block', overflowX: 'auto', fontFamily: 'monospace', fontSize: '0.8em'}}>{children}</code>;
                                },
                                p: ({children}) => <p style={{margin: '0'}}>{children}</p>,
                                ul: ({children}) => <ul style={{margin: '0', paddingLeft: '1em'}}>{children}</ul>,
                                ol: ({children}) => <ol style={{margin: '0', paddingLeft: '1em'}}>{children}</ol>,
                                li: ({children}) => <li style={{marginBottom: '0'}}>{children}</li>,
                                h1: ({children}) => <h1 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h1>,
                                h2: ({children}) => <h2 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h2>,
                                h3: ({children}) => <h3 style={{fontSize: '1em', fontWeight: 'bold', margin: '0'}}>{children}</h3>
                              }}
                            >
                              {cleanMarkdown(task.description)}
                            </ReactMarkdown>
                          </div>
                        </div>
                      )}

                      {/* Métadonnées */}
                      <div className="space-y-2">
                        {/* Dates et heures */}
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              {task.dueDate ? new Date(task.dueDate).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short'
                              }) : 'Pas de date'}
                            </span>
                          </div>
                          {task.estimatedHours && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {task.estimatedHours}h
                            </span>
                          )}
                        </div>

                        {/* Tags et assignés */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-1">
                            {task.tags?.slice(0, 2).map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200"
                              >
                                {tag}
                              </span>
                            ))}
                            {task.tags?.length > 2 && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                +{task.tags.length - 2}
                              </span>
                            )}
                          </div>
                          
                          {/* Sous-tâches */}
                          {task.subTasks && task.subTasks.length > 0 && (
                            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                              <span>
                                {task.subTasks.filter(st => st.completed).length}/{task.subTasks.length}
                              </span>
                              <span>sous-tâches</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <FolderOpen className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium mb-2">Aucune tâche pour le moment</p>
                <p className="text-sm mb-4">Commencez par ajouter des tâches ou générez-les avec l'IA</p>
                <button
                  onClick={generateTasksWithAI}
                  disabled={isGeneratingTasks}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg transition-colors"
                >
                  {isGeneratingTasks ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Génération...
                    </>
                  ) : (
                    <>
                      <Cpu className="w-4 h-4" />
                      Générer des tâches
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Formulaire d'ajout de tâche */}
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Titre de la tâche *
                </label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                  placeholder="Ex: Créer la maquette"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Priorité
                </label>
                <select
                  value={newTask.priority}
                  onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                >
                  <option value="low">Basse</option>
                  <option value="medium">Moyenne</option>
                  <option value="high">Haute</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description (optionnel)
              </label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white min-h-[80px]"
                placeholder="Détails de la tâche..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de début
                </label>
                <input
                  type="date"
                  value={newTask.startDate}
                  onChange={(e) => setNewTask({ ...newTask, startDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Date de fin
                </label>
                <input
                  type="date"
                  min={newTask.startDate}
                  value={newTask.endDate}
                  onChange={(e) => setNewTask({ ...newTask, endDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Temps estimé (heures)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={newTask.estimatedHours}
                  onChange={(e) => setNewTask({ ...newTask, estimatedHours: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-2 items-center">
                <Button
                  onClick={addTask}
                  disabled={!newTask.title.trim()}
                  className="w-full mt-2"
                >
                  Ajouter la tâche
                </Button>

                {/* Bouton pour générer des tâches avec IA */}
                <Button
                  className="w-auto mt-2"
                  onClick={generateTasksWithAI}
                  disabled={isGeneratingTasks || !editingProject}
                  title="Générer des tâches avec IA"
                >
                  {isGeneratingTasks ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="w-6 h-6"
                    >
                      <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"></path>
                      <path d="M5 3v4"></path>
                      <path d="M19 17v4"></path>
                      <path d="M3 5h4"></path>
                      <path d="M17 19h4"></path>
                    </svg>
                  )}
                </Button>

              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              variant="outline"
              onClick={() => setEditingProject(null)}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={updateProject}
              variant="gradient"
              className="flex-1"
              disabled={!editingProject?.name?.trim()}
            >
              Enregistrer
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmation de suppression */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title={projectToDelete?.source === 'firebase' && state.cloudUser?.uid !== projectToDelete.ownerId ? "Quitter le projet" : "Supprimer le projet"}
        size="sm"
      >
        <div className="space-y-6">
          <div className="flex items-center justify-center text-yellow-500 mb-4">
            <AlertTriangle className="w-12 h-12" />
          </div>
          <p className="text-center text-gray-700 dark:text-gray-300">
            {projectToDelete?.source === 'firebase' && state.cloudUser?.uid !== projectToDelete.ownerId
              ? `Êtes-vous sûr de vouloir quitter le projet "${projectToDelete?.name}" ? Vous n'y aurez plus accès.`
              : `Êtes-vous sûr de vouloir supprimer le projet "${projectToDelete?.name}" ?`
            }
            <br />
            <span className="text-sm text-red-500 dark:text-red-400">
              {projectToDelete?.source === 'firebase' && state.cloudUser?.uid !== projectToDelete.ownerId
                ? "Vous pourrez être réinvité par le propriétaire plus tard."
                : "Attention : Cette action est irréversible et supprimera également toutes les tâches associées."
              }
            </span>
          </p>
          <div className="flex space-x-4 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteConfirm(false);
                setProjectToDelete(null);
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={confirmDeleteProject}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              variant="gradient"
            >
              {projectToDelete?.source === 'firebase' && state.cloudUser?.uid !== projectToDelete.ownerId
                ? <><LogOut className="w-4 h-4 mr-2" />Quitter</>
                : <><Trash2 className="w-4 h-4 mr-2" />Supprimer</>
              }
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de création de projet */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Nouveau Projet"
        size="lg"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Nom du projet *
            </label>
            <input
              type="text"
              value={newProject.name}
              onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white"
              placeholder="Ex: Site web client"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description (optionnel)
            </label>
            <textarea
              value={newProject.description}
              onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/50 dark:bg-gray-700/50 text-gray-900 dark:text-white min-h-[100px]"
              placeholder="Décrivez votre projet..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Couleur du projet
            </label>
            <div className="flex flex-wrap gap-3 items-center">
              {colors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setNewProject({ ...newProject, color })}
                  className={`w-10 h-10 rounded-2xl border-2 transition-all duration-200 transform hover:scale-110 shadow-lg ${newProject.color === color ? 'border-gray-400 scale-110' : 'border-transparent'
                    }`}
                  style={{ backgroundColor: color }}
                />
              ))}
              <div className="flex items-center gap-2 ml-2 pl-4 border-l border-gray-200 dark:border-gray-700">
                <div className="relative group">
                  <input
                    type="color"
                    value={newProject.color}
                    onChange={(e) => setNewProject({ ...newProject, color: e.target.value })}
                    className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-transparent cursor-pointer bg-transparent shadow-lg transform hover:scale-110 transition-transform"
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">
                    Couleur libre
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-4 pt-6">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreateModal(false);
                resetNewProjectForm();
              }}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                createProject();
                setShowCreateModal(false);
              }}
              variant="gradient"
              className="flex-1"
              disabled={!newProject.name.trim()}
            >
              Créer le projet
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de gestion des membres */}
      <MembersModal
        isOpen={!!managingMembersProject}
        onClose={() => setManagingMembersProject(null)}
        project={managingMembersProject}
      />

      {/* Modal d'édition de tâche */}
      {editingTask && editingProject && (
        <EditTaskForm
          task={editingTask}
          onClose={() => setEditingTask(null)}
          project={editingProject}
        />
      )}
    </div>
  );
}