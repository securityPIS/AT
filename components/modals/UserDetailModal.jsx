// Modal detail pengguna dengan aksi edit/hapus.
import { Briefcase, Building, CheckCircle, Mail, PenSquare, Trash2, User, X } from 'lucide-react';
import UserAvatar from '../UserAvatar.jsx';

export default function UserDetailModal({ handleDeleteUser, handleOpenEditUser, selectedUser, setShowUserDetailModal }) {
  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden text-center">
              <div className="bg-blue-600 h-28 w-full relative"><button onClick={() => setShowUserDetailModal(false)} className="absolute top-3 right-3 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button></div>
              <div className="px-6 pb-6 relative">
                <div className="relative -mt-14 mb-4 flex justify-center"><div className="rounded-full p-1.5 bg-white shadow-lg"><UserAvatar name={selectedUser.name} photoURL={selectedUser.photoURL} size={128} className="w-24 h-24" /></div></div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800">{selectedUser.name}</h3><p className="text-slate-500 text-sm">{selectedUser.role} • {selectedUser.department}</p>
                  <div className="mt-6 space-y-3 text-left">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><Mail className="w-5 h-5 text-blue-500" /><div className="overflow-hidden"><p className="text-xs text-slate-400 font-bold uppercase">Email</p><p className="text-sm font-medium text-slate-700 truncate" title={selectedUser.email}>{selectedUser.email}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><Briefcase className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-slate-400 font-bold uppercase">Company</p><p className="text-sm font-medium text-slate-700">{selectedUser.company || '-'}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><Building className="w-5 h-5 text-blue-500" /><div><p className="text-xs text-slate-400 font-bold uppercase">Department</p><p className="text-sm font-medium text-slate-700">{selectedUser.department}</p></div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><svg className="w-5 h-5 text-emerald-500" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg><div><p className="text-xs text-slate-400 font-bold uppercase">WhatsApp</p>{selectedUser.phone ? <a href={`https://wa.me/${String(selectedUser.phone).replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:underline">{selectedUser.phone}</a> : <p className="text-sm font-medium text-slate-700">-</p>}</div></div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100"><CheckCircle className="w-5 h-5 text-green-500" /><div><p className="text-xs text-slate-400 font-bold uppercase">Status</p><p className="text-sm font-medium text-green-700">{selectedUser.status}</p></div></div>
                  </div>
                  <div className="mt-6 flex gap-3 border-t border-slate-100 pt-4">
                    <button onClick={() => handleOpenEditUser(selectedUser)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-sm font-medium transition-colors"><PenSquare className="w-4 h-4" /> Edit</button>
                    <button onClick={handleDeleteUser} disabled={selectedUser.status === 'Active'} className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedUser.status === 'Active' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title={selectedUser.status === 'Active' ? "Hanya user Inactive yang dapat dihapus" : "Hapus User"}><Trash2 className="w-4 h-4" /> Delete</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
  );
}
