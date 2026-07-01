// Modal edit data pengguna (khusus PIC).
import { Save, User, X } from 'lucide-react';
import { COMPANY_OPTIONS } from '../../lib/constants.js';
import { normalizeAvatarUrl } from '../../lib/avatarUtils.js';

export default function EditUserModal({ editUserAvatarFile, editUserAvatarPreview, editUserForm, events, handleAvatarFileSelection, handleUpdateUser, isSavingUser, setEditUserForm, setShowEditUserModal }) {
  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">Edit User</h3><button onClick={() => setShowEditUserModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }}>
                <div className="p-6 space-y-4">
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Full Name</label><input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.name} onChange={(e) => setEditUserForm({ ...editUserForm, name: e.target.value })} placeholder="e.g. John Doe" /></div>
                  <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Email Address</label><input type="email" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.email} onChange={(e) => setEditUserForm({ ...editUserForm, email: e.target.value })} placeholder="e.g. john@pertamina.com" /></div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Company</label>
                    <select required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.company} onChange={(e) => setEditUserForm({ ...editUserForm, company: e.target.value })}>
                      {editUserForm.company && !COMPANY_OPTIONS.includes(editUserForm.company) && (
                        <option value={editUserForm.company}>{editUserForm.company}</option>
                      )}
                      {COMPANY_OPTIONS.map((company) => <option key={company} value={company}>{company}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">No. Telephone (WhatsApp)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="w-4 h-4 text-emerald-500" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.878-.788-1.47-1.761-1.643-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                      </div>
                      <input type="tel" required pattern="[0-9]*" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} className="w-full border border-slate-300 rounded-lg p-2 pl-9 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.phone} onChange={(e) => setEditUserForm({ ...editUserForm, phone: e.target.value })} placeholder="081234567890" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Photo Avatar</label>
                    <input type="file" accept="image/png,image/jpeg" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => handleAvatarFileSelection(e.target.files?.[0] || null, 'edit')} />
                    {editUserAvatarPreview ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={editUserAvatarPreview} alt="Preview avatar edit user" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">{editUserAvatarFile?.name}</p>
                          <p className="text-[11px] text-slate-400">Preview avatar baru</p>
                        </div>
                      </div>
                    ) : editUserForm.photoURL ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={normalizeAvatarUrl(editUserForm.photoURL)} alt="Avatar user saat ini" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700">Avatar saat ini</p>
                          <p className="text-[11px] text-slate-400">Akan tetap dipakai jika tidak memilih file baru.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Role</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.role} onChange={(e) => setEditUserForm({ ...editUserForm, role: e.target.value })}><option value="Assignee">Assignee</option><option value="PIC">PIC</option></select></div>
                    <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Department</label><input type="text" required className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={editUserForm.department} onChange={(e) => setEditUserForm({ ...editUserForm, department: e.target.value })} placeholder="e.g. Finance" /></div>
                  </div>
                </div>
                <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button type="button" onClick={() => setShowEditUserModal(false)} disabled={isSavingUser} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Cancel</button><button type="submit" disabled={isSavingUser} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">{isSavingUser ? 'Saving...' : 'Save Changes'}</button></div>
              </form>
            </div>
          </div>
  );
}
