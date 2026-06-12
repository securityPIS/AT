import React from 'react';
import { Users, UserPlus, Power } from 'lucide-react';

export default function ManageUserPage({ users, UserAvatar, handleOpenUserDetail, toggleUserStatus, setShowAddUserModal }) {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2"><div className="bg-blue-600 p-2 rounded-lg text-white"><Users className="w-6 h-6" /></div>Manage User</h2>
          <button onClick={() => setShowAddUserModal(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"><UserPlus className="w-4 h-4" /> Add User</button>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="divide-y divide-slate-100">
            {users.map((user) => (
              <div key={user.id} onClick={() => handleOpenUserDetail(user)} className="flex items-center justify-between p-4 hover:bg-slate-50 transition-colors cursor-pointer">
                <div className="flex items-center gap-4">
                  <UserAvatar name={user.name} photoURL={user.photoURL} size={64} className="w-12 h-12 md:w-14 md:h-14" />
                  <div><h4 className="font-semibold text-slate-800 text-base md:text-lg">{user.name}</h4><div className="flex items-center gap-2 text-xs md:text-sm text-slate-500 mt-1"><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${user.role === 'PIC' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>{user.role}</span><span className="hidden md:inline">• {user.department}</span></div></div>
                </div>
                <div className="flex items-center"><button onClick={(e) => toggleUserStatus(e, user.id)} className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 ${user.status === 'Active' ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-100 text-red-700 hover:bg-red-200'}`}><Power className="w-3 h-3" />{user.status}</button></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
