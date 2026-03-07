import React, { useEffect, useState, useMemo } from 'react';
import { Project, Task, Attachment } from '../../types';
import { calculateDuration, isMultiDayTask } from '../../utils/dateUtils';
import { MediaViewer } from '../UI/MediaViewer';
import { UploadedFile } from '../../services/collaboration/cloudinaryService';
import { firebaseService } from '../../services/collaboration/firebaseService';
import { Card } from '../UI/Card';
import {
  Clock,
  Calendar as CalendarIcon,
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Kanban,
  CalendarDays,
  TrendingUp,
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  ListTodo,
  Target,
  Zap,
  Activity,
  ChevronLeft,
  LayoutGrid,
  CalendarSearch,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Play
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'framer-motion';

// --- Utilities ---
const cleanMarkdown = (text: string): string => {
  if (!text) return text;
  return text.replace(/\*\*\*+/g, '**').replace(/\*\*(.*?)\*\*/g, '**$1**');
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'done': return { label: 'Livré', color: 'text-green-600', bg: 'bg-green-500', icon: CheckCircle2 };
    case 'in-progress': return { label: 'En Cours', color: 'text-blue-600', bg: 'bg-indigo-600', icon: Clock };
    default: return { label: 'À Venir', color: 'text-gray-500', bg: 'bg-gray-400', icon: Circle };
  }
};

const isTaskActiveOnDay = (task: Task, date: Date) => {
  const start = new Date(task.startDate);
  const end = new Date(task.dueDate || task.endDate || task.startDate);

  const d = new Date(date); d.setHours(0, 0, 0, 0);
  const s = new Date(start); s.setHours(0, 0, 0, 0);
  const e = new Date(end); e.setHours(23, 59, 59, 999);

  return d >= s && d <= e;
};

// --- Sub-components ---

