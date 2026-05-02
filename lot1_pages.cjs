const fs = require("fs");
const hrDir = "/app/src/pages/internal/hr";

// ═══ ORGANIGRAMME ═══
fs.writeFileSync(hrDir + "/Organigram.tsx", `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Users, ChevronDown, ChevronRight } from 'lucide-react';

const postColors: Record<string,string> = {
  'Ministre': 'bg-purple-600',
  'Coordinateur National': 'bg-indigo-600',
  'Coordinateur Provincial': 'bg-teal-600',
  'Coordinateur Sous-Provincial': 'bg-cyan-600',
  'Chef de Centre': 'bg-emerald-600',
  'Secrétaire': 'bg-blue-500',
  'Chargé de Plan': 'bg-rose-500',
  'Chargé de Formation': 'bg-orange-500',
  'Chargé de Suivi': 'bg-amber-500',
  'Intendant': 'bg-slate-500',
};

function PersonCard({ person }: { person: any }) {
  const color = postColors[person.post] || 'bg-gray-500';
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-4 min-w-[220px]">
      <div className="flex items-start gap-3">
        <div className={\`w-12 h-12 rounded-full \${color} flex items-center justify-center text-white font-bold shrink-0 shadow\`}>
          {(person.name || '?')[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">{person.name} {person.postnom || ''}</div>
          <div className="text-xs text-gray-500 truncate">{person.post}</div>
          {person.province && <Badge className="mt-1 bg-gray-100 text-gray-700 border-0 text-[10px]">{person.province}</Badge>}
        </div>
      </div>
    </div>
  );
}

export default function Organigram() {
  const { token } = useAuth();
  const [data, setData] = useState<any>({ byPost: {}, order: [] });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/internal/hr/organigram', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : { byPost: {}, order: [] })
      .then(d => { setData(d); const e: any = {}; Object.keys(d.byPost).forEach(k => e[k] = true); setExpanded(e); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Network className="h-7 w-7 text-indigo-600" />Organigramme
        </h1>
        <p className="text-sm text-gray-500">Structure hiérarchique de votre organisation</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">Chargement...</div>
      ) : Object.keys(data.byPost).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucun employé enregistré</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(data.order || []).filter((post: string) => data.byPost[post]).map((post: string) => {
            const people = data.byPost[post];
            const color = postColors[post] || 'bg-gray-500';
            const isOpen = expanded[post] !== false;
            return (
              <Card key={post} className="border-0 shadow-sm overflow-hidden">
                <button onClick={() => setExpanded({...expanded, [post]: !isOpen})} className="w-full">
                  <div className={\`\${color} text-white px-5 py-3 flex items-center justify-between\`}>
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">{post}</span>
                      <Badge className="bg-white/20 text-white border-0 text-xs">{people.length}</Badge>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <CardContent className="p-4 bg-gray-50">
                    <div className="flex flex-wrap gap-3">
                      {people.map((p: any) => <PersonCard key={p.id} person={p} />)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
`);

// ═══ AGENDA (Calendar) ═══
fs.writeFileSync(hrDir + "/Agenda.tsx", `import { useState, useEffect, useMemo } from 'react';
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
                const dateStr = \`\${currentDate.getFullYear()}-\${String(currentDate.getMonth()+1).padStart(2,'0')}-\${String(d).padStart(2,'0')}\`;
                const dayEvents = eventsByDate[dateStr] || [];
                const isToday = dateStr === new Date().toISOString().substring(0,10);
                return (
                  <div key={i} className={\`min-h-[80px] p-1.5 rounded-lg border \${isToday ? 'border-indigo-400 bg-indigo-50' : 'border-gray-100 hover:border-gray-200'} transition-colors\`}>
                    <div className={\`text-xs font-semibold \${isToday ? 'text-indigo-700' : 'text-gray-700'} mb-1\`}>{d}</div>
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
`);

// ═══ MEETINGS ═══
fs.writeFileSync(hrDir + "/Meetings.tsx", `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Video, Plus, MapPin, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function Meetings() {
  const { token } = useAuth();
  const [meetings, setMeetings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  const load = async () => {
    const res = await fetch('/api/internal/hr/meetings', { headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) setMeetings(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title || !form.start_date) { toast.error('Titre et date requis'); return; }
    const res = await fetch('/api/internal/hr/meetings', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(form)
    });
    if (res.ok) { toast.success('Réunion créée'); setDialogOpen(false); setForm({}); load(); }
    else toast.error('Erreur');
  };

  const upcoming = meetings.filter(m => new Date(m.start_date) >= new Date());
  const past = meetings.filter(m => new Date(m.start_date) < new Date());

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Video className="h-7 w-7 text-indigo-600" />Réunions</h1>
          <p className="text-sm text-gray-500">Planification et compte-rendus de réunions</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-1" />Nouvelle réunion</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="text-sm text-gray-500">Total</div><div className="text-2xl font-bold">{meetings.length}</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="text-sm text-gray-500">À venir</div><div className="text-2xl font-bold text-blue-600">{upcoming.length}</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-4"><div className="text-sm text-gray-500">Passées</div><div className="text-2xl font-bold text-gray-500">{past.length}</div></CardContent></Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Réunions à venir</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="py-8 text-center text-gray-400">Chargement...</div> :
           upcoming.length === 0 ? <div className="py-8 text-center text-gray-400">Aucune réunion planifiée</div> :
           <div className="space-y-2">
             {upcoming.map(m => (
               <div key={m.id} className="flex gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
                 <div className="w-14 text-center">
                   <div className="text-xs text-gray-500 uppercase">{new Date(m.start_date).toLocaleDateString('fr-FR',{month:'short'})}</div>
                   <div className="text-2xl font-bold text-indigo-600">{new Date(m.start_date).getDate()}</div>
                 </div>
                 <div className="flex-1">
                   <div className="font-semibold">{m.title}</div>
                   <div className="text-sm text-gray-600 mt-1">{m.description}</div>
                   <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                     <div className="flex items-center gap-1"><Calendar className="h-3 w-3" />{new Date(m.start_date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}</div>
                     {m.location && <div className="flex items-center gap-1"><MapPin className="h-3 w-3" />{m.location}</div>}
                   </div>
                 </div>
                 <Badge className="bg-blue-100 text-blue-700 border-0 self-start">{m.status || 'scheduled'}</Badge>
               </div>
             ))}
           </div>
          }
        </CardContent>
      </Card>

      {past.length > 0 && (
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Réunions passées</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {past.slice(0, 5).map(m => (
                <div key={m.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50">
                  <div className="text-xs text-gray-500 w-20">{new Date(m.start_date).toLocaleDateString('fr-FR')}</div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.title}</div>
                    {m.location && <div className="text-xs text-gray-500">{m.location}</div>}
                  </div>
                  <Badge className="bg-gray-100 text-gray-600 border-0">Passée</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle réunion</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Titre *" value={form.title||''} onChange={e => setForm({...form, title: e.target.value})} />
            <textarea className="w-full p-2 border rounded" rows={2} placeholder="Description" value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} />
            <Input type="datetime-local" placeholder="Date/heure" value={form.start_date||''} onChange={e => setForm({...form, start_date: e.target.value})} />
            <Input placeholder="Lieu" value={form.location||''} onChange={e => setForm({...form, location: e.target.value})} />
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
`);

