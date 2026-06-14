// Halaman Login & registrasi mandiri (mode login/register/forgot password).
import React, { useState, useEffect, useMemo } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff, Lock, LogIn, Mail, UserPlus } from 'lucide-react';
import { ALLOWED_AVATAR_TYPES, AVATAR_MAX_BYTES, COMPANY_OPTIONS, EMPTY_REGISTER_FORM } from '../lib/constants.js';

export default function LoginPage({ onLogin, onRegister, loginFeedback = "" }) {
  const forgotPasswordMessages = [
    "KOCAK BENER bisa lupa password, coba inget inget dulu lah KOCAK",
    "Loh Ndak Tau Masa Tanya Sama Saya"
  ];
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [forgotPasswordMessage, setForgotPasswordMessage] = useState('');
  const [registerForm, setRegisterForm] = useState(EMPTY_REGISTER_FORM);
  const [registerAvatarFile, setRegisterAvatarFile] = useState(null);
  const [registerError, setRegisterError] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const registerAvatarPreview = useMemo(
    () => (registerAvatarFile ? URL.createObjectURL(registerAvatarFile) : ""),
    [registerAvatarFile]
  );

  useEffect(() => {
    if (!registerAvatarPreview) return undefined;

    return () => URL.revokeObjectURL(registerAvatarPreview);
  }, [registerAvatarPreview]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    onLogin(email, password, setError);
  };

  const handleForgotPasswordClick = () => {
    const randomMessage = forgotPasswordMessages[Math.floor(Math.random() * forgotPasswordMessages.length)];
    setForgotPasswordMessage(randomMessage);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setRegisterError('');
    setRegisterSuccess('');
    setIsRegistering(true);

    try {
      const message = await onRegister(registerForm, registerAvatarFile);
      setRegisterSuccess(message);
      setRegisterForm(EMPTY_REGISTER_FORM);
      setRegisterAvatarFile(null);
      setShowRegisterPassword(false);
      setMode('login');
    } catch (registerErr) {
      setRegisterError(registerErr?.message || 'Registrasi gagal. Silakan coba lagi.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleRegisterAvatarChange = (file) => {
    if (!file) {
      setRegisterAvatarFile(null);
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
      setRegisterError('Foto avatar harus berformat JPG atau PNG.');
      return;
    }

    if (file.size > AVATAR_MAX_BYTES) {
      setRegisterError('Ukuran foto avatar maksimal 2 MB.');
      return;
    }

    setRegisterError('');
    setRegisterAvatarFile(file);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg border border-slate-100">
        <div className="text-center mb-8">
          <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Pertamina" className="h-16 object-contain mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-slate-800">Action Tracker</h1>
          <p className="text-slate-500 text-sm">
            {mode === 'login' ? 'Masuk untuk mengelola task monitoring' : 'Daftarkan akun baru, lalu tunggu aktivasi dari PIC'}
          </p>
        </div>
        <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'login' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${mode === 'register' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Registrasi
          </button>
        </div>
        {mode === 'login' ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginFeedback && <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" /> <span>{loginFeedback}</span></div>}
            {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email</label><div className="relative"><Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input type="email" required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={email} onChange={(e) => setEmail(e.target.value)} /></div></div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><div className="relative"><Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input type={showPassword ? "text" : "password"} required className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2"><LogIn className="w-5 h-5" /> Masuk</button>
            <div className="text-center">
              <button
                type="button"
                onClick={handleForgotPasswordClick}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
              >
                Lupa Password
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {registerError && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg flex items-start gap-2"><AlertCircle className="w-4 h-4 mt-0.5" /> <span>{registerError}</span></div>}
            {registerSuccess && <div className="bg-emerald-50 text-emerald-700 text-sm p-3 rounded-lg flex items-start gap-2"><CheckCircle className="w-4 h-4 mt-0.5" /> <span>{registerSuccess}</span></div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label><input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} placeholder="e.g. John Doe" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Email Address</label><div className="relative"><Mail className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input type="email" required className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} placeholder="e.g. john@pertamina.com" /></div></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Company</label><select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.company} onChange={(e) => setRegisterForm({ ...registerForm, company: e.target.value })}><option value="">-Pilih Company-</option>{COMPANY_OPTIONS.map((company) => <option key={company} value={company}>{company}</option>)}</select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">No. Telephone (WhatsApp)</label><input type="tel" required pattern="[0-9]*" onInput={(e) => e.target.value = e.target.value.replace(/[^0-9]/g, '')} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.phone} onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })} placeholder="081234567890" /></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Role</label><select required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.role} onChange={(e) => setRegisterForm({ ...registerForm, role: e.target.value })}><option value="">-Pilih Role-</option><option value="Assignee">Assignee</option><option value="PIC">PIC</option></select></div>
              <div><label className="block text-sm font-semibold text-slate-700 mb-1">Department</label><input type="text" required className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.department} onChange={(e) => setRegisterForm({ ...registerForm, department: e.target.value })} placeholder="e.g. Finance" /></div>
            </div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Photo Avatar</label><input type="file" required accept="image/png,image/jpeg" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-slate-700 hover:file:bg-slate-200" onChange={(e) => handleRegisterAvatarChange(e.target.files?.[0] || null)} />{registerAvatarPreview ? (<div className="mt-3 flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3"><img src={registerAvatarPreview} alt="Preview avatar registrasi" className="h-14 w-14 rounded-full object-cover border border-white shadow-sm" /><div className="min-w-0"><p className="truncate text-sm font-medium text-slate-700">{registerAvatarFile?.name}</p><p className="text-[11px] text-slate-400">Preview avatar baru</p></div></div>) : (<p className="mt-1 text-[11px] text-slate-400">Format JPG/PNG, maksimal 2 MB.</p>)}</div>
            <div><label className="block text-sm font-semibold text-slate-700 mb-1">Password</label><div className="relative"><Lock className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" /><input required type={showRegisterPassword ? "text" : "password"} className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} placeholder="Set login password" autoComplete="new-password" /><button type="button" onClick={() => setShowRegisterPassword(!showRegisterPassword)} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600">{showRegisterPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div><p className="mt-1 text-[11px] text-slate-400">Akun akan dibuat dalam status nonaktif dan menunggu aktivasi dari PIC.</p></div>
            <button type="submit" disabled={isRegistering} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"><UserPlus className="w-5 h-5" /> {isRegistering ? 'Mengirim Registrasi...' : 'Kirim Registrasi'}</button>
          </form>
        )}
        <div className="mt-6 text-center text-xs text-slate-400">&copy; {new Date().getFullYear()} Pertamina Action Tracker</div>
      </div>
      {forgotPasswordMessage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-6 w-6 text-amber-500" />
              <div className="flex-1">
                <h2 className="text-lg font-bold text-slate-800">Lupa Password</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{forgotPasswordMessage}</p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setForgotPasswordMessage('')}
                className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
