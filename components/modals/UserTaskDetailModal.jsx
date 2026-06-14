// Modal detail subtask dari halaman User Task: riwayat bukti & catatan, form upload evidence, dan aksi approve/revise oleh PIC.
import { AlertCircle, AlertTriangle, Briefcase, Calendar, Check, CheckCircle, Circle, Clock, ExternalLink, File, FileText, Image as ImageIcon, Save, Upload, X } from 'lucide-react';
import UserAvatar from '../UserAvatar.jsx';
import { getApprovedEvidenceKeys, getNormalizedEvidenceEntries } from '../../lib/evidenceUtils.js';

export default function UserTaskDetailModal({ approvalEvidenceSelection, approveSubtask, currentUser, evidenceFiles, evidenceLink, evidenceText, handleEvidenceFileSelection, openReviseModal, selectedSubtask, setActivePage, setApprovalEvidenceSelection, setEvidenceFiles, setEvidenceLink, setEvidenceText, setExpandedSubtasks, setSelectedTaskId, setShowMobileDetail, setShowUserTaskDetailModal, submitEvidence, userByName, userRole }) {
  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
              <div className="bg-white p-5 border-b border-slate-100 flex justify-between items-start sticky top-0 z-10">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 leading-tight mb-1">{selectedSubtask.title}</h3>
                  {selectedSubtask.description && <p className="text-sm text-slate-600 mb-3 whitespace-pre-wrap">{selectedSubtask.description}</p>}
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <button onClick={() => { setSelectedTaskId(selectedSubtask.parentId); setActivePage('jobtask'); setShowMobileDetail(true); setExpandedSubtasks({ [selectedSubtask.id]: true }); setShowUserTaskDetailModal(false); }} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded hover:bg-blue-100 transition-colors flex items-center gap-1 font-medium"><Briefcase className="w-3 h-3" /> Parent Project: {selectedSubtask.parentTitle}</button>
                  </div>
                </div>
                <button onClick={() => setShowUserTaskDetailModal(false)} className="text-slate-400 hover:text-slate-600 p-1 bg-slate-50 rounded-full transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Deadline</p><p className="text-sm font-medium text-slate-800 flex items-center gap-2"><Calendar className="w-4 h-4 text-blue-500" /> {selectedSubtask.deadline || "-"}</p></div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Status</p><div className="text-sm font-medium">{selectedSubtask.status === 'completed' && <span className="text-green-600 flex items-center gap-1"><CheckCircle className="w-4 h-4" /> Completed</span>}{selectedSubtask.status === 'waiting_review' && <span className="text-yellow-600 flex items-center gap-1"><Clock className="w-4 h-4" /> Waiting Review</span>}{selectedSubtask.status === 'revision' && <span className="text-red-600 flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Revision Needed</span>}{selectedSubtask.status === 'pending' && <span className="text-slate-600 flex items-center gap-1"><Circle className="w-4 h-4" /> Pending</span>}</div></div>
                  <div className="col-span-2 bg-slate-50 p-3 rounded-lg border border-slate-100"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Assignee</p><p className="text-sm font-medium text-slate-800 flex items-center gap-2"><UserAvatar name={selectedSubtask.assignee} photoURL={userByName.get(selectedSubtask.assignee)?.photoURL} className="w-5 h-5" />{selectedSubtask.assignee}</p></div>
                </div>
                {(getNormalizedEvidenceEntries(selectedSubtask).length > 0 || (selectedSubtask.comments && selectedSubtask.comments.length > 0)) && (
                  <div className="mb-6">
                    <h4 className="text-sm font-bold text-slate-700 mb-2">Riwayat Bukti & Catatan</h4>
                    <div className={`border rounded-lg p-3 text-sm ${selectedSubtask.status === 'revision' ? 'bg-red-50 border-red-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex items-start gap-3">
                        <FileText className={`w-5 h-5 flex-shrink-0 mt-0.5 ${selectedSubtask.status === 'revision' ? 'text-red-500' : 'text-slate-500'}`} />
                        <div className="w-full relative pr-2">
                          {getNormalizedEvidenceEntries(selectedSubtask).length > 0 && (
                            <>
                              <p className="font-semibold text-slate-800 mb-2">Bukti Terlampir:</p>
                              <div className="space-y-1.5 mb-3">
                                {getNormalizedEvidenceEntries(selectedSubtask).map((entry, idx) => {
                                  const isApproved = new Set(getApprovedEvidenceKeys(selectedSubtask)).has(entry.key);
                                  return (
                                    <div key={entry.key} className={`rounded p-2 shadow-sm flex items-center gap-2 border ${isApproved ? 'bg-emerald-50 border-emerald-200' : entry.isLink ? 'bg-blue-50 border-blue-100' : 'bg-white border-slate-200'}`}>
                                      {entry.isLink ? <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" /> : <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />}
                                      <a href={entry.url || '#'} target={entry.url ? '_blank' : undefined} rel="noopener noreferrer" className="text-blue-600 hover:underline truncate block w-full text-sm font-medium" title={entry.label}>
                                        {idx + 1}. {entry.label}
                                      </a>
                                      {isApproved && <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0" />}
                                    </div>
                                  );
                                })}
                              </div>
                            </>
                          )}
                          {selectedSubtask.comments && selectedSubtask.comments.length > 0 && (
                            <div className="mt-2 pt-2 border-t border-slate-200/50 space-y-3">
                              {selectedSubtask.comments.map((comment, idx) => (
                                <div key={idx} className="flex items-start gap-2">
                                  <UserAvatar name={comment.user} photoURL={userByName.get(comment.user)?.photoURL} className="w-6 h-6 flex-shrink-0" />
                                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex-1 shadow-sm">
                                    <div className="flex justify-between items-baseline mb-1">
                                      <span className="text-xs font-bold text-slate-700">{comment.user}</span>
                                      <span className="text-[10px] text-slate-400">{comment.timestamp}</span>
                                    </div>
                                    <p className={`text-xs ${comment.type === 'revision' ? 'text-red-600' : 'text-slate-600'}`}>{comment.text}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {(userRole === 'Assignee' || userRole === 'PIC') && (selectedSubtask.status === 'pending' || selectedSubtask.status === 'revision') && selectedSubtask.assignee === currentUser.name && (
                  <div className="border-t border-slate-100 pt-5 mt-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Upload className="w-4 h-4 text-blue-600" /> Upload Pekerjaan & Komentar</h4>
                    <div className="space-y-4">
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 flex flex-col items-center justify-center text-slate-500 hover:bg-blue-50 hover:border-blue-400 transition-all group relative">
                        <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.jpg,.jpeg,.png" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => { if (e.target.files) handleEvidenceFileSelection(e.target.files); }} />
                        <div className="bg-blue-50 p-2 rounded-full mb-2 group-hover:scale-110 transition-transform"><ImageIcon className="w-5 h-5 text-blue-500" /></div>
                        <span className="text-xs font-medium text-slate-600 mb-1">Klik atau Drop file di sini</span>
                        <span className="text-[10px] text-slate-400">Bisa pilih lebih dari 1 file</span>
                      </div>
                      
                      {/* Tampilkan Daftar File Terpilih */}
                      {evidenceFiles.length > 0 && (
                          <div className="bg-blue-50 border border-blue-100 p-3 rounded-lg space-y-2">
                             <p className="text-xs font-bold text-blue-800">File Terpilih ({evidenceFiles.length}):</p>
                             {evidenceFiles.map((f, i) => (
                                <div key={i} className="flex justify-between items-center text-sm bg-white px-2 py-1 rounded shadow-sm border border-slate-100">
                                    <span className="text-slate-700 truncate w-3/4" title={f.name}>{f.name}</span>
                                    <button onClick={() => setEvidenceFiles(evidenceFiles.filter((_, idx)=>idx!==i))} className="text-red-500 hover:bg-red-50 p-1 rounded-full"><X className="w-3 h-3" /></button>
                                </div>
                             ))}
                          </div>
                      )}

                      <div><label className="block text-xs font-medium text-slate-700 mb-1">Tautan Bukti (URL)</label>
                           <input type="url" className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" placeholder="https://..." value={evidenceLink} onChange={(e) => setEvidenceLink(e.target.value)} />
                      </div>
                      
                      <div><label className="block text-xs font-medium text-slate-700 mb-1">Catatan / Komentar (Opsional)</label><textarea className="w-full border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" rows="3" placeholder="Tuliskan detail pengerjaan..." value={evidenceText} onChange={(e) => setEvidenceText(e.target.value)}></textarea></div>
                    </div>
                  </div>
                )}
                {userRole === 'PIC' && selectedSubtask.status === 'waiting_review' && selectedSubtask.parentPic === currentUser.name && getNormalizedEvidenceEntries(selectedSubtask).length > 0 && (
                  <div className="border-t border-slate-100 pt-5 mt-2">
                    <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2"><Check className="w-4 h-4 text-emerald-600" /> Pilih Evidence Yang Disetujui</h4>
                    <div className="space-y-2">
                      {getNormalizedEvidenceEntries(selectedSubtask).map((entry, idx) => {
                        const checked = approvalEvidenceSelection.includes(entry.key);
                        return (
                          <label key={entry.key} className={`flex items-start gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                setApprovalEvidenceSelection((prev) => (
                                  e.target.checked
                                    ? [...prev, entry.key]
                                    : prev.filter((key) => key !== entry.key)
                                ));
                              }}
                              className="mt-1 h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-slate-700">{idx + 1}. {entry.label}</p>
                              <p className="text-xs text-slate-400">{entry.isLink ? 'Link evidence' : 'File evidence'}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                    <p className="mt-3 text-xs text-slate-500">Evidence yang dipilih akan diberi tanda centang di subtask dan hanya evidence itu yang muncul di halaman File.</p>
                  </div>
                )}
              </div>
              <div className="bg-slate-50 p-4 border-t border-slate-200 flex justify-end gap-3 sticky bottom-0">
                <button onClick={() => setShowUserTaskDetailModal(false)} className="px-4 py-2 text-slate-600 hover:text-slate-800 text-sm font-medium rounded-lg hover:bg-white transition-colors">Tutup</button>
                {(userRole === 'Assignee' || userRole === 'PIC') && (selectedSubtask.status === 'pending' || selectedSubtask.status === 'revision') && selectedSubtask.assignee === currentUser.name && <button onClick={submitEvidence} className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"><Save className="w-4 h-4" /> Simpan & Kirim</button>}
                {userRole === 'PIC' && selectedSubtask.status === 'waiting_review' && selectedSubtask.parentPic === currentUser.name && (
                  <>
                    <button onClick={() => { openReviseModal({ id: selectedSubtask.parentId, title: selectedSubtask.parentTitle, pic: selectedSubtask.parentPic }, selectedSubtask); setShowUserTaskDetailModal(false); }} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"><AlertCircle className="w-4 h-4" /> Revise</button>
                    <button
                      onClick={async () => {
                        const approved = await approveSubtask(selectedSubtask.id, selectedSubtask.parentId, approvalEvidenceSelection);
                        if (approved) {
                          setShowUserTaskDetailModal(false);
                        }
                      }}
                      disabled={approvalEvidenceSelection.length === 0}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg shadow-sm flex items-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" /> Approve
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
  );
}