// ═══ RESOURCES ═══
fs.writeFileSync(hrDir + "/Resources.tsx", `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Library, Plus, Search, FileText, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

const categoryColors: Record<string,string> = {
  'Politique': 'bg-purple-100 text-purple-700',
  'Procédure': 'bg-blue-100 text-blue-700',
  'Modèle': 'bg-green-100 text-green-700',
  'Guide': 'bg-amber-100 text-amber-700',
  'Formulaire': 'bg-pink-100 text-pink-700',
  'Règlement': 'bg-red-100 text-red-700',
};

export default function Resources() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ category: 'Politique' });

  const load = async () => {
    const res = await fetch('/api/internal/hr/resources', { headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.title) { toast.error('Titre requis'); return; }
    const res = await fetch('/api/internal/hr/resources', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(form)
    });
    if (res.ok) { toast.success('Ressource ajoutée'); setDialogOpen(false); setForm({ category: 'Politique' }); load(); }
    else toast.error('Erreur');
  };

  const filtered = items.filter(i =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase()) ||
    i.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Library className="h-7 w-7 text-indigo-600" />Ressources</h1>
          <p className="text-sm text-gray-500">Documents, politiques, modèles et guides RH</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-1" />Nouvelle ressource</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-16 text-gray-400">Chargement...</div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed"><CardContent className="py-16 text-center text-gray-400">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>Aucune ressource</p>
        </CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(r => (
            <Card key={r.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-indigo-600" />
                  </div>
                  {r.category && <Badge className={\`\${categoryColors[r.category] || 'bg-gray-100 text-gray-700'} border-0\`}>{r.category}</Badge>}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{r.title}</h3>
                {r.description && <p className="text-sm text-gray-500 line-clamp-2 mb-3">{r.description}</p>}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-400">{new Date(r.created_at).toLocaleDateString('fr-FR')}</div>
                  {r.file_url && (
                    <a href={r.file_url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1">
                      Ouvrir <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle ressource</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Titre *" value={form.title||''} onChange={e => setForm({...form, title: e.target.value})} />
            <select className="w-full p-2 border rounded" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {Object.keys(categoryColors).map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <textarea className="w-full p-2 border rounded" rows={3} placeholder="Description" value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} />
            <Input placeholder="URL du fichier (optionnel)" value={form.file_url||''} onChange={e => setForm({...form, file_url: e.target.value})} />
            <Input placeholder="Tags (séparés par virgules)" value={form.tags||''} onChange={e => setForm({...form, tags: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-indigo-600">Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`);

console.log("4 pages created: Organigram, Agenda, Meetings, Resources");

// ═══ Add routes to App.tsx ═══
let app = fs.readFileSync("/app/src/App.tsx", "utf8");

if (!app.includes("HROrganigram")) {
  app = app.replace(
    "import HRApprovals from '@/pages/internal/hr/Approvals';",
    `import HRApprovals from '@/pages/internal/hr/Approvals';
import HROrganigram from '@/pages/internal/hr/Organigram';
import HRAgenda from '@/pages/internal/hr/Agenda';
import HRMeetings from '@/pages/internal/hr/Meetings';
import HRResources from '@/pages/internal/hr/Resources';`
  );

  const closingRoutes = app.lastIndexOf("</Routes>");
  const newRoutes = `        <Route path="/internal/hr/organigram" element={<ProtectedRoute><InternalLayout><HROrganigram /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/agenda" element={<ProtectedRoute><InternalLayout><HRAgenda /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/meetings" element={<ProtectedRoute><InternalLayout><HRMeetings /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/hr/resources" element={<ProtectedRoute><InternalLayout><HRResources /></InternalLayout></ProtectedRoute>} />
`;
  app = app.substring(0, closingRoutes) + newRoutes + "        " + app.substring(closingRoutes);
  fs.writeFileSync("/app/src/App.tsx", app);
  console.log("Routes added to App.tsx");
} else {
  console.log("Routes already in App.tsx");
}

console.log("\nLot 1 pages DONE");
