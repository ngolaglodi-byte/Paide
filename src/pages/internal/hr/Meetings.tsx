import { useState, useEffect } from 'react';
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
