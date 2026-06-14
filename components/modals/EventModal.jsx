// Modal tambah/edit event kalender beserta peserta.
import { User, X } from 'lucide-react';
import UserAvatar from '../UserAvatar.jsx';

export default function EventModal({ activeUsers, editingEvent, eventForm, handleSaveEvent, setEventForm, setShowEventModal, taskById, toggleEventParticipant }) {
  return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 p-4 border-b flex justify-between items-center sticky top-0 z-10">
              <h3 className="font-bold">{editingEvent ? 'Edit Event' : (eventForm.eventType === 'internal' ? 'Add Internal Event' : 'Add External Event')}</h3>
              <button onClick={() => setShowEventModal(false)}><X className="w-5 h-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Judul Event</label>
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={eventForm.title} onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })} placeholder="Masukkan Judul Event" />
              </div>
              {eventForm.eventType === 'internal' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Linked Project</label>
                  <div className="w-full border border-slate-200 bg-slate-50 p-2 text-sm rounded-lg text-slate-700 font-medium">
                    {taskById.get(eventForm.linkedTaskId)?.title || eventForm.title}
                  </div>
                </div>
              )}
              <div className="flex gap-4">
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Start Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={eventForm.startDate} onChange={(e) => setEventForm({ ...eventForm, startDate: e.target.value })} />
                </div>
                <div className="w-1/2">
                  <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">End Date</label>
                  <input type="date" className="w-full border p-2 rounded-lg text-sm" value={eventForm.endDate} onChange={(e) => setEventForm({ ...eventForm, endDate: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Lokasi</label>
                <input type="text" className="w-full border p-2 rounded-lg text-sm" value={eventForm.location} onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })} placeholder="Masukkan Lokasi" />
              </div>
              {eventForm.eventType !== 'internal' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2 uppercase">Peserta (User)</label>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 max-h-48 overflow-y-auto space-y-2">
                    {activeUsers.map(user => {
                      const isSelected = eventForm.participants.includes(user.name);
                      return (
                        <label key={user.id} className="flex items-center gap-3 p-2 rounded hover:bg-white border border-transparent hover:border-slate-200 cursor-pointer transition-colors">
                          <input type="checkbox" checked={isSelected} onChange={() => toggleEventParticipant(user.name)} className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                          <UserAvatar name={user.name} photoURL={user.photoURL} className="w-6 h-6" />
                          <span className="text-sm font-medium text-slate-700 flex-1">{user.name}</span>
                          <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded">{user.role}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-4 border-t sticky bottom-0 flex justify-end gap-2">
              <button onClick={() => setShowEventModal(false)} className="px-4 py-2 text-sm text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors">Batal</button>
              <button onClick={handleSaveEvent} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">Simpan Event</button>
            </div>
          </div>
        </div>
  );
}
