import React from 'react';
import { FileText, Search, Briefcase, ExternalLink, CheckCircle, Clock, AlertTriangle, Circle } from 'lucide-react';

export default function FilePage({ fileSearch, setFileSearch, tasks, getFileMeta, getApprovedEvidenceEntries }) {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><div className="bg-blue-600 p-2 rounded-lg text-white"><FileText className="w-6 h-6" /></div>File Manager</h2>
          <div className="relative w-full md:w-auto"><input type="text" placeholder="Cari file..." value={fileSearch} onChange={(e) => setFileSearch(e.target.value)} className="pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none" /><Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" /></div>
        </div>
        <div className="space-y-8">
          {tasks.map((project) => {
            const files = [];
            project.subtasks.forEach((s) => {
              const approvedEntries = getApprovedEvidenceEntries ? getApprovedEvidenceEntries(s) : [];
              approvedEntries.forEach((entry) => {
                if (entry.label.toLowerCase().includes(fileSearch.toLowerCase()) || s.title.toLowerCase().includes(fileSearch.toLowerCase())) {
                  files.push({ ...s, projectId: project.id, displayEvidence: entry.label, displayUrl: entry.url, isLink: entry.isLink });
                }
              });
            });
            if (files.length === 0) return null;
            return (
              <div key={project.id}>
                <h3 className="text-lg font-bold text-slate-700 mb-3 pl-1 flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-400" />{project.title}</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {files.map((file, idx) => {
                    const isLink = file.isLink;
                    const meta = isLink ? { icon: ExternalLink, color: 'text-blue-500', bg: 'bg-blue-50', label: 'LINK', type: 'link' } : getFileMeta(file.displayEvidence);
                    const Icon = meta.icon;
                    return (
                      <a href={file.displayUrl || '#'} target={file.displayUrl ? '_blank' : undefined} rel="noopener noreferrer" key={`${file.id}-${idx}`} className={`group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col ${file.displayUrl ? 'cursor-pointer' : 'cursor-default'}`} onClick={(e) => { if (!file.displayUrl) e.preventDefault(); }}>
                        <div className={`h-32 flex items-center justify-center relative overflow-hidden ${meta.bg}`}>
                          {meta.type === 'image' ? <img src={file.displayUrl || `https://via.placeholder.com/400x300/e2e8f0/94a3b8?text=${encodeURIComponent(file.displayEvidence)}`} alt={file.displayEvidence} className="w-full h-full object-cover" /> : <Icon className={`w-12 h-12 ${meta.color} group-hover:scale-110 transition-transform`} />}
                          <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase shadow-sm bg-white/90 ${meta.color}`}>{meta.label}</div>
                          {file.displayUrl && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"><span className="bg-white text-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1"><ExternalLink className="w-3 h-3" /> {isLink ? 'Buka Link' : 'Download'}</span></div>}
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div><h4 className="text-sm font-semibold text-slate-700 line-clamp-2 mb-1" title={file.displayEvidence}>{file.displayEvidence}</h4><p className="text-xs text-slate-500 flex items-center gap-1"><span className="truncate">Subtask: {file.title}</span></p></div>
                          <div className="mt-3 flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                            <span>{file.lastUpdated ? file.lastUpdated.split(' ')[0] : '-'}</span>
                            <div title={file.status}>{file.status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}{file.status === 'waiting_review' && <Clock className="w-4 h-4 text-yellow-500" />}{file.status === 'revision' && <AlertTriangle className="w-4 h-4 text-red-500" />}{file.status === 'pending' && <Circle className="w-4 h-4 text-slate-300" />}</div>
                          </div>
                        </div>
                      </a>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {tasks.every((t) => t.subtasks.every((s) => !(getApprovedEvidenceEntries ? getApprovedEvidenceEntries(s).length > 0 : false))) && <div className="text-center py-12 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Belum ada evidence yang disetujui.</p></div>}
        </div>
      </div>
    </main>
  );
}
