// Modal tambah/edit template task beserta baris-baris subtask.
import { Plus, Trash2, X } from 'lucide-react';

export default function TemplateModal({ activeUsers, addTemplateSubtaskRow, editingTemplate, handleSaveTemplate, removeTemplateSubtaskRow, setShowTemplateModal, setTemplateForm, templateForm, updateTemplateSubtaskRow }) {
  return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold text-slate-800">{editingTemplate ? 'Edit Template' : 'Tambah Template Baru'}</h3>
              <button onClick={() => setShowTemplateModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Nama Template</label>
                <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g. IT Project Template" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase">Subtask Items</label>
                  <button onClick={addTemplateSubtaskRow} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200 rounded text-xs font-semibold transition-colors">
                    <Plus className="w-3 h-3" /> Tambah Row
                  </button>
                </div>
                <div className="space-y-3">
                  {templateForm.subtasks.map((sub, idx) => (
                    <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex-shrink-0 mt-2">
                        <span className="text-xs font-bold text-slate-400 bg-slate-200 w-5 h-5 flex items-center justify-center rounded">{idx + 1}</span>
                      </div>
                      <div className="flex-1 space-y-2">
                        <input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={sub.title} onChange={(e) => updateTemplateSubtaskRow(idx, 'title', e.target.value)} placeholder="Nama Subtask" />
                        <div className="flex gap-2">
                          <select className="flex-1 w-full border border-slate-300 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none" value={sub.assignee} onChange={(e) => updateTemplateSubtaskRow(idx, 'assignee', e.target.value)}>
                            <option value="">-- Assignee (Opsional) --</option>
                            {activeUsers.map(user => (<option key={user.id} value={user.name}>{user.name}</option>))}
                          </select>
                          <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-2 bg-white focus-within:ring-2 focus-within:ring-blue-500">
                            <span className="text-sm text-slate-500 font-semibold whitespace-nowrap">H -</span>
                            <input type="number" min="0" className="w-16 flex-1 text-sm outline-none bg-transparent" placeholder="Hari" value={sub.deadline} onChange={(e) => updateTemplateSubtaskRow(idx, 'deadline', e.target.value)} title="Masukkan angka (H minus hari dari deadline project)" />
                          </div>
                        </div>
                      </div>
                      {templateForm.subtasks.length > 1 && (
                        <button onClick={() => removeTemplateSubtaskRow(idx)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors mt-1"><Trash2 className="w-4 h-4" /></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="bg-slate-50 p-4 border-t sticky bottom-0 flex justify-end gap-2">
              <button onClick={() => setShowTemplateModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Batal</button>
              <button onClick={handleSaveTemplate} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Simpan Template</button>
            </div>
          </div>
        </div>
  );
}
