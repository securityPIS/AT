// Modal tambah/edit indikator KPI.
import { Save, X } from 'lucide-react';
import { KPI_GROUPS } from '../../lib/constants.js';

export default function KpiModal({ editingKPI, handleSaveKPI, kpiForm, setKpiForm, setShowKPIModal }) {
  return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden">
              <div className="bg-slate-50 p-4 border-b flex justify-between items-center"><h3 className="font-bold text-slate-800">{editingKPI ? 'Edit KPI' : 'Add New KPI'}</h3><button onClick={() => setShowKPIModal(false)}><X className="w-5 h-5 text-slate-400" /></button></div>
              <div className="p-6 space-y-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">KPI Title</label><input type="text" className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={kpiForm.title} onChange={(e) => setKpiForm({ ...kpiForm, title: e.target.value })} placeholder="e.g. Revenue Growth" /></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Group</label><select className="w-full border border-slate-300 rounded-lg p-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" value={kpiForm.group} onChange={(e) => setKpiForm({ ...kpiForm, group: e.target.value })}>{KPI_GROUPS.map(g => (<option key={g} value={g}>{g}</option>))}</select></div>
              </div>
              <div className="bg-slate-50 p-4 flex justify-end gap-2 border-t"><button onClick={() => setShowKPIModal(false)} className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-200 rounded-lg transition-colors">Cancel</button><button onClick={handleSaveKPI} className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors">Save</button></div>
            </div>
          </div>
  );
}