const DashboardView = ({ project, stats, tasks, attachments, onSelectView, onOpenMediaViewer }: {
  project: Project,
  stats: { total: number, done: number, progress: number, inProgress: number },
  tasks: Task[],
  attachments: any[],
  onSelectView: (v: ViewMode) => void,
  onOpenMediaViewer: (attachments: Attachment[], index: number) => void
}) => {
  const projectColor = project.color || '#4f46e5';

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-shrink-0 max-h-[70%] lg:max-h-none overflow-y-auto lg:overflow-visible pr-1 custom-scroll">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-[1.5rem] lg:rounded-[2.5rem] p-5 lg:p-8 relative overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700 font-sans group/card"
        >
          {/* Background Layer: Cover Image or Gradient */}
          {project.coverImage ? (
            <>
              <div className="absolute inset-0 z-0">
                <img
                  src={project.coverImage}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-700 group-hover/card:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 dark:from-gray-900 dark:via-gray-900/95 dark:to-gray-900/40 opacity-90"></div>
              </div>
            </>
          ) : (
            <div className="absolute top-0 right-0 w-48 h-48 opacity-10 blur-[60px] rounded-full -mr-10 -mt-10" style={{ backgroundColor: projectColor }}></div>
          )}

          <div className="relative z-10 flex flex-col h-full justify-between">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-100 dark:border-gray-700 mb-4">
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: projectColor }}></span>
                <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Aperçu Stratégique</span>
              </div>
              <h2 className="text-xl md:text-3xl font-black text-gray-900 dark:text-white mb-3 tracking-tighter leading-none">{project.name}</h2>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-500 dark:text-gray-400 font-medium leading-relaxed line-clamp-3 lg:line-clamp-2 mb-6">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanMarkdown(project.description)}</ReactMarkdown>
              </div>
            </div>
            <button
              onClick={() => onSelectView('timeline')}
              className="w-fit px-6 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 transition-all hover:translate-x-1 shadow-lg mt-auto"
            >
              Voir la chronologie <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="bg-gray-950 rounded-[1.5rem] lg:rounded-[2.5rem] p-6 lg:p-8 text-white shadow-xl flex flex-col justify-between relative overflow-hidden border border-white/5 min-h-[180px] lg:min-h-0"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-blue-500/5"></div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 lg:mb-6">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-indigo-300">Statistiques</span>
              <Target className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-1 mb-3 lg:mb-4">
              <span className="text-4xl lg:text-5xl font-black tracking-tighter">{stats.progress}</span>
              <span className="text-lg lg:text-xl font-black text-indigo-400">%</span>
            </div>
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6 lg:mb-8">
              <motion.div
                initial={{ width: 0 }} animate={{ width: `${stats.progress}%` }} transition={{ duration: 1 }}
                className="h-full" style={{ backgroundColor: projectColor }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300 block">Total</span>
                <span className="text-xl font-black">{stats.total}</span>
              </div>
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-indigo-300 block">Livré</span>
                <span className="text-xl font-black text-green-400">{stats.done}</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 custom-scroll">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pb-4">
          {[
            { label: 'Prochaines Étapes', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/10', count: stats.total - stats.done, view: 'board' as ViewMode },
            { label: 'Travaux en cours', icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/10', count: stats.inProgress, view: 'board' as ViewMode },
            { label: 'Echéances Proches', icon: CalendarDays, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/10', count: 'Calendrier', view: 'calendar' as ViewMode },
            { label: 'Journal de Bord', icon: Activity, color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/10', count: 'Activités', view: 'feed' as ViewMode }
          ].map((item, i) => (
            <motion.div
              key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 + (i * 0.05) }}
              onClick={() => onSelectView(item.view)}
              className="bg-white dark:bg-gray-800 p-6 rounded-3xl border border-gray-100 dark:border-gray-700 shadow-sm cursor-pointer hover:shadow-lg transition-all group"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${item.bg}`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <h4 className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">{item.label}</h4>
              <div className="text-lg font-black text-gray-900 dark:text-white">{item.count}</div>
            </motion.div>
          ))}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-[10px] font-black uppercase tracking-widest">Derniers mouvements</h4>
            <button onClick={() => onSelectView('feed')} className="text-[9px] font-black text-indigo-500">Tout voir</button>
          </div>
          <div className="space-y-3">
            {tasks.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100/50 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${t.status === 'done' ? 'bg-green-500' : 'bg-blue-500'}`}></div>
                  <span className="text-xs font-bold truncate max-w-[150px]">{t.title}</span>
                </div>
                <span className="text-[9px] text-gray-400">{new Date(t.updatedAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Section Fichiers Joints */}
        {attachments.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 my-6 border border-gray-100 dark:border-gray-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <Paperclip className="w-3 h-3 text-indigo-500" />
                Dépôt de fichiers ({attachments.length})
              </h4>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {attachments.slice(0, 6).map((file, i) => (
                <button
                  key={file.id || i}
                  onClick={() => onOpenMediaViewer(attachments, i)}
                  className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-gray-100/50 dark:border-gray-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all group"
                >
                  <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center shrink-0">
                    <FileText className="w-3 h-3 text-indigo-500" />
                  </div>
                  <span className="text-[9px] font-bold truncate text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 transition-colors">{file.name}</span>
                </button>
              ))}
              {attachments.length > 6 && (
                <div className="flex items-center justify-center p-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">
                  <span className="text-[9px] font-black text-gray-400">+{attachments.length - 6} autres</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// --- Updated Calendar Component ---

type CalendarScale = 'day' | 'week' | 'month' | 'quarter' | 'semester';

const CalendarView = ({ tasks, onSelectTask }: { tasks: Task[], onSelectTask: (t: Task) => void }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [scale, setScale] = useState<CalendarScale>('month');

  const generateWeeks = useMemo(() => {
    const periodDays = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    if (scale === 'month') {
      const firstDay = new Date(year, month, 1);
      const startOffset = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Mon-Sun
      const firstDate = new Date(year, month, 1 - startOffset);

      for (let i = 0; i < 42; i++) {
        const d = new Date(firstDate);
        d.setDate(firstDate.getDate() + i);
        periodDays.push({ date: d, isCurrentMonth: d.getMonth() === month });
      }
    } else if (scale === 'week') {
      const day = currentDate.getDay();
      const diff = currentDate.getDate() - day + (day === 0 ? -6 : 1);
      const start = new Date(currentDate);
      start.setDate(diff);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        periodDays.push({ date: d, isCurrentMonth: true });
      }
    }

    const weeks = [];
    if (periodDays.length > 0) {
      for (let i = 0; i < periodDays.length; i += 7) weeks.push(periodDays.slice(i, i + 7));
    }
    return weeks;
  }, [currentDate, scale]);

  const quarterMonths = useMemo(() => {
    const startMonth = Math.floor(currentDate.getMonth() / 3) * 3;
    const year = currentDate.getFullYear();
    return [0, 1, 2].map(m => new Date(year, startMonth + m, 1));
  }, [currentDate]);

  const semesterMonths = useMemo(() => {
    const startMonth = Math.floor(currentDate.getMonth() / 6) * 6;
    const year = currentDate.getFullYear();
    return [0, 1, 2, 3, 4, 5].map(m => new Date(year, startMonth + m, 1));
  }, [currentDate]);

  const changePeriod = (offset: number) => {
    const newDate = new Date(currentDate);
    if (scale === 'month') newDate.setMonth(currentDate.getMonth() + offset);
    else if (scale === 'week') newDate.setDate(currentDate.getDate() + offset * 7);
    else if (scale === 'day') newDate.setDate(currentDate.getDate() + offset);
    else if (scale === 'quarter') newDate.setMonth(currentDate.getMonth() + offset * 3);
    else if (scale === 'semester') newDate.setMonth(currentDate.getMonth() + offset * 6);
    setCurrentDate(newDate);
  };

  const dayTasks = tasks.filter(t => isTaskActiveOnDay(t, currentDate));

  return (
    <div className="h-full flex flex-col gap-4 overflow-hidden">
      {/* Navigation Header */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3 lg:gap-4 flex-shrink-0 bg-white dark:bg-gray-800 p-4 lg:p-5 rounded-2xl lg:rounded-[2rem] border border-gray-100 dark:border-gray-700 shadow-sm font-sans">
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <h3 className="text-sm lg:text-lg font-black text-gray-900 dark:text-white capitalize min-w-[120px] lg:min-w-[180px]">
            {scale === 'quarter' ? `Trim ${Math.floor(currentDate.getMonth() / 3) + 1} ${currentDate.getFullYear()}` :
              scale === 'semester' ? `Sem ${Math.floor(currentDate.getMonth() / 6) + 1} ${currentDate.getFullYear()}` :
                currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric', ...(scale === 'day' ? { day: 'numeric' } : {}) })}
          </h3>
          <div className="flex bg-gray-50 dark:bg-gray-900 p-1 rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto scrollbar-hide">
            {(['day', 'week', 'month', 'quarter', 'semester'] as CalendarScale[]).map(s => (
              <button
                key={s} onClick={() => setScale(s)}
                className={`flex-shrink-0 px-2 lg:px-3 py-1 text-[7px] lg:text-[8px] font-black uppercase tracking-widest rounded-lg transition-all ${scale === s ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-600' : 'text-gray-400'}`}
              >
                {s === 'day' ? 'Jour' : s === 'week' ? 'Sem' : s === 'month' ? 'Mois' : s === 'quarter' ? 'Trim' : 'Sem'}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between w-full md:w-auto gap-2">
          <button onClick={() => changePeriod(-1)} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 transition-all"><ChevronLeft className="w-3 h-3 lg:w-4 lg:h-4" /></button>
          <button onClick={() => setCurrentDate(new Date())} className="flex-1 md:flex-none px-4 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[8px] lg:text-[9px] font-black uppercase rounded-lg">Aujourd'hui</button>
          <button onClick={() => changePeriod(1)} className="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 transition-all"><ChevronRight className="w-3 h-3 lg:w-4 lg:h-4" /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 lg:pr-2 custom-scroll pb-4 font-sans">
        {/* Day View */}
        {scale === 'day' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 lg:space-y-6">
            <div className="p-6 lg:p-10 bg-white dark:bg-gray-800 rounded-2xl lg:rounded-[2.5rem] border border-gray-100 dark:border-gray-700 text-center shadow-sm relative overflow-hidden">
              <CalendarSearch className="w-8 h-8 lg:w-12 lg:h-12 mx-auto text-indigo-100 dark:text-gray-800 mb-4" />
              <h4 className="text-base lg:text-xl font-black mb-1 lg:mb-2">Missions du {currentDate.toLocaleDateString()}</h4>
              <p className="text-[8px] lg:text-[10px] text-gray-400 font-black uppercase tracking-widest">{dayTasks.length} Tâche(s) active(s)</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:gap-4">
              {dayTasks.map(t => (
                <div key={t.id} onClick={() => onSelectTask(t)} className="p-4 lg:p-6 bg-white dark:bg-gray-800 rounded-xl lg:rounded-[2rem] border border-gray-100 dark:border-gray-700 flex items-center justify-between cursor-pointer group hover:border-indigo-500 transition-all shadow-sm">
                  <div className="flex items-center gap-3 lg:gap-4">
                    <div className={`w-8 h-8 lg:w-10 lg:h-10 rounded-xl flex items-center justify-center text-white ${getStatusInfo(t.status).bg}`}>{React.createElement(getStatusInfo(t.status).icon, { className: 'w-4 h-4 lg:w-5 lg:h-5' })}</div>
                    <div><p className="text-xs lg:text-sm font-black truncate max-w-[150px] lg:max-w-none">{t.title}</p><p className="text-[8px] lg:text-[10px] text-gray-400 uppercase font-black">{t.priority || 'Normal'}</p></div>
                  </div>
                  <ChevronRight className="w-3 h-3 lg:w-4 lg:h-4 text-gray-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
              ))}
              {dayTasks.length === 0 && (
                <div className="md:col-span-2 py-12 lg:py-20 text-center border-2 border-dashed border-gray-100 dark:border-gray-800 rounded-2xl lg:rounded-[3rem] opacity-40">
                  <p className="text-[8px] lg:text-[10px] font-black uppercase tracking-widest">Aucune mission pour cette date</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Week & Month Spanning View (FIXED LAYOUT) */}
        {(scale === 'week' || scale === 'month') && (
          <div className="flex flex-col gap-1 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl lg:rounded-[2rem] p-1 lg:p-1.5 shadow-inner">
            <div className="grid grid-cols-7 gap-0.5 lg:gap-1 mb-1">
              {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, idx) => (
                <div key={idx} className="py-2 text-center text-[7px] lg:text-[9px] font-black uppercase tracking-widest text-gray-400">{d}</div>
              ))}
            </div>

            {generateWeeks.map((week, weekIdx) => {
              const weekStart = new Date(week[0].date); weekStart.setHours(0, 0, 0, 0);
              const weekEnd = new Date(week[6].date); weekEnd.setHours(23, 59, 59, 999);

              const weekTasks = tasks.filter(t => {
                const s = new Date(t.startDate); s.setHours(0, 0, 0, 0);
                const e = new Date(t.dueDate || t.endDate || t.startDate); e.setHours(23, 59, 59, 999);
                return s <= weekEnd && e >= weekStart;
              }).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());

              const slots: (Task | null)[][] = [];
              const maxShownSlots = 3;

              weekTasks.forEach(task => {
                const s = new Date(task.startDate); s.setHours(0, 0, 0, 0);
                const e = new Date(task.dueDate || task.endDate || task.startDate); e.setHours(23, 59, 59, 999);
                const startCol = Math.max(0, Math.floor((s.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));
                const endCol = Math.min(6, Math.floor((e.getTime() - weekStart.getTime()) / (24 * 3600 * 1000)));

                for (let i = 0; i < maxShownSlots; i++) {
                  if (!slots[i]) slots[i] = new Array(7).fill(null);
                  let overlap = false;
                  for (let col = startCol; col <= endCol; col++) if (slots[i][col]) overlap = true;
                  if (!overlap) {
                    for (let col = startCol; col <= endCol; col++) slots[i][col] = task;
                    break;
                  }
                }
              });

              return (
                <div key={weekIdx} className="grid grid-cols-7 grid-rows-[24px_repeat(3,20px)] lg:grid-rows-[30px_repeat(3,28px)] gap-0.5 lg:gap-1 relative mb-1 last:mb-0 min-h-[90px] lg:min-h-[120px]">
                  {/* Background Day Cells */}
                  {week.map((day, dIdx) => {
                    const isToday = day.date.toDateString() === new Date().toDateString();
                    return (
                      <div key={dIdx} style={{ gridColumn: dIdx + 1, gridRow: '1 / span 5' }} className={`rounded-lg lg:rounded-xl border transition-all ${isToday ? 'bg-indigo-600/10 border-indigo-500/30 shadow-inner' : 'bg-white dark:bg-gray-800 border-gray-100/50 dark:border-gray-700/50'} ${!day.isCurrentMonth && scale === 'month' ? 'opacity-30 grayscale' : ''}`}>
                        <div className={`p-1.5 lg:p-2 text-[8px] lg:text-[10px] font-black ${isToday ? 'text-indigo-600' : 'text-gray-300 dark:text-gray-600'}`}>{day.date.getDate()}</div>
                      </div>
                    );
                  })}

                  {/* Task Bars Overlay */}
                  {slots.map((slot, sIdx) => {
                    let currentBatch: { task: Task, start: number, count: number } | null = null;
                    const bars = [];
                    for (let col = 0; col < 7; col++) {
                      const t = slot[col];
                      if (t) {
                        if (currentBatch && currentBatch.task.id === t.id) { currentBatch.count++; }
                        else { if (currentBatch) bars.push(currentBatch); currentBatch = { task: t, start: col, count: 1 }; }
                      } else { if (currentBatch) bars.push(currentBatch); currentBatch = null; }
                    }
                    if (currentBatch) bars.push(currentBatch);

                    return bars.map((bar, bIdx) => {
                      const startsInThisWeek = new Date(bar.task.startDate).getTime() >= weekStart.getTime();
                      return (
                        <div
                          key={`${sIdx}-${bIdx}`}
                          onClick={() => onSelectTask(bar.task)}
                          style={{
                            gridColumn: `${bar.start + 1} / span ${bar.count}`,
                            gridRow: sIdx + 2,
                            zIndex: 10
                          }}
                          className={`h-4 lg:h-6 mt-1 rounded-md lg:rounded-lg text-[6px] lg:text-[8px] font-black text-white px-1 lg:px-3 flex items-center truncate cursor-pointer shadow-sm hover:scale-[1.01] transition-transform ${getStatusInfo(bar.task.status).bg} ${!startsInThisWeek ? 'rounded-l-none pl-0.5 border-l border-white/20' : ''}`}
                        >
                          <span className="truncate">{startsInThisWeek ? bar.task.title : `..${bar.task.title}`}</span>
                        </div>
                      );
                    });
                  })}
                </div>
              );
            })}
          </div>
        )}

        {/* Quarterly & Semester Planner */}
        {(scale === 'quarter' || scale === 'semester') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {(scale === 'quarter' ? quarterMonths : semesterMonths).map((startOfMonth, i) => {
              const monthTasks = tasks.filter(t => {
                const start = new Date(t.startDate);
                const end = new Date(t.dueDate || t.endDate || t.startDate);
                const m = startOfMonth.getMonth();
                const y = startOfMonth.getFullYear();
                const monthStart = new Date(y, m, 1);
                const monthEnd = new Date(y, m + 1, 0);
                return (start <= monthEnd && end >= monthStart);
              });
              return (
                <div key={i} className="bg-white dark:bg-gray-800 rounded-[2rem] p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-4 max-h-[400px]">
                  <div className="flex items-center justify-between border-b border-gray-50 dark:border-gray-700 pb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500">{startOfMonth.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</h4>
                    <span className="text-[10px] font-bold text-gray-400">{monthTasks.length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 custom-scroll space-y-2 scrollbar-hide">
                    {monthTasks.map(t => (
                      <div key={t.id} onClick={() => onSelectTask(t)} className="p-3 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-100/50 dark:border-gray-800 flex items-center gap-3 cursor-pointer group">
                        <div className={`w-1.5 h-1.5 rounded-full ${getStatusInfo(t.status).bg}`}></div>
                        <span className="text-[10px] font-bold truncate flex-1 group-hover:text-indigo-500 transition-colors uppercase tracking-tight">{t.title}</span>
                      </div>
                    ))}
                    {monthTasks.length === 0 && <p className="text-[8px] text-gray-300 uppercase font-black text-center pt-10">Aucune mission</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Main App ---

type ViewMode = 'dashboard' | 'board' | 'timeline' | 'feed' | 'calendar';

export const PublicProjectView = ({ projectId: propProjectId }: { projectId?: string }) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [projectId, setProjectId] = useState<string | null>(propProjectId || null);
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // MediaViewer state
  const [mediaViewerFile, setMediaViewerFile] = useState<UploadedFile | null>(null);
  const [mediaViewerFiles, setMediaViewerFiles] = useState<UploadedFile[]>([]);
  const [mediaViewerIndex, setMediaViewerIndex] = useState(0);

  // Convertir un Attachment en UploadedFile pour MediaViewer
  const attachmentToUploadedFile = (att: Attachment): UploadedFile => ({
    url: att.url,
    name: att.name,
    type: att.type,
    size: att.size,
    publicId: att.id,
    uploadedAt: att.uploadedAt,
    uploadedBy: att.uploadedBy || '',
  });

  const openMediaViewer = (attachments: Attachment[], index: number) => {
    const files = attachments.map(attachmentToUploadedFile);
    setMediaViewerFiles(files);
    setMediaViewerIndex(index);
    setMediaViewerFile(files[index]);
  };

  const getFileIcon = (att: Attachment) => {
    if (att.type === 'image') return <ImageIcon className="w-5 h-5 text-indigo-600" />;
    if (att.type === 'video') return <Film className="w-5 h-5 text-purple-600" />;
    if (att.type === 'audio') return <Music className="w-5 h-5 text-pink-600" />;
    return <FileText className="w-5 h-5 text-indigo-600" />;
  };

  const getFileIconBg = (att: Attachment) => {
    if (att.type === 'image') return 'bg-indigo-50 dark:bg-indigo-900/30';
    if (att.type === 'video') return 'bg-purple-50 dark:bg-purple-900/30';
    if (att.type === 'audio') return 'bg-pink-50 dark:bg-pink-900/30';
    return 'bg-gray-50 dark:bg-gray-800';
  };

  useEffect(() => {
    if (!projectId) {
      const id = new URLSearchParams(window.location.search).get('id');
      setProjectId(id);
      if (!id) { setError("Accès non spécifié"); setLoading(false); }
    }
  }, [propProjectId, projectId]);

  useEffect(() => {
    if (!projectId) return;

    // Écoute en temps réel des changements du projet
    const unsubscribe = firebaseService.onPublicProjectUpdate(projectId, (updatedProject) => {
      if (updatedProject) {
        setProject(updatedProject);
        setLoading(false);
        setError(null);
      } else {
        setError("Ce projet n'est plus public ou n'existe pas.");
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-white dark:bg-[#0B0F1A]">
      <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
      <span className="text-[9px] uppercase font-black tracking-[0.3em] text-gray-400">Synchronisation des données...</span>
    </div>
  );

  if (error || !project) return (
    <div className="h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <Card className="max-w-md w-full p-12 text-center rounded-[2.5rem] border-0 shadow-2xl bg-white dark:bg-gray-800 font-sans">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-2xl font-black mb-2 tracking-tighter">Accès Restreint</h2>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-8 font-medium">{error}</p>
        <a href="/" className="inline-flex px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-950 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg">Retour Accueil</a>
      </Card>
    </div>
  );

  const tasks = (project.tasks || []).filter(t => t.status !== 'non-suivi');
  const allAttachments = tasks.flatMap(t => t.attachments || []);

  const stats = {
    total: tasks.length,
    done: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    progress: Math.round((tasks.filter(t => t.status === 'done').length / (tasks.length || 1)) * 100)
  };

  const renderTaskCard = (task: Task) => (
    <motion.div
      layoutId={task.id} onClick={() => setSelectedTask(task)}
      className="group cursor-pointer font-sans"
      whileHover={{ y: -3, scale: 1.01 }}
    >
      <Card className="p-5 bg-white dark:bg-gray-800/80 rounded-[2rem] border-0 shadow-lg shadow-gray-200/30 dark:shadow-black/20 group-hover:shadow-xl transition-all relative overflow-hidden backdrop-blur-sm">
        <div className={`absolute top-0 right-0 w-24 h-24 blur-[30px] opacity-5 rounded-full -mr-12 -mt-12 ${getStatusInfo(task.status).bg}`}></div>
        <div className="flex gap-4 mb-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-inner ${task.status === 'done' ? 'bg-green-50 text-green-600' : task.status === 'in-progress' ? 'bg-indigo-50 text-indigo-600 animate-pulse' : 'bg-gray-50 text-gray-400'}`}>
            {React.createElement(getStatusInfo(task.status).icon, { className: 'w-4 h-4' })}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-black text-sm tracking-tight mb-0.5 truncate ${task.status === 'done' ? 'text-gray-300 line-through' : 'text-gray-900 dark:text-white'}`}>{task.title}</h4>
            <div className="flex items-center gap-1.5 text-[8px] font-black text-gray-400 uppercase tracking-widest"><CalendarDays className="w-3 h-3" /> {new Date(task.startDate).toLocaleDateString()} {task.dueDate && `→ ${new Date(task.dueDate).toLocaleDateString()}`}</div>
          </div>
        </div>
        <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 font-medium mb-4 leading-relaxed">{task.description}</p>
        <div className="flex justify-between items-center pt-4 border-t border-gray-100/50 dark:border-gray-700/50">
          <span className={`text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-lg ${task.priority === 'high' ? 'bg-red-50 text-red-500' : 'bg-gray-50 text-gray-400'}`}>{task.priority || 'Normal'}</span>
          <span className="text-[9px] font-black text-indigo-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">Détails <ChevronRight className="w-3 h-3" /></span>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#FDFEFE] dark:bg-[#0B0F1A] transition-colors duration-500 overflow-hidden font-sans text-gray-900 dark:text-white">
      <nav className="flex-shrink-0 px-4 py-3 lg:px-10 lg:py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3 lg:px-6 lg:py-4 bg-white/70 dark:bg-gray-900/80 backdrop-blur-3xl border border-white/40 dark:border-gray-800/50 rounded-2xl lg:rounded-3xl shadow-xl">
          <div className="flex items-center gap-3 lg:gap-4 overflow-hidden">
            <div className="w-8 h-8 lg:w-10 lg:h-10 bg-gray-950 dark:bg-white rounded-lg lg:rounded-xl flex items-center justify-center font-black text-white dark:text-gray-950 shadow-lg shrink-0 text-xs lg:text-base">PF</div>
            <div className="min-w-0">
              <h1 className="text-xs lg:text-sm font-black text-gray-900 dark:text-white tracking-tight truncate max-w-[120px] sm:max-w-[200px]">{project.name}</h1>
              <div className="text-[7px] lg:text-[8px] font-black text-blue-500 uppercase tracking-[0.2em]">Espace Premium</div>
            </div>
          </div>

          <div className="flex items-center bg-gray-50 dark:bg-gray-800/50 p-0.5 lg:p-1 rounded-xl lg:rounded-2xl border border-gray-100 dark:border-gray-700/50 overflow-x-auto scrollbar-hide ml-2">
            {[
              { id: 'dashboard', icon: LayoutGrid, label: 'Synthèse' },
              { id: 'board', icon: Kanban, label: 'Tableau' },
              { id: 'timeline', icon: ListTodo, label: 'Plan' },
              { id: 'calendar', icon: CalendarIcon, label: 'Agenda' },
              { id: 'feed', icon: TrendingUp, label: 'Flux' }
            ].map(v => (
              <button
                key={v.id} onClick={() => setViewMode(v.id as ViewMode)}
                className={`flex items-center gap-1.5 lg:gap-2 px-2.5 py-1.5 lg:px-4 lg:py-2 rounded-lg lg:rounded-xl text-[8px] lg:text-[9px] font-black uppercase tracking-widest transition-all ${viewMode === v.id ? 'bg-white dark:bg-gray-700 shadow-md text-gray-900 dark:text-white scale-105' : 'text-gray-400 hover:text-indigo-600 whitespace-nowrap'}`}
              >
                <v.icon className={`w-3 h-3 lg:w-3.5 lg:h-3.5 ${viewMode === v.id ? 'text-indigo-600' : ''}`} />
                <span className="hidden md:inline">{v.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 lg:px-10 pb-8 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {viewMode === 'dashboard' && <motion.div key="db" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><DashboardView project={project} stats={stats} tasks={tasks} attachments={allAttachments} onSelectView={setViewMode} onOpenMediaViewer={openMediaViewer} /></motion.div>}

          {viewMode === 'board' && (
            <motion.div key="board" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="h-full flex gap-6 overflow-x-auto pb-4 custom-scroll">
              {['todo', 'in-progress', 'done'].map(status => (
                <div key={status} className="flex-1 min-w-[300px] flex flex-col h-full gap-4">
                  <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 flex-shrink-0">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${getStatusInfo(status).bg}`}></div>
                      <h3 className="text-[10px] font-black uppercase tracking-widest">{getStatusInfo(status).label}</h3>
                    </div>
                    <span className="text-[10px] font-bold opacity-50">{tasks.filter(t => t.status === status).length}</span>
                  </div>
                  <div className="flex-1 overflow-y-auto pr-2 space-y-4 custom-scroll">
                    {tasks.filter(t => t.status === status).map(task => renderTaskCard(task))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {viewMode === 'timeline' && (
            <motion.div key="timeline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full overflow-y-auto pr-4 custom-scroll py-6 max-w-3xl mx-auto">
              {tasks.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map((task, i) => (
                <div key={task.id} className="flex gap-8 relative group mb-10">
                  <div className="flex flex-col items-center">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg z-10 ${task.status === 'done' ? 'bg-green-500 text-white shadow-green-500/20' : task.status === 'in-progress' ? 'bg-indigo-600 text-white shadow-indigo-600/30' : 'bg-white dark:bg-gray-800 text-gray-300 border border-gray-100 dark:border-gray-700'}`}>{i + 1}</div>
                    {i < tasks.length - 1 && <div className="absolute top-14 bottom-[-40px] w-px bg-gray-100 dark:bg-gray-800 left-7 -translate-x-1/2"></div>}
                  </div>
                  <div className="flex-1">{renderTaskCard(task)}</div>
                </div>
              ))}
            </motion.div>
          )}

          {viewMode === 'calendar' && <motion.div key="cal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full"><CalendarView tasks={tasks} onSelectTask={setSelectedTask} /></motion.div>}

          {viewMode === 'feed' && (
            <motion.div key="feed" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: -20 }} className="h-full overflow-y-auto pr-4 custom-scroll space-y-4">
              {tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).map(task => (
                <div key={task.id} className="p-6 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group">
                  <div className="flex flex-col gap-1">
                    <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest">Activité Récente</div>
                    <h4 className="text-sm font-black">{task.title}</h4>
                    <p className="text-[10px] text-gray-400">Synchronisé le {new Date(task.updatedAt).toLocaleDateString()}</p>
                  </div>
                  <button onClick={() => setSelectedTask(task)} className="p-3 bg-gray-50 dark:bg-gray-950 rounded-xl hover:bg-gray-900 dark:hover:bg-white transition-all"><ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-white" /></button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <AnimatePresence>
        {selectedTask && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 lg:p-12">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedTask(null)} className="absolute inset-0 bg-gray-950/80 backdrop-blur-md" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="relative w-full max-w-5xl bg-white dark:bg-[#0F172A] rounded-[2.5rem] shadow-3xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] border border-white/5 font-sans">
              <div className="md:w-[350px] bg-gray-50 dark:bg-black/20 p-10 border-r border-gray-100 dark:border-gray-800 flex flex-col justify-between overflow-y-auto shadow-inner">
                <div>
                  <button onClick={() => setSelectedTask(null)} className="flex items-center gap-2 text-[9px] font-black text-gray-400 hover:text-gray-900 dark:hover:text-white uppercase tracking-widest mb-10"><ArrowLeft className="w-3 h-3" /> Retour</button>
                  <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-6 shadow-xl ${getStatusInfo(selectedTask.status).bg} text-white`}>
                    {React.createElement(getStatusInfo(selectedTask.status).icon, { className: 'w-8 h-8' })}
                  </div>
                  <h2 className="text-3xl font-black tracking-tighter mb-4 leading-none text-gray-900 dark:text-white">{selectedTask.title}</h2>
                  <div className="flex flex-wrap gap-2">
                    <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest ${getStatusInfo(selectedTask.status).bg} text-white shadow-lg`}>{getStatusInfo(selectedTask.status).label}</span>
                    <span className="px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700">{selectedTask.priority || 'Normal'}</span>
                  </div>
                </div>
                <div className="space-y-6 pt-10 mt-10 border-t border-gray-100 dark:border-gray-800">
                  <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Début</span><span className="text-xs font-black">{new Date(selectedTask.startDate).toLocaleDateString()}</span></div>
                  <div className="flex justify-between items-center"><span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Échéance</span><span className="text-xs font-black text-red-500">{selectedTask.dueDate ? new Date(selectedTask.dueDate).toLocaleDateString() : 'Non définie'}</span></div>
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">
                      {isMultiDayTask(selectedTask.startDate, selectedTask.dueDate || selectedTask.endDate || selectedTask.startDate)
                        ? 'Durée totale'
                        : 'Charge estimée'
                      }
                    </span>
                    <span className="text-xs font-black text-indigo-500">
                      {isMultiDayTask(selectedTask.startDate, selectedTask.dueDate || selectedTask.endDate || selectedTask.startDate)
                        ? calculateDuration(selectedTask.startDate, selectedTask.dueDate || selectedTask.endDate || selectedTask.startDate)
                        : selectedTask.estimatedHours && selectedTask.estimatedHours > 0
                          ? `${selectedTask.estimatedHours}h`
                          : 'Non spécifié'
                      }
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex-1 p-10 lg:p-16 overflow-y-auto overflow-x-hidden bg-white dark:bg-[#0F172A] min-w-0">
                <div className="w-full min-w-0">
                  <div className="mb-12">
                    <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-500 mb-6 border-b border-indigo-100 dark:border-indigo-900 pb-2">Mission</h4>
                    <div className="prose dark:prose-invert prose-sm max-w-none font-medium text-gray-500 leading-relaxed break-words overflow-hidden">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanMarkdown(selectedTask.description)}</ReactMarkdown>
                    </div>
                  </div>

                  {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                    <div className="mb-12">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white mb-6">Documents &amp; Médias</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {selectedTask.attachments.map((att, idx) => (
                          <button
                            key={att.id}
                            type="button"
                            onClick={() => openMediaViewer(selectedTask.attachments!, idx)}
                            className="flex items-center gap-4 p-4 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 hover:bg-white dark:hover:bg-white/10 hover:shadow-xl hover:scale-[1.02] transition-all group text-left w-full min-w-0"
                          >
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0 ${getFileIconBg(att)}`}>
                              {att.type === 'image' ? (
                                <div className="relative w-full h-full rounded-2xl overflow-hidden">
                                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Play className="w-4 h-4 text-white" />
                                  </div>
                                </div>
                              ) : (
                                getFileIcon(att)
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-[10px] font-black truncate text-gray-900 dark:text-white uppercase">{att.name}</div>
                              <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">{att.type || 'Fichier'}</div>
                            </div>
                            <Play className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-colors flex-shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedTask.subTasks && selectedTask.subTasks.length > 0 && (
                    <div className="space-y-8 pb-12">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.3em] text-gray-900 dark:text-white mb-6">Objectifs intermédiaires</h4>
                      <div className="grid grid-cols-1 gap-3">
                        {selectedTask.subTasks.map(sub => (
                          <div key={sub.id} className="flex items-center gap-4 p-5 rounded-3xl bg-gray-50/50 dark:bg-white/5 border border-gray-100 dark:border-white/5 min-w-0">
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0 ${sub.completed ? 'bg-green-500 text-white ring-4 ring-green-500/10' : 'bg-white dark:bg-gray-800'}`}>
                              {sub.completed ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4 text-gray-300" />}
                            </div>
                            <span className={`text-sm font-bold break-words min-w-0 flex-1 ${sub.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300'}`}>{sub.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MediaViewer pour les fichiers joints */}
      {mediaViewerFile && (
        <MediaViewer
          file={mediaViewerFile}
          files={mediaViewerFiles}
          isOpen={!!mediaViewerFile}
          onClose={() => setMediaViewerFile(null)}
          onNext={() => {
            const next = Math.min(mediaViewerIndex + 1, mediaViewerFiles.length - 1);
            setMediaViewerIndex(next);
            setMediaViewerFile(mediaViewerFiles[next]);
          }}
          onPrevious={() => {
            const prev = Math.max(mediaViewerIndex - 1, 0);
            setMediaViewerIndex(prev);
            setMediaViewerFile(mediaViewerFiles[prev]);
          }}
        />
      )}

      <style>{`
        .custom-scroll::-webkit-scrollbar { width: 5px; height: 5px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 20px; border: 2px solid transparent; background-clip: content-box; }
        .dark .custom-scroll::-webkit-scrollbar-thumb { background: #374151; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
};
