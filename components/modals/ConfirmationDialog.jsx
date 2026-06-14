// Dialog konfirmasi generik (mis. konfirmasi hapus) berbasis state confirmationDialog.
import { AlertTriangle } from 'lucide-react';

export default function ConfirmationDialog({ closeConfirmationDialog, confirmationDialog }) {
  return (
        <div className="fixed inset-0 bg-slate-900/50 z-[120] flex items-center justify-center p-4">
          <div className="w-full max-w-md overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className={`flex items-start gap-3 border-b px-5 py-4 ${
              confirmationDialog.tone === 'red'
                ? 'border-red-100 bg-red-50'
                : confirmationDialog.tone === 'emerald'
                  ? 'border-emerald-100 bg-emerald-50'
                  : 'border-blue-100 bg-blue-50'
            }`}>
              <div className={`mt-0.5 flex h-10 w-10 items-center justify-center rounded-full ${
                confirmationDialog.tone === 'red'
                  ? 'bg-red-100 text-red-600'
                  : confirmationDialog.tone === 'emerald'
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-blue-100 text-blue-600'
              }`}>
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">{confirmationDialog.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{confirmationDialog.message}</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4">
              <button
                type="button"
                onClick={() => closeConfirmationDialog(false)}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50"
              >
                {confirmationDialog.cancelLabel}
              </button>
              <button
                type="button"
                onClick={() => closeConfirmationDialog(true)}
                className={`rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors ${
                  confirmationDialog.tone === 'red'
                    ? 'bg-red-600 hover:bg-red-700'
                    : confirmationDialog.tone === 'emerald'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {confirmationDialog.confirmLabel}
              </button>
            </div>
          </div>
        </div>
  );
}
