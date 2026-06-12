import React from 'react';
import { Briefcase, List, Clock, AlertTriangle, PieChart, Activity, Users } from 'lucide-react';

export default function DashboardPage({ dashboardStats, tasks, DonutChart, UserAvatar }) {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6"><h2 className="text-2xl font-bold text-slate-800">Dashboard Monitoring</h2><p className="text-slate-500 text-sm">Ringkasan statistik performa tim dan proyek.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Project</p><div className="flex items-center justify-between"><span className="text-2xl font-bold text-slate-800">{dashboardStats.totalProjects}</span><Briefcase className="w-8 h-8 text-blue-100" /></div></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Total Subtask</p><div className="flex items-center justify-between"><span className="text-2xl font-bold text-slate-800">{dashboardStats.totalSubtasks}</span><List className="w-8 h-8 text-purple-100" /></div></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Menunggu Review</p><div className="flex items-center justify-between"><span className="text-2xl font-bold text-yellow-600">{dashboardStats.waitingReview}</span><Clock className="w-8 h-8 text-yellow-100" /></div></div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm"><p className="text-xs text-slate-500 font-semibold uppercase mb-1">Perlu Revisi</p><div className="flex items-center justify-between"><span className="text-2xl font-bold text-red-600">{dashboardStats.revision}</span><AlertTriangle className="w-8 h-8 text-red-100" /></div></div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><PieChart className="w-5 h-5 text-slate-400" /> Distribusi Status</h3><div className="flex justify-center mb-6"><DonutChart data={[{ label: 'Completed', value: dashboardStats.completedSubtasks, color: '#22c55e' }, { label: 'Review', value: dashboardStats.waitingReview, color: '#eab308' }, { label: 'Revision', value: dashboardStats.revision, color: '#ef4444' }, { label: 'Pending', value: dashboardStats.pending, color: '#cbd5e1' }]} /></div><div className="space-y-2 text-sm"><div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500"></div>Completed</span> <span className="font-semibold">{dashboardStats.completedSubtasks}</span></div><div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500"></div>Review</span> <span className="font-semibold">{dashboardStats.waitingReview}</span></div><div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500"></div>Revision</span> <span className="font-semibold">{dashboardStats.revision}</span></div><div className="flex justify-between items-center"><span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-slate-300"></div>Pending</span> <span className="font-semibold">{dashboardStats.pending}</span></div></div></div>
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><Activity className="w-5 h-5 text-slate-400" /> Progress Project</h3>
            <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2">
              {tasks.map((task) => (
                <div key={task.id} className="group"><div className="flex justify-between items-center mb-1"><span className="font-medium text-sm text-slate-700 truncate max-w-[70%]">{task.title}</span><span className="text-xs font-bold text-blue-600">{task.progress}%</span></div><div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden"><div className="bg-blue-600 h-2.5 rounded-full transition-all duration-500" style={{ width: `${task.progress}%` }}></div></div><div className="flex justify-between text-[10px] text-slate-400 mt-1"><span>Deadline: {task.deadline}</span><span>PIC: {task.pic}</span></div></div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><Users className="w-5 h-5 text-slate-400" /> Beban Kerja Tim</h3>
          <div className="space-y-4">
            {dashboardStats.workload.map((member, idx) => (
              <div key={idx} className="flex items-center gap-4"><UserAvatar name={member.name} className="w-8 h-8" /><div className="flex-1"><div className="flex justify-between items-end mb-1"><span className="font-medium text-sm text-slate-700">{member.name}</span><span className="text-xs text-slate-500">{member.completed} / {member.total} Selesai</span></div><div className="flex h-3 rounded-full overflow-hidden bg-slate-100"><div className="bg-green-500 h-full" style={{ width: `${(member.completed / member.total) * 100}%` }}></div></div></div></div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
