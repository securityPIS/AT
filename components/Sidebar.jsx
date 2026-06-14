// Sidebar navigasi (drawer mobile + overlay): tombol pindah halaman & logout.
import { BarChart2, Calendar, CalendarDays, ClipboardList, Copy, File, FileText, Home, LayoutDashboard, LogOut, Menu, Settings, User, X } from 'lucide-react';

export default function Sidebar({ activePage, handleLogout, isSidebarOpen, navigateTo, setIsSidebarOpen, userRole }) {
  return (
    <>
      {isSidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setIsSidebarOpen(false)}></div>}

      <div className={`fixed top-0 left-0 h-full w-64 bg-white shadow-xl z-40 transform transition-transform duration-300 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Logo" className="w-8 h-8 object-contain" />
            Menu
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="text-slate-400 hover:text-slate-600 lg:hidden"><X className="w-5 h-5" /></button>
        </div>

        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-70px)]">
          <button onClick={() => navigateTo('jobtask')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'jobtask' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Home className="w-5 h-5" /><span className="font-medium text-sm">Jobtask</span>
          </button>
          <button onClick={() => navigateTo('user-task')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'user-task' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <ClipboardList className="w-5 h-5" /><span className="font-medium text-sm">User Task</span>
          </button>
          <button onClick={() => navigateTo('coe')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'coe' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <CalendarDays className="w-5 h-5" /><span className="font-medium text-sm">Calendar Of Event</span>
          </button>
          <button onClick={() => navigateTo('file')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'file' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <FileText className="w-5 h-5" /><span className="font-medium text-sm">File</span>
          </button>
          <button onClick={() => navigateTo('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'dashboard' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <LayoutDashboard className="w-5 h-5" /><span className="font-medium text-sm">Dashboard</span>
          </button>
          {userRole === 'PIC' && (
            <button onClick={() => navigateTo('manage-user')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'manage-user' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Settings className="w-5 h-5" /><span className="font-medium text-sm">Manage User</span>
            </button>
          )}
          <button onClick={() => navigateTo('kpi')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'kpi' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <BarChart2 className="w-5 h-5" /><span className="font-medium text-sm">KPI</span>
          </button>
          <button onClick={() => navigateTo('template-task')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${activePage === 'template-task' ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Copy className="w-5 h-5" /><span className="font-medium text-sm">Template Task</span>
          </button>
          <div className="pt-4 mt-4 border-t border-slate-100">
            <button onClick={handleLogout} className="w-full flex items-center gap-3 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <LogOut className="w-5 h-5" /><span className="font-medium text-sm">Logout</span>
            </button>
          </div>
        </nav>
      </div>
    </>
  );
}
