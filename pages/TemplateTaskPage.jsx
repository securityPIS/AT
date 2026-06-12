import React from 'react';
import { Copy, Plus, Edit2, Trash2, Circle } from 'lucide-react';

export default function TemplateTaskPage({ taskTemplates, openTemplateModal, handleDeleteTemplate }) {
  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white"><Copy className="w-6 h-6" /></div>
            Template Task
          </h2>
          <button onClick={() => openTemplateModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <Plus className="w-4 h-4" /> Add Template
          </button>
        </div>
        {taskTemplates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
            <Copy className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Belum ada template. Klik "Add Template" untuk memulai.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {taskTemplates.map((template) => (
              <div key={template.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="bg-blue-100 p-2 rounded-lg"><Copy className="w-5 h-5 text-blue-600" /></div>
                      <h3 className="font-bold text-slate-800 text-base">{template.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openTemplateModal(template)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => handleDeleteTemplate(template.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-semibold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full border border-blue-100">{template.subtasks.length} Subtask{template.subtasks.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="space-y-1.5">
                    {template.subtasks.slice(0, 4).map((sub, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                        <Circle className="w-3 h-3 text-slate-300 flex-shrink-0" />
                        <span className="truncate">{sub.title}</span>
                      </div>
                    ))}
                    {template.subtasks.length > 4 && (
                      <div className="text-xs text-slate-400 pl-5">+{template.subtasks.length - 4} lainnya...</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
