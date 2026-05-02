import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, BookOpen } from 'lucide-react';
import { toast } from 'sonner';

export default function HRTrainings() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => { fetch('/api/internal/hr/trainings', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []).then(d => { setItems(d); setLoading(false); }); }, []);

  const save = async () => {
    const res = await fetch('/api/internal/hr/trainings', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { toast.success(data.message); setDialogOpen(false); setForm({}); const r = await fetch('/api/internal/hr/trainings', { headers: { Authorization: 'Bearer ' + token } }); if (r.ok) setItems(await r.json()); }
    else toast.error(data.message);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold flex items-center gap-2"><BookOpen className="h-6 w-6 text-blue-500" />Formations internes</h1></div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle formation</Button>
      </div>
      <Card><CardContent className="pt-6">
        <Table><TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Formateur</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
          <TableBody>{loading ? <TableRow><TableCell colSpan={5} className="text-center">Chargement...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-gray-400">Aucune formation</TableCell></TableRow> : items.map(i => <TableRow key={i.id}><TableCell>{i.title}</TableCell><TableCell>{i.trainer || '-'}</TableCell><TableCell>{i.start_date || '-'}</TableCell><TableCell>{i.end_date || '-'}</TableCell><TableCell><Badge>{i.status}</Badge></TableCell></TableRow>)}</TableBody>
        </Table>
      </CardContent></Card>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>Nouvelle formation</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Titre *" value={form.title||''} onChange={e => setForm({...form, title: e.target.value})} />
          <Input placeholder="Formateur" value={form.trainer||''} onChange={e => setForm({...form, trainer: e.target.value})} />
          <Input placeholder="Lieu" value={form.location||''} onChange={e => setForm({...form, location: e.target.value})} />
          <Input type="date" placeholder="Début" value={form.start_date||''} onChange={e => setForm({...form, start_date: e.target.value})} />
          <Input type="date" placeholder="Fin" value={form.end_date||''} onChange={e => setForm({...form, end_date: e.target.value})} />
          <textarea className="w-full p-2 border rounded" rows={3} placeholder="Description" value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} />
        </div>
        <DialogFooter><Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button><Button onClick={save}>Soumettre</Button></DialogFooter>
      </DialogContent></Dialog>
    </div>
  );
}
