// Detail satu Update: header + timeline LOG (entries) + form "Tambah update".
// Semua user yang login boleh menambah progres, mengedit, dan menghapus.
import { X, Edit2, Trash2, Send, History } from 'lucide-react';
import { UPDATE_STATUS_ORDER, UPDATE_STATUS_META } from '../../lib/constants.js';
import { getUpdateCategoryMeta, getUpdateStatusMeta } from '../../lib/updateUtils.js';

export default function UpdateDetailModal({
  selectedUpdate,
  currentUser,
  updateEntryText,
  setUpdateEntryText,
  updateEntryStatus,
  setUpdateEntryStatus,
  handleAddUpdateEntry,
  openUpdateModal,
  handleDeleteUpdate,
  setShowUpdateDetailModal,
  UserAvatar,
}) {
  if (!selectedUpdate) return null;

  const catMeta = getUpdateCategoryMeta(selectedUpdate.category);
  const statusMeta = getUpdateStatusMeta(selectedUpdate.status);
  const CatIcon = catMeta.icon;
  // Entri terbaru di atas (server meng-append ke akhir array).
  const entries = Array.isArray(selectedUpdate.entries) ? [...selectedUpdate.entries].reverse() : [];
  const canSubmit = updateEntryText.trim() !== "";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 p-4 border-b flex justify-between items-start gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${catMeta.badgeClass}`}>
                <CatIcon className="w-3 h-3" /> {catMeta.label}
              </span>
              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusMeta.badge}`}>{statusMeta.label}</span>
            </div>
            <h3 className="font-bold text-slate-800 text-lg break-words">{selectedUpdate.title}</h3>
            {selectedUpdate.description && <p className="text-sm text-slate-500 mt-1 break-words">{selectedUpdate.description}</p>}
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => openUpdateModal(selectedUpdate)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded" title="Edit update"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => handleDeleteUpdate(selectedUpdate.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded" title="Hapus update"><Trash2 className="w-4 h-4" /></button>
            <button onClick={() => setShowUpdateDetailModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
          </div>
        </div>

        {/* Timeline LOG */}
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wide mb-4">
            <History className="w-4 h-4" /> Log Progres
          </div>
          {entries.length === 0 ? (
            <div className="text-center text-sm text-slate-400 py-8">Belum ada progres. Tambahkan update pertama di bawah.</div>
          ) : (
            <div className="space-y-4">
              {entries.map((entry, idx) => {
                const entryStatusMeta = getUpdateStatusMeta(entry.status);
                return (
                  <div key={idx} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className={`w-2.5 h-2.5 rounded-full mt-1.5 flex-shrink-0 ${entryStatusMeta.dot}`}></span>
                      {idx < entries.length - 1 && <span className="w-px flex-1 bg-slate-200 my-1"></span>}
                    </div>
                    <div className="flex-1 pb-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {UserAvatar ? <UserAvatar name={entry.user} className="w-4 h-4" /> : null}
                        <span className="text-sm font-semibold text-slate-700">{entry.user || 'Unknown'}</span>
                        {entry.status && <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${entryStatusMeta.badge}`}>{entryStatusMeta.label}</span>}
                        <span className="text-xs text-slate-400">{entry.timestamp}</span>
                      </div>
                      <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap break-words">{entry.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Form tambah update */}
        <div className="border-t bg-slate-50 p-4 space-y-3">
          <textarea
            rows={2}
            className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
            value={updateEntryText}
            onChange={(e) => setUpdateEntryText(e.target.value)}
            placeholder="Tulis progres terbaru… (mis. sudah kirim dokumen ke vendor)"
          />
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <select
                className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={updateEntryStatus}
                onChange={(e) => setUpdateEntryStatus(e.target.value)}
              >
                {UPDATE_STATUS_ORDER.map((s) => (<option key={s} value={s}>Status: {UPDATE_STATUS_META[s].label}</option>))}
              </select>
            </div>
            <button
              onClick={handleAddUpdateEntry}
              disabled={!canSubmit}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <Send className="w-4 h-4" /> Tambah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
