// Header atas: tombol menu, judul, lonceng notifikasi + panel, dan menu profil.
import { Bell, CheckCheck, ChevronDown, LogOut, Menu, Settings } from 'lucide-react';
import UserAvatar from './UserAvatar.jsx';

export default function Header({ currentUser, getNotificationTimeLabel, handleLogout, handleNotificationClick, markAllNotificationsAsRead, myNotifications, openEditProfileModal, profileMenuRef, setShowNotificationsPanel, setShowProfileMenu, showNotificationsPanel, showProfileMenu, toggleSidebar, unreadNotificationsCount }) {
  return (
      <header className="bg-white shadow-sm border-b border-slate-200 z-10 flex-none">
        <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button onClick={toggleSidebar} className="p-2 -ml-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"><Menu className="w-6 h-6" /></button>
            <div className="p-1 hidden md:block"><img src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiM9TljPSv9aQaK_uTL9SR-I2RfiJ9jFUpYdM6n0dTxSStaE57r6wXKHRDNFRCCLNT_tk1uEhVu8bNMc7Wk1dlp_i306miwvfnIbP3ZOaik-k1BMFFxRq_GRq1x81ZYw7jX4sejvb5J2P5BLpSfJeX8-EBKdMMqZIM-B7fonsUgq_4H6DmcRPAgbX3_kzTK/s320/PERTAMINA_id7hJAjeL4_1.png" alt="Logo" className="w-8 h-8 object-contain" /></div>
            <h1 className="text-lg font-bold text-slate-900">ActionTracker <span className="text-slate-400 font-normal text-sm hidden md:inline">| Task Monitoring</span></h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setShowProfileMenu(false);
                  setShowNotificationsPanel((prev) => !prev);
                }}
                className="relative rounded-lg p-2 text-slate-600 transition-colors hover:bg-slate-100"
                aria-label="Notifications"
              >
                <Bell className="h-5 w-5" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 min-w-[18px] rounded-full bg-red-500 px-1.5 text-center text-[10px] font-bold leading-[18px] text-white">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {showNotificationsPanel && (
                <div className="absolute right-0 top-12 z-50 w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                  <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Notifications</p>
                      <p className="text-xs text-slate-400">{unreadNotificationsCount} unread</p>
                    </div>
                    <button
                      type="button"
                      onClick={markAllNotificationsAsRead}
                      disabled={unreadNotificationsCount === 0}
                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:text-slate-300"
                    >
                      <CheckCheck className="h-3.5 w-3.5" />
                      Mark all read
                    </button>
                  </div>

                  <div className="max-h-[420px] overflow-y-auto">
                    {myNotifications.length === 0 ? (
                      <div className="px-4 py-10 text-center text-sm text-slate-400">
                        Belum ada notifikasi.
                      </div>
                    ) : (
                      myNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => handleNotificationClick(notification)}
                          className={`block w-full border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${notification.isRead ? 'bg-white' : 'bg-blue-50/40'}`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-slate-800">{notification.title}</p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">{notification.message}</p>
                            </div>
                            {!notification.isRead && <span className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-blue-500" />}
                          </div>
                          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
                            <span className="uppercase tracking-[0.08em]">{notification.priority || 'medium'}</span>
                            <span>{getNotificationTimeLabel(notification.createdAt)}</span>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {currentUser && (
              <div ref={profileMenuRef} className="relative flex items-center gap-2">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-bold text-slate-800">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 uppercase">{currentUser.role}</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowNotificationsPanel(false);
                    setShowProfileMenu((prev) => !prev);
                  }}
                  className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-1.5 py-1 transition-colors hover:bg-slate-50"
                  aria-label="Open profile menu"
                >
                  <UserAvatar name={currentUser.name} photoURL={currentUser.photoURL} className="w-8 h-8" />
                  <ChevronDown className={`hidden h-4 w-4 text-slate-500 transition-transform md:block ${showProfileMenu ? 'rotate-180' : ''}`} />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 top-12 z-50 w-60 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
                    <div className="border-b border-slate-100 px-4 py-3">
                      <p className="truncate text-sm font-semibold text-slate-900">{currentUser.name}</p>
                      <p className="mt-0.5 text-xs uppercase text-slate-400">{currentUser.role}</p>
                    </div>
                    <div className="p-2">
                      <button
                        type="button"
                        onClick={openEditProfileModal}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-slate-600 transition-colors hover:bg-slate-50"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="text-sm font-medium">Edit Profile</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-red-500 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        <span className="text-sm font-medium">Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </header>
  );
}
