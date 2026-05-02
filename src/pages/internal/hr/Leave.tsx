import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function HRLeave() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch('/api/internal/hr/leave', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []).then(d => { setItems(d); setLoading(false); });
    fetch('/api/internal/hr/personnel', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []).then(setPersonnel);
  }, []);

  const save = async () => {
    try {
      const res = await fetch('/api/internal/hr/leave', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Créé avec succès');
        setDialogOpen(false); setForm({});
        const r = await fetch('/api/internal/hr/leave', { headers: { Authorization: 'Bearer ' + token } });
        if (r.ok) setItems(await r.json());
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calendar className="h-6 w-6 text-blue-500" />Congés</h1>
          <p className="text-sm text-gray-500">Créations soumises à l'approbation du responsable</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouveau</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Type</TableHead><TableHead>Début</TableHead><TableHead>Fin</TableHead><TableHead>Jours</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center">Chargement...</TableCell></TableRow> :
               items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-gray-400">Aucune donnée</TableCell></TableRow> :
               items.map(i => (
                <TableRow key={i.id}>
                  <TableCell>{i.personnel_name || '-'}</TableCell><TableCell>{i.type || '-'}</TableCell><TableCell>{i.start_date || '-'}</TableCell><TableCell>{i.end_date || '-'}</TableCell><TableCell>{i.days || '-'}</TableCell>
                  <TableCell><Badge>{i.status || 'pending'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau — Congés</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select className="w-full p-2 border rounded" value={form.personnel_id||''} onChange={e => setForm({...form, personnel_id: parseInt(e.target.value)})}>
              <option value="">-- Sélectionner un agent --</option>
              {personnel.map(p => <option key={p.id} value={p.id}>{p.name} {p.postnom || ''} ({p.matricule || '-'})</option>)}
            </select>
            <select className="w-full p-2 border rounded" value={form.type||''} onChange={e => setForm({...form, type: e.target.value})}><option value="">-- Type --</option><option value="annuel">annuel</option><option value="maladie">maladie</option><option value="maternité">maternité</option><option value="exceptionnel">exceptionnel</option></select>
            <Input type="date" placeholder="Date de début" value={form.start_date||''} onChange={e => setForm({...form, start_date: e.target.value})} />
            <Input type="date" placeholder="Date de fin" value={form.end_date||''} onChange={e => setForm({...form, end_date: e.target.value})} />
            <Input type="number" placeholder="Nombre de jours" value={form.days||''} onChange={e => setForm({...form, days: parseInt(e.target.value) || 0})} />
            <textarea className="w-full p-2 border rounded" rows={3} placeholder="Motif" value={form.reason||''} onChange={e => setForm({...form, reason: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save}>Soumettre pour approbation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
