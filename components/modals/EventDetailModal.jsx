// Modal detail event: info, peserta, task tertaut, dan aksi edit/hapus.
import { Briefcase, Calendar, Edit2, MapPin, Trash2, Users, X } from 'lucide-react';
import UserAvatar from '../UserAvatar.jsx';
import { formatDateIndo } from '../../lib/dateUtils.js';
import { getEventTypeMeta } from '../../lib/taskUtils.js';

export default function EventDetailModal({ handleDeleteEvent, navigateTo, openEventModal, selectedEventDetail, setSelectedTaskId, setShowEventDetailModal, tasks, userByName }) {
  return (
          (() => {
            const eventTypeMeta = getEventTypeMeta(selectedEventDetail.eventType);
            const linkedTask = tasks.find((task) => {
              if (selectedEventDetail.linkedTaskId && String(task.id) === String(selectedEventDetail.linkedTaskId)) {
                return true;
              }
              return selectedEventDetail.eventType === 'internal' && task.title === selectedEventDetail.title;
            }) || null;
            return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col relative">
              <div className={`${eventTypeMeta.accentClass} p-5 text-white flex justify-between items-start`}>
                <div>
                  <div className="mb-2">
                    <span className="inline-flex rounded-full border border-white/30 bg-white/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em]">
                      {eventTypeMeta.label} Event
                    </span>
                  </div>
                  <h3 className="text-xl font-bold leading-tight mb-1">{selectedEventDetail.title}</h3>
                  <div className="flex items-center gap-2 text-white/90 text-sm opacity-90">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDateIndo(selectedEventDetail.startDate)} {selectedEventDetail.endDate && selectedEventDetail.endDate !== selectedEventDetail.startDate ? ` - ${formatDateIndo(selectedEventDetail.endDate)}` : ''}</span>
                  </div>
                </div>
                <button onClick={() => setShowEventDetailModal(false)} className="text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>

              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><MapPin className="w-5 h-5" /></div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Location</p>
                      <p className="text-sm font-medium text-slate-800">{selectedEventDetail.location || "TBD"}</p>
                    </div>
                  </div>

                  {selectedEventDetail.eventType === 'internal' && linkedTask && (
                    <div className="flex items-start gap-3">
                      <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Briefcase className="w-5 h-5" /></div>
                      <div className="w-full">
                        <p className="text-xs font-semibold text-slate-500 uppercase mb-0.5">Main Task</p>
                        <button
                          type="button"
                          onClick={() => {
                            setShowEventDetailModal(false);
                            setSelectedTaskId(linkedTask.id);
                            navigateTo('jobtask');
                          }}
                          className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          {linkedTask.title}
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3">
                    <div className="bg-slate-100 p-2 rounded-lg text-slate-500"><Users className="w-5 h-5" /></div>
                    <div className="w-full">
                      <p className="text-xs font-semibold text-slate-500 uppercase mb-1.5">Participants</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedEventDetail.participants && Array.isArray(selectedEventDetail.participants) && selectedEventDetail.participants.length > 0 ? (
                          selectedEventDetail.participants.map(p => (
                            <div key={p} className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-xs font-medium text-slate-700 flex items-center gap-1.5">
                              <UserAvatar name={p} photoURL={userByName.get(p)?.photoURL} className="w-4 h-4" />{p}
                            </div>
                          ))
                        ) : (
                          <span className="text-xs italic text-slate-400">Belum ada peserta</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 rounded-b-xl">
                <button
                  onClick={() => {
                    setShowEventDetailModal(false);
                    handleDeleteEvent(selectedEventDetail.id);
                  }}
                  className="px-4 py-2 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
                <button
                  onClick={() => {
                    setShowEventDetailModal(false);
                    openEventModal(selectedEventDetail);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                >
                  <Edit2 className="w-4 h-4" /> Edit Event
                </button>
              </div>
            </div>
          </div>
            );
          })()
  );
}
