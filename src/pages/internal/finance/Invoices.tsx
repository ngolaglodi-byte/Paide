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

export default function Invoices() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ type: 'outgoing', date: new Date().toISOString().substring(0,10) });

  const load = async () => {
    const r = await fetch('/api/internal/finance/invoices', { headers: { Authorization: 'Bearer ' + token } });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.date || !form.amount || !form.client_supplier) { toast.error('Champs requis manquants'); return; }
    const r = await fetch('/api/internal/finance/invoices', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(form)
    });
    if (r.ok) { toast.success('Facture créée'); setDialogOpen(false); setForm({ type: 'outgoing', date: new Date().toISOString().substring(0,10) }); load(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-7 w-7 text-blue-600" />Factures</h1>
          <p className="text-sm text-gray-500">Gestion des factures entrantes et sortantes</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-blue-600"><Plus className="h-4 w-4 mr-1" />Nouvelle facture</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow><TableHead>N°</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Client/Fournisseur</TableHead><TableHead>Montant HT</TableHead><TableHead>TVA</TableHead><TableHead>Total</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={8} className="text-center">Chargement...</TableCell></TableRow> :
               items.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center text-gray-400">Aucune facture</TableCell></TableRow> :
               items.map(i => (
                <TableRow key={i.id}>
                  <TableCell className="font-mono text-xs">{i.invoice_number}</TableCell>
                  <TableCell>{new Date(i.date).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell><Badge className={i.type === 'outgoing' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>{i.type === 'outgoing' ? 'Sortante' : 'Entrante'}</Badge></TableCell>
                  <TableCell>{i.client_supplier}</TableCell>
                  <TableCell>{(i.amount || 0).toLocaleString('fr-FR')}</TableCell>
                  <TableCell>{(i.tax || 0).toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="font-semibold">{(i.total || 0).toLocaleString('fr-FR')} FC</TableCell>
                  <TableCell><Badge className={i.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}>{i.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvelle facture</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <select className="p-2 border rounded" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                <option value="outgoing">Sortante (vente)</option>
                <option value="incoming">Entrante (achat)</option>
              </select>
              <Input type="date" value={form.date||''} onChange={e => setForm({...form, date: e.target.value})} />
            </div>
            <Input placeholder="N° Facture (auto si vide)" value={form.invoice_number||''} onChange={e => setForm({...form, invoice_number: e.target.value})} />
            <Input placeholder="Client / Fournisseur *" value={form.client_supplier||''} onChange={e => setForm({...form, client_supplier: e.target.value})} />
            <textarea className="w-full p-2 border rounded" rows={2} placeholder="Description" value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Montant HT (FC) *" value={form.amount||''} onChange={e => setForm({...form, amount: parseInt(e.target.value) || 0})} />
              <Input type="number" placeholder="TVA (FC)" value={form.tax||''} onChange={e => setForm({...form, tax: parseInt(e.target.value) || 0})} />
            </div>
            <Input type="date" placeholder="Échéance" value={form.due_date||''} onChange={e => setForm({...form, due_date: e.target.value})} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-blue-600">Créer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
