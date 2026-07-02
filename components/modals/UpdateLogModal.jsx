// Modal "Update" pada detail project: tulis catatan update + upload gambar,
// hasilnya masuk ke tab LOG project (action 'update_posted').
import { ImagePlus, MessageSquarePlus, X } from 'lucide-react';

export default function UpdateLogModal({
  activeTaskTitle,
  updateLogText,
  setUpdateLogText,
  updateLogFiles,
  setUpdateLogFiles,
  handleUpdateLogFileSelection,
  submitUpdateLog,
  updateLogUploading,
  setShowUpdateLogModal,
}) {
  const canSubmit = !updateLogUploading && (updateLogText.trim() !== "" || updateLogFiles.length > 0);
  const closeModal = () => { setShowUpdateLogModal(false); setUpdateLogText(""); setUpdateLogFiles([]); };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex justify-between items-start sticky top-0 z-10">
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 flex items-center gap-2"><MessageSquarePlus className="w-5 h-5 text-sky-600" /> Tambah Update</h3>
            {activeTaskTitle && <p className="text-xs text-slate-400 mt-0.5 truncate">Project: {activeTaskTitle}</p>}
          </div>
          <button onClick={closeModal}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Catatan Update</label>
            <textarea
              className="w-full border border-slate-300 p-3 rounded-lg text-sm bg-white focus:ring-2 focus:ring-sky-500 focus:outline-none resize-none"
              rows="3"
              value={updateLogText}
              onChange={(e) => setUpdateLogText(e.target.value)}
              placeholder="Tulis update / perkembangan terbaru…"
            />
          </div>

          <label className={`block border-2 border-dashed rounded-lg p-6 flex flex-col items-center cursor-pointer transition-colors ${updateLogFiles.length > 0 ? 'border-sky-400 bg-sky-50' : 'border-slate-300 text-slate-500 hover:bg-sky-50 hover:border-sky-400'}`}>
            <input type="file" multiple accept="image/*" className="hidden" onChange={(e) => { if (e.target.files) handleUpdateLogFileSelection(e.target.files); e.target.value = ''; }} />
            <ImagePlus className="w-6 h-6 text-sky-500 mb-2" />
            <span className="text-sm">{updateLogFiles.length > 0 ? `${updateLogFiles.length} gambar terpilih — klik untuk tambah` : 'Klik untuk upload gambar'}</span>
            <span className="text-xs text-slate-400 mt-1">Format gambar (JPG/PNG), bisa lebih dari satu</span>
          </label>

          {updateLogFiles.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {updateLogFiles.map((f, i) => (
                <div key={i} className="relative group">
                  <img src={URL.createObjectURL(f)} alt={f.name} className="w-full h-20 object-cover rounded-lg border border-slate-200" />
                  <button
                    onClick={() => setUpdateLogFiles(updateLogFiles.filter((_, idx) => idx !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-white border border-slate-200 rounded-full p-0.5 text-red-500 hover:text-red-700 shadow-sm"
                    title="Hapus gambar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t sticky bottom-0">
          <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100">Batal</button>
          <button
            onClick={submitUpdateLog}
            disabled={!canSubmit}
            className={`px-4 py-2 text-white text-sm font-medium rounded-lg flex items-center gap-2 transition-colors ${!canSubmit ? 'bg-slate-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-700 shadow-sm'}`}
          >
            {updateLogUploading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> Menyimpan...</> : <><MessageSquarePlus className="w-4 h-4" /> Kirim Update</>}
          </button>
        </div>
      </div>
    </div>
  );
}
