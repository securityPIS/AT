import React, { useMemo } from 'react';
import { Search, CheckCircle2, Clock3, AlertTriangle, Circle } from 'lucide-react';

const STATUS_META = {
  pending: {
    label: 'READY',
    icon: Clock3,
    wrapperClass: 'border-blue-200 bg-blue-50 text-blue-700',
  },
  waiting_review: {
    label: 'REVIEW',
    icon: Clock3,
    wrapperClass: 'border-amber-200 bg-amber-50 text-amber-700',
  },
  revision: {
    label: 'REVISE',
    icon: AlertTriangle,
    wrapperClass: 'border-red-200 bg-red-50 text-red-600',
  },
  completed: {
    label: 'COMPLETED',
    icon: CheckCircle2,
    wrapperClass: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  },
};

export default function UserTaskPage({
  userTaskSearch,
  setUserTaskSearch,
  filteredUserTasks,
  currentUser,
  handleOpenUserTaskDetail,
  formatDateIndo,
  users,
  UserAvatar,
}) {
  const userByName = useMemo(() => {
    const entries = (users || [])
      .filter((user) => user?.name)
      .map((user) => [user.name, user]);
    return new Map(entries);
  }, [users]);

  const visibleUserTasks = useMemo(() => {
    const normalizedCurrentUserName = (currentUser?.name || '').trim().toLowerCase();
    return (filteredUserTasks || []).filter((subtask) => (
      (subtask?.assignee || '').trim().toLowerCase() === normalizedCurrentUserName
    ));
  }, [currentUser?.name, filteredUserTasks]);

  return (
    <main className="flex-1 overflow-y-auto bg-slate-50 px-4 py-6 md:px-8 md:py-10">
      <div className="mx-auto w-full max-w-6xl">
        <header className="mb-8 md:mb-10">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">User Tasks</h2>
          <p className="mt-2 text-sm text-slate-500 md:text-base">
            Manage and track only the tasks assigned to you.
          </p>
        </header>

        <div className="relative mb-8 md:mb-10">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search your tasks or projects..."
            value={userTaskSearch}
            onChange={(e) => setUserTaskSearch(e.target.value)}
            className="block h-12 w-full rounded-2xl border border-slate-200 bg-white pl-14 pr-5 text-base text-slate-700 shadow-sm outline-none transition focus:border-slate-300 focus:ring-4 focus:ring-slate-100"
          />
        </div>

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="hidden items-center border-b border-slate-200 bg-slate-50/70 px-8 py-5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 md:flex">
            <div className="w-[50%]">Task Details</div>
            <div className="w-[30%]">Assigned To</div>
            <div className="w-[20%] text-right">Status</div>
          </div>

          {visibleUserTasks.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {visibleUserTasks.map((sub) => {
                const meta = STATUS_META[sub.status] || {
                  label: 'PENDING',
                  icon: Circle,
                  wrapperClass: 'border-slate-200 bg-slate-50 text-slate-600',
                };
                const Icon = meta.icon;

                return (
                  <button
                    key={sub.id}
                    type="button"
                    onClick={() => handleOpenUserTaskDetail(sub)}
                    className="block w-full bg-white px-5 py-5 text-left transition hover:bg-slate-50 md:px-8 md:py-6"
                  >
                    <div className="flex items-start justify-between gap-4 md:flex-row md:items-center">
                      <div className="min-w-0 flex-1 md:w-[50%]">
                        <p className="truncate text-lg font-semibold text-slate-900 md:text-base">{sub.title}</p>
                        <p className="mt-2 text-sm text-slate-400">Deadline: {formatDateIndo(sub.deadline)}</p>
                      </div>

                      <div className="flex flex-col items-end gap-2 self-start md:w-[30%] md:flex-row md:items-center md:justify-start md:self-auto">
                        <div className="md:hidden">
                          <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold tracking-[0.06em] ${meta.wrapperClass}`}>
                            <Icon className="h-3.5 w-3.5 flex-none" />
                            {meta.label}
                          </span>
                        </div>

                        <div className="min-w-0 text-right md:hidden">
                          <p className="truncate text-sm font-medium text-slate-800">{sub.assignee}</p>
                        </div>

                        <div className="hidden md:flex md:items-center md:gap-4">
                          <UserAvatar name={sub.assignee} photoURL={userByName.get(sub.assignee)?.photoURL} className="h-10 w-10" />
                          <span className="truncate text-base font-medium text-slate-800">{sub.assignee}</span>
                        </div>
                      </div>

                      <div className="hidden md:block md:w-[20%] md:text-right">
                        <span className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold tracking-[0.08em] ${meta.wrapperClass}`}>
                          <Icon className="h-4 w-4 flex-none" />
                          {meta.label}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-8 py-16 text-center">
              <p className="text-lg font-medium text-slate-500">No tasks found.</p>
              <p className="mt-2 text-sm text-slate-400">Try adjusting the search keywords.</p>
            </div>
          )}
        </section>

        <p className="mt-8 text-sm text-slate-500">Showing {visibleUserTasks.length} tasks</p>
      </div>
    </main>
  );
}
