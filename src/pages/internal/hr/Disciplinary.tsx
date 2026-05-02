import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Shield } from 'lucide-react';
import { toast } from 'sonner';

export default function HRDisciplinary() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch('/api/internal/hr/disciplinary', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []).then(d => { setItems(d); setLoading(false); });
    fetch('/api/internal/hr/personnel', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []).then(setPersonnel);
  }, []);

  const save = async () => {
    try {
      const res = await fetch('/api/internal/hr/disciplinary', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Créé avec succès');
        setDialogOpen(false); setForm({});
        const r = await fetch('/api/internal/hr/disciplinary', { headers: { Authorization: 'Bearer ' + token } });
        if (r.ok) setItems(await r.json());
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-blue-500" />Disciplinaire</h1>
          <p className="text-sm text-gray-500">Créations soumises à l'approbation du responsable</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouveau</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Agent</TableHead><TableHead>Type</TableHead><TableHead>Sévérité</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center">Chargement...</TableCell></TableRow> :
               items.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-gray-400">Aucune donnée</TableCell></TableRow> :
               items.map(i => (
                <TableRow key={i.id}>
                  <TableCell>{i.personnel_name || '-'}</TableCell><TableCell>{i.type || '-'}</TableCell><TableCell>{i.severity || '-'}</TableCell><TableCell>{i.date || '-'}</TableCell>
                  <TableCell><Badge>{i.status || 'pending'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau — Disciplinaire</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select className="w-full p-2 border rounded" value={form.personnel_id||''} onChange={e => setForm({...form, personnel_id: parseInt(e.target.value)})}>
              <option value="">-- Sélectionner un agent --</option>
              {personnel.map(p => <option key={p.id} value={p.id}>{p.name} {p.postnom || ''} ({p.matricule || '-'})</option>)}
            </select>
            <select className="w-full p-2 border rounded" value={form.type||''} onChange={e => setForm({...form, type: e.target.value})}><option value="">-- Type --</option><option value="Retard répété">Retard répété</option><option value="Absence injustifiée">Absence injustifiée</option><option value="Faute professionnelle">Faute professionnelle</option><option value="Comportement">Comportement</option><option value="Autre">Autre</option></select>
            <select className="w-full p-2 border rounded" value={form.severity||''} onChange={e => setForm({...form, severity: e.target.value})}><option value="">-- Sévérité --</option><option value="warning">warning</option><option value="suspension">suspension</option><option value="dismissal">dismissal</option></select>
            <Input type="date" placeholder="Date" value={form.date||''} onChange={e => setForm({...form, date: e.target.value})} />
            <textarea className="w-full p-2 border rounded" rows={3} placeholder="Motif" value={form.reason||''} onChange={e => setForm({...form, reason: e.target.value})} />
            <textarea className="w-full p-2 border rounded" rows={3} placeholder="Décision proposée" value={form.decision||''} onChange={e => setForm({...form, decision: e.target.value})} />
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
