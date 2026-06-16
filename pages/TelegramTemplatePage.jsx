import React, { useState } from 'react';
import { Send, Eye, Tag } from 'lucide-react';

const CATEGORY_META = {
  task:     { label: 'Tugas',    bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  evidence: { label: 'Evidence', bg: 'bg-indigo-100',  text: 'text-indigo-700', border: 'border-indigo-200' },
  revision: { label: 'Revisi',   bg: 'bg-orange-100',  text: 'text-orange-700', border: 'border-orange-200' },
  approval: { label: 'Approval', bg: 'bg-emerald-100', text: 'text-emerald-700',border: 'border-emerald-200' },
  reminder: { label: 'Reminder', bg: 'bg-amber-100',   text: 'text-amber-700',  border: 'border-amber-200' },
};

function TelegramBubble({ message }) {
  const lines = message.split('\n');
  return (
    <div className="bg-[#1e2c3d] rounded-xl p-3 max-w-xs">
      <div className="bg-[#2b5278] rounded-lg p-3 text-white text-xs leading-relaxed font-mono whitespace-pre-wrap">
        {lines.map((line, i) => {
          const bold = line.replace(/\*(.*?)\*/g, (_, t) => `__BOLD__${t}__BOLD__`);
          const parts = bold.split('__BOLD__');
          return (
            <span key={i}>
              {parts.map((part, j) =>
                j % 2 === 1
                  ? <strong key={j} className="font-bold">{part}</strong>
                  : <span key={j}>{part}</span>
              )}
              {i < lines.length - 1 && '\n'}
            </span>
          );
        })}
      </div>
      <div className="text-right mt-1">
        <span className="text-[10px] text-slate-400">12:00 ✓✓</span>
      </div>
    </div>
  );
}

export default function TelegramTemplatePage({ telegramTemplates }) {
  const [previewId, setPreviewId] = useState(null);

  return (
    <main className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <div className="bg-sky-500 p-2 rounded-lg text-white"><Send className="w-6 h-6" /></div>
            Template Telegram
          </h2>
          <span className="text-sm text-slate-500">{telegramTemplates.length} template tersedia</span>
        </div>

        {telegramTemplates.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300 text-slate-400">
            <Send className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-sm">Belum ada template Telegram.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {telegramTemplates.map((tpl) => {
              const cat = CATEGORY_META[tpl.category] || CATEGORY_META.task;
              const isOpen = previewId === tpl.id;
              return (
                <div key={tpl.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all overflow-hidden">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="bg-sky-100 p-2 rounded-lg flex-shrink-0">
                          <Send className="w-4 h-4 text-sky-600" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-slate-800 text-sm truncate">{tpl.name}</h3>
                          <p className="text-xs text-slate-500 truncate">{tpl.triggerLabel}</p>
                        </div>
                      </div>
                      <span className={`ml-2 flex-shrink-0 text-xs font-medium px-2 py-0.5 rounded-full border ${tpl.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                        {tpl.isActive ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cat.bg} ${cat.text} ${cat.border}`}>
                        <Tag className="w-3 h-3" />{cat.label}
                      </span>
                    </div>

                    <div className="bg-slate-50 rounded-lg p-2.5 mb-3">
                      <p className="text-xs text-slate-500 mb-1 font-medium">Variabel tersedia:</p>
                      <div className="flex flex-wrap gap-1">
                        {tpl.variables.map((v) => (
                          <code key={v} className="text-xs bg-sky-100 text-sky-700 px-1.5 py-0.5 rounded font-mono">{v}</code>
                        ))}
                      </div>
                    </div>

                    <button
                      onClick={() => setPreviewId(isOpen ? null : tpl.id)}
                      className="w-full flex items-center justify-center gap-1.5 text-xs font-medium text-slate-600 hover:text-sky-600 border border-slate-200 hover:border-sky-300 rounded-lg py-2 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      {isOpen ? 'Tutup Preview' : 'Lihat Preview'}
                    </button>
                  </div>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-[#0d1117] p-4 flex justify-center">
                      <TelegramBubble message={tpl.message} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
