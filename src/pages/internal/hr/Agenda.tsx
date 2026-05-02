import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { CalendarDays, Plus, ChevronLeft, ChevronRight, MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

const eventTypes = [
  { value: 'meeting', label: 'Réunion', color: '#4F46E5' },
  { value: 'formation', label: 'Formation', color: '#10B981' },
  { value: 'mission', label: 'Mission', color: '#F59E0B' },
  { value: 'holiday', label: 'Férié', color: '#EF4444' },
  { value: 'general', label: 'Général', color: '#6B7280' },
];

export default function Agenda() {
  const { token } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ type: 'meeting', color: '#4F46E5' });

  const load = async () => {
    const res = await fetch('/api/internal/hr/events', { headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) setEvents(await res.json());
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.date) { toast.error('Titre et date requis'); return; }
    const res = await fetch('/api/internal/hr/events', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(form)
    });
    if (res.ok) { toast.success('Événement créé'); setDialogOpen(false); setForm({ type: 'meeting', color: '#4F46E5' }); load(); }
    else toast.error('Erreur');
  };

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear(), month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    const arr: (number | null)[] = Array((firstDay + 6) % 7).fill(null);
    for (let d = 1; d <= days; d++) arr.push(d);
    return arr;
  }, [currentDate]);

  const eventsByDate = useMemo(() => {
    const map: Record<string, any[]> = {};
    events.forEach(e => {
      const d = e.date?.substring(0, 10);
      if (!d) return;
      if (!map[d]) map[d] = [];
      map[d].push(e);
    });
    return map;
  }, [events]);

  const monthStr = currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
  const upcoming = events.filter(e => new Date(e.date) >= new Date()).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarDays className="h-7 w-7 text-indigo-600" />Agenda</h1>
          <p className="text-sm text-gray-500">Calendrier des événements, missions et réunions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-1" />Nouvel événement</Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="text-base capitalize">{monthStr}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Lu','Ma','Me','Je','Ve','Sa','Di'].map(d => <div key={d} className="text-center text-xs font-semibold text-gray-500 py-2">{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {daysInMonth.map((d, i) => {
                if (!d) return <div key={i} />;
                const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth()+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                const dayEvents = eventsByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().substring(0,10);
                return (
                  <div key={i} className={`min-h-[80px] p-1.5 rounded-lg border ${isToday ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'} transition-colors`}>
                    <div className={`text-xs font-semibold ${isToday ? 'text-indigo-700' : 'text-gray-700'} mb-1`}>{d}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(e => (
                        <div key={e.id} className="text-[10px] px-1.5 py-0.5 rounded text-white truncate" style={{ backgroundColor: e.color || '#4F46E5' }}>{e.title}</div>
                      ))}
                      {dayEvents.length > 2 && <div className="text-[10px] text-gray-500">+{dayEvents.length - 2}</div>}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Événements à venir</CardTitle></CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">Aucun événement</p>
            ) : (
              <div className="space-y-3">
                {upcoming.map(e => {
                  const type = eventTypes.find(t => t.value === e.type) || eventTypes[4];
                  return (
                    <div key={e.id} className="flex gap-3 p-3 rounded-lg bg-gray-50 border-l-4" style={{ borderLeftColor: e.color || type.color }}>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{e.title}</div>
                        <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          {new Date(e.date).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                        </div>
                        {e.description && <div className="text-xs text-gray-600 mt-1 line-clamp-2">{e.description}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvel événement</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Titre *" value={form.title||''} onChange={e => setForm({...form, title: e.target.value})} />
            <textarea className="w-full p-2 border rounded" rows={2} placeholder="Description" value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="datetime-local" value={form.date||''} onChange={e => setForm({...form, date: e.target.value})} />
              <select className="p-2 border rounded" value={form.type} onChange={e => { const t = eventTypes.find(x => x.value===e.target.value); setForm({...form, type: e.target.value, color: t?.color}); }}>
                {eventTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-indigo-600">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
