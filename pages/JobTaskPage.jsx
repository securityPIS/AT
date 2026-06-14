// Halaman utama Job Task: daftar Main Task (aside kiri) + panel detail
// project & subtask (main kanan) dengan tiga mode tampilan List/Gantt/Log.
import { AlertCircle, AlertTriangle, ArrowLeft, BarChart2, Briefcase, Calendar, CalendarDays, Check, CheckCircle, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Circle, Clock, Edit2, ExternalLink, FileText, History, Layout, List, PenSquare, Plus, Settings, Trash2, Upload, Users } from 'lucide-react';
import UserAvatar from '../components/UserAvatar.jsx';
import { ACTIVITY_LOG_ACTION_META } from '../lib/constants.js';
import { addDays, formatDateIndo, formatLogTimeLabel, formatTimelineLabel, getTimelinePercent, parseDateValue, toDateInputValue } from '../lib/dateUtils.js';
import { getGanttStatusLabel, getLatestProjectUpdate, getProjectStatus, getTaskDeadlineBadge } from '../lib/taskUtils.js';
import { getApprovedEvidenceKeys, getNormalizedEvidenceEntries } from '../lib/evidenceUtils.js';

export default function JobTaskPage({
  activeTask,
  activeTaskActivityLog,
  applyGanttPreset,
  canManageActiveTaskSubtasks,
  currentUser,
  deleteSubtask,
  eventByLinkedTaskId,
  eventByTitle,
  events,
  expandedSubtasks,
  ganttData,
  ganttRangeEnd,
  ganttRangePreset,
  ganttRangeStart,
  ganttShowCompleted,
  ganttTooltip,
  ganttZoomLevel,
  handleDeleteMainTask,
  handleEditMainTask,
  handleGanttTooltipMove,
  handleOpenUserTaskDetail,
  handleTaskClick,
  isActiveTaskOwnerPic,
  isMainTaskDetailExpanded,
  isSidebarCollapsed,
  maintaskFilter,
  openAddSubtaskModal,
  openCoeCalendarForEvent,
  openEditSubtaskModal,
  openEventModal,
  openEvidenceModal,
  openNewTaskModal,
  openReviseModal,
  selectedTaskId,
  setGanttRangeEnd,
  setGanttRangePreset,
  setGanttRangeStart,
  setGanttShowCompleted,
  setGanttTooltip,
  setGanttZoomLevel,
  setIsMainTaskDetailExpanded,
  setIsSidebarCollapsed,
  setMaintaskFilter,
  setShowGanttFilters,
  setShowMobileDetail,
  setViewMode,
  showGanttFilters,
  showMobileDetail,
  tasks,
  toggleSubtask,
  userByName,
  userRole,
  viewMode,
}) {
  return (
          <>
            <aside className={`w-full md:w-1/3 border-r border-slate-200 bg-white flex-col h-full ${showMobileDetail ? 'hidden md:flex' : 'flex'} ${isSidebarCollapsed ? 'md:hidden' : 'md:flex'}`}>
              <div className="p-4 border-b border-slate-100 flex flex-col bg-slate-50/50 gap-3">
                <div className="flex justify-between items-center w-full">
                  <h2 className="font-semibold text-slate-700 flex items-center gap-2"><Layout className="w-4 h-4" /> Main Task</h2>
                  <div className="flex items-center gap-1.5">
                    {currentUser && <button onClick={openNewTaskModal} className="bg-blue-600 hover:bg-blue-700 text-white p-1.5 rounded-md transition-colors"><Plus className="w-4 h-4" /></button>}
                    <button onClick={() => setIsSidebarCollapsed(true)} className="hidden md:block text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-1.5 rounded transition-colors" title="Sembunyikan Sidebar">
                      <ChevronLeft className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-1.5 w-full">
                  {[
                    { label: 'SUBMITTED', display: 'NEW ENTRY', colorClass: 'text-blue-700 bg-blue-50 border-blue-200', activeClass: 'bg-blue-600 text-white border-blue-600' },
                    { label: 'REVIEW', display: 'REVIEW', colorClass: 'text-yellow-700 bg-yellow-50 border-yellow-200', activeClass: 'bg-yellow-500 text-white border-yellow-500' },
                    { label: 'REVISE', display: 'REVISE', colorClass: 'text-red-700 bg-red-50 border-red-200', activeClass: 'bg-red-500 text-white border-red-500' },
                    { label: 'COMPLETED', display: 'COMPLETED', colorClass: 'text-green-700 bg-green-50 border-green-200', activeClass: 'bg-green-500 text-white border-green-500' }
                  ].map(stat => {
                    const count = tasks.filter(t => getProjectStatus(t).label === stat.label).length;
                    const isActive = maintaskFilter === stat.label;
                    return (
                      <button
                        key={stat.label}
                        onClick={() => setMaintaskFilter(isActive ? null : stat.label)}
                        className={`flex flex-col items-center justify-center p-1.5 rounded-md border text-[9px] font-bold transition-all shadow-sm ${isActive ? stat.activeClass : stat.colorClass + ' hover:opacity-80'}`}
                      >
                        <span className="truncate w-full text-center">{stat.display}</span>
                        <span>({count})</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="overflow-y-auto flex-1 p-3 space-y-2">
                {tasks.filter(t => !maintaskFilter || getProjectStatus(t).label === maintaskFilter).map((task) => {
                  const status = getProjectStatus(task);
                  const latestUpdate = getLatestProjectUpdate(task);
                  const deadlineBadge = getTaskDeadlineBadge(task.deadline);
                  return (
                    <div key={task.id} onClick={() => handleTaskClick(task.id)} className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md group relative ${selectedTaskId === task.id ? `${status.color} ${status.ring} ring-1 shadow-sm` : 'bg-white border-slate-200 hover:bg-slate-50'}`}>
                      <div className="flex justify-between items-start mb-2"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${status.badge}`}>{status.label}</span><span className={`text-[10px] font-semibold ${deadlineBadge.className}`}>{deadlineBadge.label}</span></div>
                      <div className="flex items-center gap-1 text-xs text-slate-500 mb-1"><Users className="w-3 h-3" /><span className="truncate font-medium">{task.pic}</span></div>
                      <h3 className={`font-bold text-sm mb-1 line-clamp-2 ${status.text}`}>{task.title}</h3>
                      <div className="mt-3">
                        <div className="flex items-center gap-2 w-full"><div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden"><div className={`h-full rounded-full ${status.label === 'COMPLETED' ? 'bg-green-500' : status.label === 'REVISE' ? 'bg-red-500' : status.label === 'REVIEW' ? 'bg-yellow-500' : 'bg-blue-500'}`} style={{ width: `${task.progress}%` }}></div></div><span className="text-xs font-bold text-slate-600">{task.progress}%</span></div>
                        <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 justify-end"><History className="w-3 h-3" /><span>Update: {latestUpdate}</span></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </aside>
            <main className={`flex-1 bg-slate-50 flex-col h-full overflow-hidden ${showMobileDetail ? 'flex' : 'hidden md:flex'}`}>
              {activeTask ? (
                <div className="flex-1 overflow-y-auto p-4 md:p-8">
                  <div className="md:hidden mb-4"><button onClick={() => setShowMobileDetail(false)} className="flex items-center gap-2 text-slate-600 font-medium hover:text-blue-600 transition-colors p-2 -ml-2 rounded-lg active:bg-slate-200"><ArrowLeft className="w-5 h-5" />Kembali ke List</button></div>
                  <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
                          {isSidebarCollapsed && (
                            <button onClick={() => setIsSidebarCollapsed(false)} className="hidden md:flex items-center gap-1 p-1 hover:bg-slate-100 hover:text-blue-600 rounded text-slate-400 transition-colors mr-1" title="Tampilkan Sidebar">
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          )}
                          <Briefcase className="w-4 h-4" /><span>Task Detail</span>
                        </div>
                        <div className="flex items-start justify-between">
                          <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2 pr-4">{activeTask.title}</h2>
                          {isActiveTaskOwnerPic && (
                            <div className={`items-center gap-2 mb-2 flex-shrink-0 ${isMainTaskDetailExpanded ? 'flex' : 'hidden md:flex'}`}>
                              <button onClick={() => openEventModal({ linkedTaskId: activeTask.id, title: activeTask.title })} className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded transition-colors" title="Jadwalkan Event Terkait">
                                <CalendarDays className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleEditMainTask(activeTask)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit Main Task">
                                <PenSquare className="w-4 h-4" />
                              </button>
                              <button onClick={() => handleDeleteMainTask(activeTask.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Main Task">
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className={isMainTaskDetailExpanded ? 'block mt-2' : 'hidden md:block mt-2'}>
                          <p className="text-slate-600 mb-4 text-sm md:text-base">{activeTask.description}</p>
                        <div className="flex flex-col md:flex-row gap-2 md:gap-4 text-sm">
                          <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-start gap-2">
                            <UserAvatar name={activeTask.pic} photoURL={userByName.get(activeTask.pic)?.photoURL} className="w-5 h-5 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">PIC:</span>
                              <span className="font-semibold text-slate-900">{activeTask.pic}</span>
                            </div>
                          </div>
                          <div className="bg-slate-100 px-3 py-2 rounded-lg flex items-start gap-2">
                            <Calendar className="w-4 h-4 text-slate-500 mt-0.5" />
                            <div className="flex flex-col">
                              <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">Deadline:</span>
                              <span className="font-semibold text-slate-900">{formatDateIndo(activeTask.deadline)}</span>
                            </div>
                          </div>
                          {(() => {
                            const relatedEvent = eventByLinkedTaskId.get(activeTask.id) || eventByTitle.get(activeTask.title);
                            if (!relatedEvent) return null;
                            return (
                              <div
                                onClick={() => {
                                  openCoeCalendarForEvent(relatedEvent, activeTask.deadline);
                                }}
                                className="bg-blue-50 border border-blue-200 px-3 py-2 rounded-lg flex gap-2 text-blue-800 items-start cursor-pointer hover:bg-blue-100 transition-all"
                                title="Lihat di Calendar Of Event"
                              >
                                <CalendarDays className="w-4 h-4 text-blue-600 mt-0.5" />
                                <div className="flex flex-col">
                                  <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-blue-600">Event:</span>
                                  <span className="font-semibold text-sm">{activeTask.title}</span>
                                  <span className="text-xs text-blue-600 font-medium">{(() => {
                                    let dateDisplay = formatDateIndo(activeTask.deadline);
                                    const formatDmy = (dateStr) => {
                                      if (!dateStr) return "";
                                      const [y, m, d] = dateStr.split('-');
                                      return `${d}/${m}/${y}`;
                                    };
                                    if (relatedEvent) {
                                      dateDisplay = `${formatDmy(relatedEvent.startDate)}${relatedEvent.endDate && relatedEvent.endDate !== relatedEvent.startDate ? ` - ${formatDmy(relatedEvent.endDate)}` : ''}`;
                                    }
                                    return dateDisplay;
                                  })()}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center"><svg className="w-full h-full transform -rotate-90"><circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" /><circle cx="50%" cy="50%" r="40%" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={213.6} strokeDashoffset={213.6 - (213.6 * activeTask.progress) / 100} strokeLinecap="round" className={`transition-all duration-700 ease-out ${activeTask.progress === 100 ? 'text-green-500' : 'text-blue-600'}`} /></svg><span className="absolute text-base md:text-lg font-bold text-slate-700">{activeTask.progress}%</span></div><span className="text-xs text-slate-400 mt-1">Progress</span>
                      </div>
                    </div>
                    <div className="md:hidden flex justify-end mt-4 pt-4 border-t border-slate-100">
                      <button 
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg text-xs" 
                        onClick={() => setIsMainTaskDetailExpanded(!isMainTaskDetailExpanded)}
                      >
                        <span className="font-bold uppercase">{isMainTaskDetailExpanded ? 'Sembunyikan' : 'Selengkapnya'}</span> 
                        {isMainTaskDetailExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-center gap-3"><h3 className="text-lg font-bold text-slate-800 flex items-center gap-2"><span className="bg-blue-100 text-blue-700 w-6 h-6 rounded flex items-center justify-center text-xs">{activeTask.subtasks.length}</span>Subtasks</h3>{canManageActiveTaskSubtasks && <button onClick={openAddSubtaskModal} className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded-md text-xs font-semibold transition-colors"><Plus className="w-3 h-3" /> Tambah</button>}</div>
                    <div className="flex items-center gap-1 bg-slate-200 p-1 rounded-lg self-start md:self-auto"><button onClick={() => setViewMode('list')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'list' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-3.5 h-3.5" /> List</button><button onClick={() => setViewMode('gantt')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'gantt' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><BarChart2 className="w-3.5 h-3.5" /> Gantt</button><button onClick={() => setViewMode('log')} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${viewMode === 'log' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><History className="w-3.5 h-3.5" /> Log</button></div>
                  </div>
                  {viewMode === 'list' ? (
                    <div className="space-y-3 pb-8">
                      {activeTask.subtasks.length === 0 ? <div className="text-center py-8 bg-white border border-dashed border-slate-300 rounded-xl text-slate-400"><p className="text-sm">Belum ada subtask.</p></div> : (
                        [...activeTask.subtasks].sort((a, b) => {
                          const statusOrder = { 'revision': 1, 'waiting_review': 2, 'pending': 3, 'completed': 4 };
                          return (statusOrder[a.status] || 99) - (statusOrder[b.status] || 99);
                        }).map((subtask) => {
                          const isExpanded = expandedSubtasks[subtask.id] ?? false;
                          const evidenceEntries = getNormalizedEvidenceEntries(subtask);
                          const commentEntries = Array.isArray(subtask.comments) ? subtask.comments : [];
                          const hasSubtaskHistory = evidenceEntries.length > 0 || commentEntries.length > 0;
                          const approvedEvidenceKeySet = new Set(getApprovedEvidenceKeys(subtask));
                          return (
                            <div key={subtask.id} className={`bg-white rounded-xl border transition-all hover:shadow-sm group ${subtask.status === 'completed' ? 'border-green-200 bg-green-50/30' : subtask.status === 'revision' ? 'border-red-200 bg-red-50/30' : subtask.status === 'waiting_review' ? 'border-yellow-200 bg-yellow-50/30' : 'border-slate-200'}`}>
                              {/* Header - Clickable to Expand/Collapse */}
                              <div
                                onClick={() => toggleSubtask(subtask.id)}
                                className="p-4 flex items-center justify-between cursor-pointer select-none"
                              >
                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                  <div className="flex-shrink-0">
                                    {subtask.status === 'completed' && <CheckCircle className="w-5 h-5 text-green-500" />}
                                    {subtask.status === 'waiting_review' && <Clock className="w-5 h-5 text-yellow-500 animate-pulse" />}
                                    {subtask.status === 'revision' && <AlertTriangle className="w-5 h-5 text-red-500" />}
                                    {subtask.status === 'pending' && <Circle className="w-5 h-5 text-slate-300" />}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-semibold text-base break-words ${subtask.status === 'completed' ? 'text-slate-500' : 'text-slate-800'}`}>
                                      {subtask.title}
                                      {!isExpanded && <span className="font-normal text-slate-500 text-sm ml-1">- {subtask.assignee}</span>}
                                    </h4>
                                    {subtask.description && (
                                      <p className="mt-1 text-sm text-slate-500 whitespace-pre-wrap break-words font-normal leading-relaxed">
                                        {subtask.description}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                <div className="ml-2 text-slate-400">
                                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                </div>
                              </div>

                              {/* Body - Collapsible Details */}
                              {isExpanded && (
                                <div className="px-4 pb-4 md:px-5 md:pb-5 border-t border-slate-100/50 pt-3 md:pt-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                                    <div className="flex-1 w-full min-w-0">
                                      <div className="flex flex-wrap items-center gap-2 mb-3">
                                        <div className="flex items-center gap-1.5 bg-slate-100 px-2 py-0.5 rounded">
                                          <UserAvatar name={subtask.assignee} photoURL={userByName.get(subtask.assignee)?.photoURL} className="w-4 h-4" />
                                          <span className="text-xs text-slate-600">{subtask.assignee}</span>
                                        </div>
                                        {subtask.deadline && (
                                          <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {formatDateIndo(subtask.deadline)}
                                          </span>
                                        )}
                                      </div>

                                        {hasSubtaskHistory && (
                                          <div className={`mt-3 border rounded-lg p-3 flex gap-3 shadow-sm text-sm ${subtask.status === 'revision' ? 'bg-red-50 border-red-200' : 'bg-white border-slate-200'}`}>
                                            <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${subtask.status === 'revision' ? 'text-red-500' : 'text-slate-500'}`} />
                                            <div className="min-w-0 flex-1">
                                              {evidenceEntries.length > 0 && (
                                                <>
                                                  <p className="font-semibold text-slate-700 mb-1">Bukti / Lampiran:</p>
                                                  <div className="space-y-1.5 mb-2">
                                                    {evidenceEntries.map((entry, idx) => {
                                                      const isApproved = approvedEvidenceKeySet.has(entry.key);
                                                      return (
                                                        <div key={entry.key} className={`flex items-start gap-2 rounded-md border px-2 py-1.5 ${isApproved ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'}`}>
                                                          {entry.isLink ? <ExternalLink className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" /> : <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />}
                                                          <a href={entry.url || '#'} target={entry.url ? '_blank' : undefined} rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block w-full">
                                                            {idx + 1}. {entry.label}
                                                          </a>
                                                          {isApproved && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />}
                                                        </div>
                                                      );
                                                    })}
                                                  </div>
                                                </>
                                              )}
                                            {commentEntries.length > 0 && (
                                              <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-2">
                                                {commentEntries.map((comment, idx) => (
                                                  <div key={idx} className="flex items-start gap-2">
                                                    <UserAvatar name={comment.user} photoURL={userByName.get(comment.user)?.photoURL} className="w-5 h-5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                      <div className="flex justify-between items-baseline">
                                                        <span className="text-xs font-bold text-slate-700">{comment.user}</span>
                                                        <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                                      </div>
                                                      <p className={`text-xs ${comment.type === 'revision' ? 'text-red-600' : 'text-slate-600'}`}>{comment.text}</p>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      )}


                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex flex-col items-end gap-2 w-full md:w-auto md:min-w-[140px] mt-2 md:mt-0">
                                      {(subtask.status === 'pending' || subtask.status === 'revision') && (userRole === 'Assignee' || userRole === 'PIC') && subtask.assignee === currentUser.name && (
                                        <button onClick={() => openEvidenceModal(activeTask, subtask)} className={`flex items-center justify-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg shadow-sm transition-colors w-full ${subtask.status === 'revision' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                          <Upload className="w-4 h-4" /> {subtask.status === 'revision' ? 'Perbaiki' : 'Lapor'}
                                        </button>
                                      )}
                                      {subtask.status === 'waiting_review' && userRole === 'PIC' && (
                                        <div className="flex gap-2 w-full">
                                          {activeTask.pic === currentUser.name ? (
                                            <>
                                              <button onClick={() => handleOpenUserTaskDetail({ ...subtask, parentId: activeTask.id, parentTitle: activeTask.title, parentPic: activeTask.pic })} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded shadow-sm">
                                                <Check className="w-3 h-3" /> Review
                                              </button>
                                              <button onClick={() => openReviseModal(activeTask, subtask)} className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded shadow-sm">
                                                <AlertCircle className="w-3 h-3" /> Revise
                                              </button>
                                            </>
                                          ) : (
                                            <div className="px-3 py-1.5 bg-slate-100 text-slate-500 rounded-full text-xs font-bold border border-slate-200 text-center w-full">Menunggu PIC Main Task</div>
                                          )}
                                        </div>
                                      )}
                                      {subtask.status === 'waiting_review' && userRole === 'Assignee' && <div className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-bold border border-yellow-200 text-center w-full">Reviewing</div>}
                                      {subtask.status === 'waiting_review' && userRole === 'PIC' && <div className="text-xs text-slate-400 text-center w-full mb-1">Butuh Approval</div>}
                                      {subtask.status === 'revision' && userRole === 'PIC' && <div className="px-3 py-1.5 bg-red-100 text-red-700 rounded-full text-xs font-bold border border-red-200 text-center w-full">Revisi Assignee</div>}
                                      {subtask.status === 'completed' && <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-xs font-bold border border-green-200 text-center w-full">Verified</div>}

                                      {canManageActiveTaskSubtasks && (
                                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 w-full justify-end">
                                          <button onClick={(e) => { e.stopPropagation(); openEditSubtaskModal(subtask); }} className="text-slate-400 hover:text-blue-600 p-1 hover:bg-blue-50 rounded">
                                            <Edit2 className="w-4 h-4" />
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); deleteSubtask(subtask.id); }} className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded">
                                            <Trash2 className="w-4 h-4" />
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  ) : viewMode === 'gantt' ? (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-5 overflow-hidden relative">
                      {ganttData ? (
                        <div className="space-y-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => setShowGanttFilters((prev) => !prev)}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                              >
                                <Settings className="w-3.5 h-3.5" />
                                Filter
                                {showGanttFilters ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </div>

                            {showGanttFilters && (
                              <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
                                <div className="flex flex-wrap items-center gap-2">
                                  {[
                                    { id: '2w', label: '2 Minggu' },
                                    { id: '1m', label: '1 Bulan' },
                                    { id: '3m', label: '3 Bulan' },
                                    { id: 'fit', label: 'Fit' },
                                  ].map((preset) => (
                                    <button
                                      key={preset.id}
                                      type="button"
                                      onClick={() => applyGanttPreset(preset.id)}
                                      className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${ganttRangePreset === preset.id ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}
                                    >
                                      {preset.label}
                                    </button>
                                  ))}
                                  <select
                                    value={ganttZoomLevel}
                                    onChange={(e) => setGanttZoomLevel(e.target.value)}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 outline-none transition focus:border-blue-300"
                                  >
                                    <option value="day">Hari</option>
                                    <option value="week">Minggu</option>
                                  </select>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const today = new Date();
                                      today.setHours(0, 0, 0, 0);
                                      const nextStart = ganttZoomLevel === 'week' ? addDays(today, -14) : addDays(today, -7);
                                      const nextEnd = ganttZoomLevel === 'week' ? addDays(today, 35) : addDays(today, 7);
                                      setGanttRangePreset('custom');
                                      setGanttRangeStart(toDateInputValue(nextStart));
                                      setGanttRangeEnd(toDateInputValue(nextEnd));
                                    }}
                                    className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-800"
                                  >
                                    Today
                                  </button>
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600">
                                    <input
                                      type="checkbox"
                                      className="h-4 w-4 rounded border-slate-300 text-blue-600"
                                      checked={ganttShowCompleted}
                                      onChange={(e) => setGanttShowCompleted(e.target.checked)}
                                    />
                                    Show Completed
                                  </label>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-500">
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                    <span>From</span>
                                    <input
                                      type="date"
                                      value={ganttRangeStart}
                                      onChange={(e) => {
                                        setGanttRangePreset('custom');
                                        setGanttRangeStart(e.target.value);
                                      }}
                                      className="bg-transparent text-slate-600 outline-none"
                                    />
                                  </label>
                                  <label className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                                    <span>To</span>
                                    <input
                                      type="date"
                                      value={ganttRangeEnd}
                                      onChange={(e) => {
                                        setGanttRangePreset('custom');
                                        setGanttRangeEnd(e.target.value);
                                      }}
                                      className="bg-transparent text-slate-600 outline-none"
                                    />
                                  </label>
                                </div>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                            <span>{ganttData.subtasks.length} subtask terlihat</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'completed').length} completed</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'waiting_review').length} review</span>
                            <span>{ganttData.subtasks.filter((sub) => sub.status === 'revision').length} revise</span>
                          </div>

                          <div className="overflow-x-auto relative">
                            <div className="min-w-[920px] relative">
                              <div className="sticky top-0 z-20 bg-white">
                                <div className="flex border-b border-slate-200">
                                  <div className="w-56 flex-shrink-0 border-r border-slate-200 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                                    Subtask
                                  </div>
                                  <div className="flex-1">
                                    <div className="grid" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment, index) => {
                                        const monthLabel = segment.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                                        const prevMonthLabel = index > 0 ? ganttData.segments[index - 1].toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }) : null;
                                        return (
                                          <div key={`month-${segment.toISOString()}`} className={`border-l border-slate-100 px-2 py-2 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 ${monthLabel !== prevMonthLabel ? 'bg-slate-50/70' : 'bg-white'}`}>
                                            {monthLabel !== prevMonthLabel ? monthLabel : ''}
                                          </div>
                                        );
                                      })}
                                    </div>
                                    <div className="grid border-t border-slate-100" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment) => {
                                        const isWeekend = ganttData.zoomLevel === 'day' && [0, 6].includes(segment.getDay());
                                        return (
                                          <div key={segment.toISOString()} className={`border-l border-slate-100 px-2 py-2 text-center text-[10px] font-medium text-slate-500 ${isWeekend ? 'bg-red-50/40' : 'bg-white'}`}>
                                            {formatTimelineLabel(segment, ganttData.zoomLevel)}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="relative">
                                {(ganttData.todayPlacement || ganttData.mainTaskDeadlinePlacement) && (
                                  <div className="pointer-events-none absolute bottom-0 top-0 left-56 right-0 z-10">
                                    <div className="grid h-full" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                      {ganttData.segments.map((segment, index) => (
                                        <div key={`marker-${segment.toISOString()}`} className="relative h-full">
                                          {ganttData.todayPlacement && ganttData.todayPlacement.segmentIndex === index && (
                                            <div
                                              className="absolute bottom-0 top-0 w-0.5 bg-blue-500/90"
                                              style={{ left: `calc(${ganttData.todayPlacement.offsetPercent}% - 1px)` }}
                                            />
                                          )}
                                          {ganttData.mainTaskDeadlinePlacement && ganttData.mainTaskDeadlinePlacement.segmentIndex === index && (
                                            <div
                                              className="absolute bottom-0 top-0 w-0.5 bg-red-500/90"
                                              style={{ left: `calc(${ganttData.mainTaskDeadlinePlacement.offsetPercent}% - 1px)` }}
                                            />
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}

                                <div className="divide-y divide-slate-100 border-b border-slate-200">
                                  {ganttData.subtasks.map((sub) => {
                                    const subStartDate = parseDateValue(sub.startDate) || addDays(sub.deadlineDate, -3);
                                    const clampedStartDate = subStartDate < ganttData.start ? ganttData.start : subStartDate;
                                    const clampedEndDate = sub.deadlineDate > ganttData.end ? ganttData.end : sub.deadlineDate;
                                    const startPercent = getTimelinePercent(clampedStartDate, ganttData.start, ganttData.segments, ganttData.zoomLevel, 'start');
                                    const endPercent = getTimelinePercent(clampedEndDate, ganttData.start, ganttData.segments, ganttData.zoomLevel, 'end');
                                    const widthPercent = Math.max(endPercent - startPercent, ganttData.zoomLevel === 'week' ? 7 : 3.2);
                                    let barColor = 'bg-blue-500';
                                    if (sub.status === 'completed') barColor = 'bg-green-500';
                                    if (sub.status === 'revision') barColor = 'bg-red-500';
                                    if (sub.status === 'waiting_review') barColor = 'bg-amber-500';

                                    return (
                                      <div key={sub.id} className="flex min-h-[54px] bg-white transition-colors hover:bg-slate-50/70">
                                        <div className="w-56 flex-shrink-0 border-r border-slate-200 px-4 py-3">
                                          <p
                                            className="truncate text-sm font-medium text-slate-700"
                                            title={sub.title}
                                            onMouseEnter={(event) => handleGanttTooltipMove(event, sub)}
                                            onMouseMove={(event) => handleGanttTooltipMove(event, sub)}
                                            onMouseLeave={() => setGanttTooltip(null)}
                                          >
                                            {sub.title}
                                          </p>
                                        </div>
                                        <div className="relative flex-1">
                                          <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${ganttData.segments.length}, minmax(${ganttData.zoomLevel === 'week' ? '88px' : '42px'}, 1fr))` }}>
                                            {ganttData.segments.map((segment) => {
                                              const isWeekend = ganttData.zoomLevel === 'day' && [0, 6].includes(segment.getDay());
                                              return <div key={`grid-${sub.id}-${segment.toISOString()}`} className={`border-l border-slate-100 ${isWeekend ? 'bg-red-50/30' : 'bg-transparent'}`} />;
                                            })}
                                          </div>
                                          <div className="absolute inset-y-0 left-0 right-0">
                                            <button
                                              type="button"
                                              className={`absolute top-1/2 h-5 -translate-y-1/2 rounded-full ${barColor} shadow-sm transition hover:opacity-90`}
                                              style={{ left: `${startPercent}%`, width: `${widthPercent}%` }}
                                              onClick={() => handleOpenUserTaskDetail({ ...sub, parentId: activeTask.id, parentTitle: activeTask.title })}
                                              onMouseEnter={(event) => handleGanttTooltipMove(event, sub)}
                                              onMouseMove={(event) => handleGanttTooltipMove(event, sub)}
                                              onMouseLeave={() => setGanttTooltip(null)}
                                              aria-label={sub.title}
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="mt-4 flex flex-wrap items-center justify-end gap-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-500">
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-green-500" /> Completed</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-amber-500" /> Review</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-red-500" /> Revise</span>
                                <span className="flex items-center gap-2"><span className="h-3 w-3 rounded-full bg-blue-500" /> Ready</span>
                                <span className="flex items-center gap-2"><span className="h-4 w-px bg-blue-400" /> Today</span>
                                <span className="flex items-center gap-2"><span className="h-4 w-px bg-red-400" /> Main deadline</span>
                              </div>
                            </div>
                          </div>

                          {ganttTooltip && (
                            <div
                              className="pointer-events-none fixed z-50 w-64 rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                              style={{
                                left: `${Math.min(ganttTooltip.x, window.innerWidth - 280)}px`,
                                top: `${Math.min(ganttTooltip.y, window.innerHeight - 140)}px`,
                              }}
                            >
                              <p className="text-sm font-semibold text-slate-900">{ganttTooltip.subtask.title}</p>
                              <div className="mt-2 space-y-1.5 text-xs text-slate-500">
                                <p><span className="font-semibold text-slate-700">Assignee:</span> {ganttTooltip.subtask.assignee}</p>
                                <p><span className="font-semibold text-slate-700">Status:</span> {getGanttStatusLabel(ganttTooltip.subtask.status)}</p>
                                <p><span className="font-semibold text-slate-700">Deadline:</span> {formatDateIndo(ganttTooltip.subtask.deadline)}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-slate-400 text-sm"><BarChart2 className="w-8 h-8 mx-auto mb-2 opacity-20" />Tidak ada data deadline untuk ditampilkan di Gantt Chart.</div>
                      )}
                    </div>
                  ) : (
                    <div className="bg-white rounded-xl border border-slate-200 p-4 md:p-6 pb-8">
                      {activeTaskActivityLog.length === 0 ? (
                        <div className="text-center py-10 text-slate-400">
                          <History className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-sm">Belum ada aktivitas tercatat untuk project ini.</p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {activeTaskActivityLog.map((group) => (
                            <div key={group.key}>
                              {/* Header tanggal per grup */}
                              <div className="flex items-center gap-2 mb-3">
                                <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-600 text-[11px] md:text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                                  <Calendar className="w-3 h-3" /> {group.label}
                                </span>
                                <div className="flex-1 h-px bg-slate-100" />
                              </div>
                              {/* Timeline: garis vertikal di kiri, entri di kanan */}
                              <div className="relative pl-9 md:pl-10 space-y-4">
                                <div className="absolute left-4 md:left-[18px] top-1 bottom-1 w-px bg-slate-200" aria-hidden="true" />
                                {group.entries.map((entry) => {
                                  const meta = ACTIVITY_LOG_ACTION_META[entry.action] || ACTIVITY_LOG_ACTION_META.default;
                                  const ActionIcon = meta.icon;
                                  const actorUser = userByName.get(entry.actorName);
                                  return (
                                    <div key={entry.id} className="relative">
                                      {/* Node ikon menempel di garis */}
                                      <div className={`absolute -left-9 md:-left-10 top-0 w-8 h-8 md:w-9 md:h-9 rounded-full flex items-center justify-center border-2 border-white shadow-sm ${meta.iconBg}`}>
                                        <ActionIcon className={`w-3.5 h-3.5 md:w-4 md:h-4 ${meta.iconColor}`} />
                                      </div>
                                      {/* Kartu log */}
                                      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 md:p-4">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex items-start gap-2 min-w-0">
                                            <UserAvatar name={entry.actorName} photoURL={actorUser?.photoURL} className="w-5 h-5 md:w-6 md:h-6 mt-0.5" />
                                            <p className="text-xs md:text-sm text-slate-600 leading-snug min-w-0 break-words">
                                              <span className="font-semibold text-slate-800">{entry.actorName}</span>{' '}{meta.sentence}
                                              {entry.subtaskTitle && <> <span className="font-semibold text-slate-800">"{entry.subtaskTitle}"</span></>}
                                            </p>
                                          </div>
                                          <span className="flex items-center gap-1 text-[10px] md:text-[11px] text-slate-400 flex-shrink-0 whitespace-nowrap"><Clock className="w-3 h-3" />{formatLogTimeLabel(entry.createdAt)}</span>
                                        </div>
                                        {entry.message && (
                                          <p className="mt-1.5 text-xs md:text-sm text-slate-500 whitespace-pre-wrap break-words italic">"{entry.message}"</p>
                                        )}
                                        {entry.documents.length > 0 && (
                                          <div className="mt-2 flex flex-wrap gap-1.5">
                                            {entry.documents.map((doc, docIndex) => {
                                              const chipClass = "inline-flex items-center gap-1 bg-white border border-slate-200 text-slate-600 text-[11px] md:text-xs px-2 py-1 rounded-md max-w-full md:max-w-[240px]";
                                              const docIcon = doc.isLink ? <ExternalLink className="w-3 h-3 flex-shrink-0 text-blue-500" /> : <FileText className="w-3 h-3 flex-shrink-0 text-indigo-500" />;
                                              return doc.url ? (
                                                <a key={`${entry.id}-doc-${docIndex}`} href={doc.url} target="_blank" rel="noopener noreferrer" className={`${chipClass} hover:border-blue-300 hover:text-blue-600 transition-colors`}>
                                                  {docIcon}<span className="truncate">{doc.name || doc.url}</span>
                                                </a>
                                              ) : (
                                                <span key={`${entry.id}-doc-${docIndex}`} className={chipClass}>{docIcon}<span className="truncate">{doc.name}</span></span>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative flex-1 flex flex-col items-center justify-center text-slate-400 p-8">
                  {isSidebarCollapsed && (
                    <button onClick={() => setIsSidebarCollapsed(false)} className="absolute top-4 left-4 hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-blue-600 text-xs font-semibold rounded-lg shadow-sm transition-all" title="Tampilkan Sidebar">
                      <ChevronRight className="w-4 h-4" /> Tampilkan List Project
                    </button>
                  )}
                  <Briefcase className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-lg font-medium">Pilih project untuk melihat detail</p>
                </div>
              )}
            </main>
          </>
  );
}
