// Modal edit profil pengguna sendiri (data diri, avatar, ganti password).
import { Lock, X } from 'lucide-react';
import { COMPANY_OPTIONS } from '../../lib/constants.js';

export default function EditProfileModal({ closeEditProfileModal, handleAvatarFileSelection, handleUpdateOwnProfile, isSavingProfile, profileAvatarFile, profileAvatarPreview, profileForm, profilePasswordForm, setProfileForm, setProfilePasswordForm }) {
  return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-xl">
              <div className="flex items-center justify-between border-b bg-slate-50 p-4">
                <div>
                  <h3 className="font-bold text-slate-800">Edit Profile</h3>
                  <p className="text-xs text-slate-500">Perbarui data pribadi, avatar, dan password akun Anda.</p>
                </div>
                <button type="button" onClick={closeEditProfileModal}>
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdateOwnProfile();
                }}
              >
                <div className="max-h-[75vh] space-y-4 overflow-y-auto p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Full Name</label>
                      <input type="text" value={profileForm.name} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Email Address</label>
                      <input type="email" value={profileForm.email} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Role</label>
                      <input type="text" value={profileForm.role} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500" />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Status</label>
                      <input type="text" value={profileForm.status} readOnly className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-sm text-slate-500" />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Company</label>
                    <select
                      required
                      value={profileForm.company}
                      onChange={(e) => setProfileForm((prev) => ({ ...prev, company: e.target.value }))}
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {COMPANY_OPTIONS.map((company) => <option key={company} value={company}>{company}</option>)}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Department</label>
                      <input
                        type="text"
                        required
                        value={profileForm.department}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, department: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-bold uppercase text-slate-500">No. Telephone (WhatsApp)</label>
                      <input
                        type="tel"
                        required
                        pattern="[0-9]*"
                        value={profileForm.phone}
                        onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')}
                        onChange={(e) => setProfileForm((prev) => ({ ...prev, phone: e.target.value }))}
                        className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="081234567890"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Photo Avatar</label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg"
                      className="w-full rounded-lg border border-slate-300 p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => handleAvatarFileSelection(e.target.files?.[0] || null, 'profile')}
                    />
                    {profileAvatarPreview ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={profileAvatarPreview} alt="Preview avatar profile" className="h-14 w-14 rounded-full border border-white object-cover shadow-sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-700">{profileAvatarFile?.name}</p>
                          <p className="text-[11px] text-slate-400">Preview avatar baru</p>
                        </div>
                      </div>
                    ) : profileForm.photoURL ? (
                      <div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
                        <img src={profileForm.photoURL} alt="Avatar profile saat ini" className="h-14 w-14 rounded-full border border-white object-cover shadow-sm" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700">Avatar saat ini</p>
                          <p className="text-[11px] text-slate-400">Akan tetap dipakai jika tidak memilih file baru.</p>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>
                    )}
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-blue-600" />
                      <h4 className="text-sm font-bold text-slate-800">Ganti Password</h4>
                    </div>
                    <p className="mt-1 text-[11px] text-slate-500">Kosongkan bagian ini jika tidak ingin mengganti password.</p>
                    <div className="mt-4 space-y-3">
                      <div>
                        <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Password Saat Ini</label>
                        <input
                          type="password"
                          value={profilePasswordForm.currentPassword}
                          onChange={(e) => setProfilePasswordForm((prev) => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          autoComplete="current-password"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Password Baru</label>
                          <input
                            type="password"
                            value={profilePasswordForm.newPassword}
                            onChange={(e) => setProfilePasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="new-password"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-bold uppercase text-slate-500">Konfirmasi Password</label>
                          <input
                            type="password"
                            value={profilePasswordForm.confirmPassword}
                            onChange={(e) => setProfilePasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full rounded-lg border border-slate-300 p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            autoComplete="new-password"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-2 border-t bg-slate-50 p-4">
                  <button type="button" onClick={closeEditProfileModal} disabled={isSavingProfile} className="rounded-lg px-4 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-50">Batal</button>
                  <button type="submit" disabled={isSavingProfile} className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50">{isSavingProfile ? 'Menyimpan...' : 'Simpan Perubahan'}</button>
                </div>
              </form>
            </div>
          </div>
  );
}
