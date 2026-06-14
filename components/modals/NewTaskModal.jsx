// Modal buat/edit project (main task) beserta opsi template subtask dan penautan event.
import { Circle, Copy, X } from 'lucide-react';

export default function NewTaskModal({ activePicUsers, addNewTask, editingMainTaskId, newEventEndDate, newEventLocation, newEventStartDate, newTaskDeadline, newTaskDesc, newTaskIsEvent, newTaskPic, newTaskTitle, selectedTemplateId, setNewEventEndDate, setNewEventLocation, setNewEventStartDate, setNewTaskDeadline, setNewTaskDesc, setNewTaskIsEvent, setNewTaskPic, setNewTaskTitle, setSelectedTemplateId, setShowNewTaskModal, taskTemplates, tasks }) {
  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 p-4 border-b flex justify-between sticky top-0 z-10"><h3 className="font-bold">{editingMainTaskId ? 'Edit Project' : 'Buat Project Baru'}</h3><button onClick={() => setShowNewTaskModal(false)}><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4 overflow-y-auto">
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={newTaskTitle} onChange={(e) => setNewTaskTitle(e.target.value)} placeholder="Nama Project" />
                <textarea className="w-full border p-2 rounded-lg text-sm" value={newTaskDesc} onChange={(e) => setNewTaskDesc(e.target.value)} placeholder="Deskripsi"></textarea>

                {/* Template Subtask Dropdown - only show for new tasks */}
                {!editingMainTaskId && taskTemplates.length > 0 && (
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Template Subtask (Opsional)</label>
                    <select className="w-full border border-slate-300 p-2 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                      <option value="">-- Tanpa Template --</option>
                      {taskTemplates.map(t => (
                        <option key={t.id} value={t.id}>{t.name} ({t.subtasks.length} subtasks)</option>
                      ))}
                    </select>
                    {selectedTemplateId && (() => {
                      const tpl = taskTemplates.find(t => t.id === Number(selectedTemplateId));
                      if (!tpl) return null;
                      return (
                        <div className="mt-2 p-3 bg-blue-50/50 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-bold text-blue-700 mb-2 flex items-center gap-1"><Copy className="w-3 h-3" /> Preview Subtask dari Template:</p>
                          <div className="space-y-1">
                            {tpl.subtasks.map((s, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs text-blue-800">
                                <Circle className="w-2.5 h-2.5 text-blue-400 flex-shrink-0" />
                                <span>{s.title}</span>
                                {s.assignee && <span className="text-blue-500">• {s.assignee}</span>}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div className="flex gap-4">
                  <div className="flex-1 w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">PIC</label>
                    <select
                      className="w-full border p-2 rounded-lg text-sm bg-white"
                      value={newTaskPic}
                      onChange={(e) => setNewTaskPic(e.target.value)}
                    >
                      <option value="">-- Pilih PIC --</option>
                      {newTaskPic && !activePicUsers.some((user) => user.name === newTaskPic) && (
                        <option value={newTaskPic}>{newTaskPic}</option>
                      )}
                      {activePicUsers.map((user) => (
                        <option key={user.id} value={user.name}>{user.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1 w-1/2">
                    <label className="block text-xs font-bold text-slate-500 mb-1">Deadline</label>
                    <input type="date" className="w-full border p-2 rounded-lg text-sm" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} />
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-slate-100 transition-colors">
                    <input type="checkbox" checked={newTaskIsEvent} onChange={(e) => setNewTaskIsEvent(e.target.checked)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                    <span className="text-sm font-semibold text-slate-700">Add to Event</span>
                  </label>

                  {newTaskIsEvent && (
                    <div className="p-3 bg-blue-50/50 rounded-lg mt-2 border border-blue-100 animate-in fade-in slide-in-from-top-2 duration-200 space-y-4">
                      <div className="flex gap-4">
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-blue-800 mb-1">Event Start Date</label>
                          <input type="date" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventStartDate} onChange={(e) => setNewEventStartDate(e.target.value)} />
                        </div>
                        <div className="w-1/2">
                          <label className="block text-xs font-bold text-blue-800 mb-1">Event End Date</label>
                          <input type="date" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventEndDate} onChange={(e) => setNewEventEndDate(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-blue-800 mb-1">Event Location</label>
                        <input type="text" className="w-full border border-blue-200 p-2 rounded-lg text-sm bg-white" value={newEventLocation} onChange={(e) => setNewEventLocation(e.target.value)} placeholder="Masukkan lokasi event" />
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t sticky bottom-0"><button onClick={() => setShowNewTaskModal(false)} className="px-4 py-2 text-sm text-slate-600">Batal</button><button onClick={addNewTask} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg">Simpan</button></div>
            </div>
          </div>
  );
}
