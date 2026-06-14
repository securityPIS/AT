// Modal pelaporan/perbaikan pekerjaan: upload file, link, dan catatan evidence.
import { CheckCircle, File, Upload, X } from 'lucide-react';

export default function EvidenceModal({ evidenceFiles, evidenceLink, evidenceText, evidenceUploading, handleEvidenceFileSelection, selectedSubtask, setEvidenceFiles, setEvidenceLink, setEvidenceText, setShowEvidenceModal, submitEvidence }) {
  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between sticky top-0 z-10"><h3 className="font-bold text-slate-800">{selectedSubtask.status === 'revision' ? 'Perbaiki Laporan' : 'Lapor Pekerjaan Selesai'}</h3><button onClick={() => setShowEvidenceModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button></div>
              <div className="p-6 space-y-4 overflow-y-auto">
                
                <label className={`block border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors relative ${evidenceFiles.length > 0 ? 'border-emerald-400 bg-emerald-50' : 'border-slate-300 text-slate-500 hover:bg-blue-50 hover:border-blue-400'}`}>
                  <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files) handleEvidenceFileSelection(e.target.files); }} />
                  {evidenceFiles.length > 0 ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-emerald-500 mb-2" />
                      <span className="text-sm font-medium text-emerald-700">{evidenceFiles.length} File Terpilih</span>
                      <span className="text-xs text-slate-400 mt-1">Klik untuk mengganti</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-blue-500 mb-2" />
                      <span className="text-sm">Klik upload dokumen / file</span>
                      <span className="text-xs text-slate-400 mt-1">Bisa pilih multiple file</span>
                    </>
                  )}
                </label>
                
                {evidenceFiles.length > 0 && (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-32 overflow-y-auto space-y-1">
                        {evidenceFiles.map((f, i) => (
                            <div key={i} className="flex justify-between items-center text-xs bg-white px-2 py-1.5 rounded shadow-sm border border-slate-100">
                                <span className="text-slate-700 truncate min-w-0" title={f.name}>{f.name}</span>
                                <button onClick={() => setEvidenceFiles(evidenceFiles.filter((_, idx)=>idx!==i))} className="text-red-500 hover:text-red-700 ml-2 flex-shrink-0"><X className="w-3.5 h-3.5" /></button>
                            </div>
                        ))}
                    </div>
                )}
                
                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link URL (Opsional)</label>
                   <input type="url" className="w-full border p-2.5 rounded-lg text-sm bg-white" placeholder="Contoh: https://drive.google.com/..." value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} />
                </div>

                <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan</label>
                   <textarea className="w-full border p-3 rounded-lg text-sm bg-white" rows="2" value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)} placeholder="Tulis catatan pendek (opsional)"></textarea>
                </div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t sticky bottom-0">
                <button onClick={() => { setShowEvidenceModal(false); setEvidenceFiles([]); setEvidenceLink(""); setEvidenceText(""); }} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">Batal</button>
                <button onClick={submitEvidence} disabled={evidenceUploading || (evidenceFiles.length === 0 && !evidenceText && !evidenceLink)} className={`px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${evidenceUploading || (evidenceFiles.length === 0 && !evidenceText && !evidenceLink) ? 'bg-slate-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-sm'}`}>
                  {evidenceUploading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : 'Kirim Laporan'}
                </button>
              </div>
            </div>
          </div>
  );
}
