// Modal tambah/edit subtask.
import { X } from 'lucide-react';
import { getDefaultSubtaskStartDate } from '../../lib/taskUtils.js';

export default function SubtaskModal({ activeTask, activeUsers, editingSubtaskId, isSavingSubtask, saveSubtask, setShowSubtaskModal, setSubtaskFormAssignee, setSubtaskFormDeadline, setSubtaskFormDescription, setSubtaskFormStartDate, setSubtaskFormTitle, subtaskFormAssignee, subtaskFormDeadline, subtaskFormDescription, subtaskFormStartDate, subtaskFormTitle }) {
  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between"><h3 className="font-bold">{editingSubtaskId ? 'Edit Subtask' : 'Tambah Subtask'}</h3><button onClick={() => setShowSubtaskModal(false)}><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4">
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormTitle} onChange={(e) => setSubtaskFormTitle(e.target.value)} placeholder="Nama Subtask" />
                <textarea className="w-full border p-2 rounded-lg text-sm" rows="3" value={subtaskFormDescription} onChange={(e) => setSubtaskFormDescription(e.target.value)} placeholder="Deskripsi Subtask (Opsional)"></textarea>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Assignee (Member)</label><select className="w-full border p-2 rounded-lg text-sm bg-white" value={subtaskFormAssignee} onChange={(e) => setSubtaskFormAssignee(e.target.value)}><option value="" disabled>-- Pilih Assignee --</option>{activeUsers.map(user => (<option key={user.id} value={user.name}>{user.name} ({user.role})</option>))}</select></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormStartDate} max={activeTask?.deadline || undefined} onChange={(e) => setSubtaskFormStartDate(e.target.value)} />
                  <p className="mt-1 text-[11px] text-slate-400">Kosongkan untuk default H-3 dari deadline subtask. Tidak boleh melewati deadline main task.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Deadline</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={subtaskFormDeadline} max={activeTask?.deadline || undefined} onChange={(e) => { setSubtaskFormDeadline(e.target.value); if (!subtaskFormStartDate) { setSubtaskFormStartDate(getDefaultSubtaskStartDate(e.target.value)); } }} />
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button onClick={() => setShowSubtaskModal(false)} disabled={isSavingSubtask} className="px-4 py-2 text-sm text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed">Batal</button><button onClick={saveSubtask} disabled={isSavingSubtask} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2">{isSavingSubtask ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : 'Simpan'}</button></div>
            </div>
          </div>
  );
}
