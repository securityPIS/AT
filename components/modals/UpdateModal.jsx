// Modal buat/edit meta Update (judul, kategori, status, deskripsi).
// LOG progres (entries) TIDAK diatur di sini — lihat UpdateDetailModal.
import { Save, X } from 'lucide-react';
import {
  UPDATE_CATEGORY_ORDER, UPDATE_CATEGORY_META,
  UPDATE_STATUS_ORDER, UPDATE_STATUS_META,
} from '../../lib/constants.js';

export default function UpdateModal({ editingUpdate, updateForm, setUpdateForm, handleSaveUpdate, setShowUpdateModal }) {
  const canSave = updateForm.title.trim() !== "";
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800">{editingUpdate ? 'Edit Update' : 'Update Baru'}</h3>
          <button onClick={() => setShowUpdateModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Judul / Topik</label>
            <input
              type="text"
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={updateForm.title}
              onChange={(e) => setUpdateForm({ ...updateForm, title: e.target.value })}
              placeholder="mis. Koordinasi vendor X"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Kategori</label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={updateForm.category}
                onChange={(e) => setUpdateForm({ ...updateForm, category: e.target.value })}
              >
                {UPDATE_CATEGORY_ORDER.map((c) => (<option key={c} value={c}>{UPDATE_CATEGORY_META[c].label}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Status</label>
              <select
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={updateForm.status}
                onChange={(e) => setUpdateForm({ ...updateForm, status: e.target.value })}
              >
                {UPDATE_STATUS_ORDER.map((s) => (<option key={s} value={s}>{UPDATE_STATUS_META[s].label}</option>))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Deskripsi (opsional)</label>
            <textarea
              rows={3}
              className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
              value={updateForm.description}
              onChange={(e) => setUpdateForm({ ...updateForm, description: e.target.value })}
              placeholder="Konteks singkat topik ini…"
            />
          </div>
        </div>
        <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t">
          <button onClick={() => setShowUpdateModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Batal</button>
          <button
            onClick={handleSaveUpdate}
            disabled={!canSave}
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" /> Simpan
          </button>
        </div>
      </div>
    </div>
  );
}
