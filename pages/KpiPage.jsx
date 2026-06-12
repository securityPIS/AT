import React from 'react';
import { BarChart2, Plus, ChevronRight, Edit2, Trash2 } from 'lucide-react';

export default function KpiPage({ KPI_GROUPS, kpisByGroup, expandedKPIGroups, toggleKPIGroup, openKPIModal, handleDeleteKPI }) {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><BarChart2 className="w-6 h-6" /></div>
            Master KPI
          </h2>
          <button onClick={() => openKPIModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Add KPI
          </button>
        </div>
        <div className="space-y-6">
          {KPI_GROUPS.map((group) => {
            const groupKpis = kpisByGroup.get(group) || [];
            const isExpanded = expandedKPIGroups ? expandedKPIGroups[group] : true;
            return (
              <div key={group} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden transition-all duration-300">
                <div className="bg-slate-50/50 p-4 border-b border-slate-100 flex justify-between items-center cursor-pointer hover:bg-slate-50" onClick={() => toggleKPIGroup(group)}>
                  <h3 className="font-bold text-slate-700 flex items-center gap-2">
                    <span className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </span>
                    <span className="w-2 h-6 bg-blue-500 rounded-full"></span>
                    {group}
                  </h3>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-500 px-2 py-1 rounded-full">{groupKpis.length} Indicators</span>
                </div>
                {isExpanded && (
                  <div className="divide-y divide-slate-100 animate-in fade-in slide-in-from-top-1 duration-200">
                    {groupKpis.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 text-sm">Belum ada KPI di grup ini.</div>
                    ) : (
                      groupKpis.map((kpi) => (
                        <div key={kpi.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors group">
                          <span className="font-medium text-slate-700 text-sm">{kpi.title}</span>
                          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={(e) => { e.stopPropagation(); openKPIModal(kpi); }} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                            <button onClick={(e) => { e.stopPropagation(); handleDeleteKPI(kpi.id); }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
