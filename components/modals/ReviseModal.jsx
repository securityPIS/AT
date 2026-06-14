// Modal pemberian catatan revisi pada subtask.
import { AlertCircle, X } from 'lucide-react';

export default function ReviseModal({ handleSendRevision, reviseComment, setReviseComment, setShowReviseModal, subtaskToRevise }) {
  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
              <div className="bg-red-50 p-4 border-b border-red-100 flex justify-between items-center"><h3 className="font-bold text-red-800 flex items-center gap-2"><AlertCircle className="w-5 h-5" /> Revisi Pekerjaan</h3><button onClick={() => setShowReviseModal(false)} className="text-red-400 hover:text-red-600"><X className="w-5 h-5" /></button></div>
              <div className="p-6 space-y-4">
                <p className="text-sm text-slate-600">Berikan catatan perbaikan untuk subtask: <br /><span className="font-semibold text-slate-800">{subtaskToRevise.title}</span></p>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Komentar Revisi</label><textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-red-500 focus:outline-none transition-all" rows="4" placeholder="Contoh: Bukti buram, tolong upload ulang dengan resolusi tinggi..." value={reviseComment} onChange={(e) => setReviseComment(e.target.value)}></textarea></div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t border-slate-200"><button onClick={() => setShowReviseModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800 text-sm font-medium rounded-lg hover:bg-slate-100">Cancel</button><button onClick={handleSendRevision} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm">Send</button></div>
            </div>
          </div>
  );
}
