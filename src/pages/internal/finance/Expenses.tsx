import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { FileText, Plus } from 'lucide-react';
import { toast } from 'sonner';

const statusColors: Record<string,string> = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
};

export default function Expenses() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ date: new Date().toISOString().substring(0,10) });

  const load = async () => {
    const r = await fetch('/api/internal/finance/expenses', { headers: { Authorization: 'Bearer ' + token } });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.date || !form.amount) { toast.error('Date et montant requis'); return; }
    const r = await fetch('/api/internal/finance/expenses', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(form)
    });
    if (r.ok) { toast.success('Dépense enregistrée'); setDialogOpen(false); setForm({ date: new Date().toISOString().substring(0,10) }); load(); }
  };

  const totalApproved = items.filter(i => i.status === 'approved').reduce((s, i) => s + (i.amount || 0), 0);
  const totalPending = items.filter(i => i.status === 'pending').reduce((s, i) => s + (i.amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-7 w-7 text-rose-600" />Dépenses</h1>
          <p className="text-sm text-gray-500">Journal des dépenses</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-rose-600"><Plus className="h-4 w-4 mr-1" />Nouvelle dépense</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="text-sm text-gray-500">Total</div><div className="text-2xl font-bold">{items.length}</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="text-sm text-gray-500">Approuvées</div><div className="text-2xl font-bold text-green-600">{totalApproved.toLocaleString('fr-FR')} FC</div></CardContent></Card>
        <Card className="border-0 shadow-sm"><CardContent className="p-5"><div className="text-sm text-gray-500">En attente</div><div className="text-2xl font-bold text-amber-600">{totalPending.toLocaleString('fr-FR')} FC</div></CardContent></Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Catégorie</TableHead><TableHead>Description</TableHead><TableHead>Fournisseur</TableHead><TableHead>Montant</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center">Chargement...</TableCell></TableRow> :
               items.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-gray-400">Aucune dépense</TableCell></TableRow> :
               items.map(e => (
                <TableRow key={e.id}>
                  <TableCell>{new Date(e.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{e.category || '-'}</TableCell>
                  <TableCell>{e.description || '-'}</TableCell>
                  <TableCell>{e.supplier || '-'}</TableCell>
                  <TableCell className="font-semibold">{(e.amount || 0).toLocaleString('fr-FR')} FC</TableCell>
                  <TableCell><Badge className={statusColors[e.status] + ' border-0'}>{e.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle dépense</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={form.date||''} onChange={e => setForm({...form, date: e.target.value})} />
              <Input placeholder="Catégorie" value={form.category||''} onChange={e => setForm({...form, category: e.target.value})} />
            </div>
            <textarea className="w-full p-2 border rounded" rows={2} placeholder="Description" value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} />
            <Input placeholder="Fournisseur" value={form.supplier||''} onChange={e => setForm({...form, supplier: e.target.value})} />
            <Input type="number" placeholder="Montant (FC) *" value={form.amount||''} onChange={e => setForm({...form, amount: parseInt(e.target.value) || 0})} />
            <select className="w-full p-2 border rounded" value={form.payment_method||''} onChange={e => setForm({...form, payment_method: e.target.value})}>
              <option value="">-- Mode de paiement --</option>
              <option value="cash">Espèces</option>
              <option value="bank">Virement bancaire</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="check">Chèque</option>
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-rose-600">Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
