// Halaman "Update & Koordinasi" (di area Main Task, dipilih lewat toggle jobtaskTab).
// Menampilkan daftar entri Update non-task; klik kartu -> detail + LOG progres.
import React from 'react';
import { MessageSquarePlus, Plus, Home, Clock, Trash2 } from 'lucide-react';
import { getUpdateCategoryMeta, getUpdateStatusMeta, getLatestUpdateEntry } from '../lib/updateUtils.js';

export default function UpdatesPage({
  jobtaskTab,
  setJobtaskTab,
  updates,
  openUpdateModal,
  openUpdateDetail,
  handleDeleteUpdate,
  UserAvatar,
}) {
  const list = Array.isArray(updates) ? updates : [];

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header + toggle Task / Update */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><MessageSquarePlus className="w-6 h-6" /></div>
            Update &amp; Koordinasi
          </h2>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex bg-slate-200 p-1 rounded-lg w-full md:w-auto">
              <button onClick={() => setJobtaskTab('task')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${jobtaskTab === 'task' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Home className="w-4 h-4" /> Task</button>
              <button onClick={() => setJobtaskTab('updates')} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition-all ${jobtaskTab === 'updates' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><MessageSquarePlus className="w-4 h-4" /> Update &amp; Koordinasi</button>
            </div>
            <button onClick={() => openUpdateModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
              <Plus className="w-4 h-4" /> Update Baru
            </button>
          </div>
        </div>

        {/* Daftar Update */}
        {list.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-400 text-sm">
            Belum ada update. Klik <span className="font-semibold text-slate-500">"Update Baru"</span> untuk mencatat hasil meeting, koordinasi, email, atau WhatsApp.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map((u) => {
              const catMeta = getUpdateCategoryMeta(u.category);
              const statusMeta = getUpdateStatusMeta(u.status);
              const CatIcon = catMeta.icon;
              const latest = getLatestUpdateEntry(u);
              const entryCount = Array.isArray(u.entries) ? u.entries.length : 0;
              return (
                <div
                  key={u.id}
                  onClick={() => openUpdateDetail(u)}
                  className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm relative group hover:shadow-md transition-shadow cursor-pointer"
                  title="Buka detail & log progres"
                >
                  <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteUpdate(u.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${catMeta.badgeClass}`}>
                      <CatIcon className="w-3 h-3" /> {catMeta.label}
                    </span>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide ${statusMeta.badge}`}>{statusMeta.label}</span>
                  </div>
                  <h3 className="font-bold text-slate-800 text-base mb-2 pr-8 break-words">{u.title}</h3>
                  {latest ? (
                    <div className="text-sm text-slate-500 border-t border-slate-100 pt-2 mt-2">
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1">
                        <Clock className="w-3 h-3" /> {latest.timestamp} · {latest.user}
                      </div>
                      <p className="line-clamp-2 break-words">{latest.text}</p>
                    </div>
                  ) : (
                    <p className="text-xs italic text-slate-400 border-t border-slate-100 pt-2 mt-2">Belum ada progres.</p>
                  )}
                  <div className="text-[11px] text-slate-400 mt-2">{entryCount} progres tercatat</div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
