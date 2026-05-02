const fs = require("fs");
const finDir = "/app/src/pages/internal/finance";
if (!fs.existsSync(finDir)) fs.mkdirSync(finDir, { recursive: true });

// Budget
fs.writeFileSync(finDir + "/Budget.tsx", `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Target, Plus, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

export default function Budget() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ year: new Date().getFullYear() });

  const load = async () => {
    const r = await fetch('/api/internal/finance/budget', { headers: { Authorization: 'Bearer ' + token } });
    if (r.ok) setItems(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.category || !form.allocated) { toast.error('Catégorie et montant requis'); return; }
    const r = await fetch('/api/internal/finance/budget', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(form)
    });
    if (r.ok) { toast.success('Budget créé'); setDialogOpen(false); setForm({ year: new Date().getFullYear() }); load(); }
  };

  const totalAllocated = items.reduce((s, i) => s + (i.allocated || 0), 0);
  const totalSpent = items.reduce((s, i) => s + (i.spent || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Target className="h-7 w-7 text-indigo-600" />Budget</h1>
          <p className="text-sm text-gray-500">Planification et allocation des budgets</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600"><Plus className="h-4 w-4 mr-1" />Nouveau budget</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="text-sm opacity-90">Budget Alloué</div>
            <div className="text-3xl font-bold mt-2">{totalAllocated.toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white">
          <CardContent className="p-6">
            <div className="text-sm opacity-90">Dépensé</div>
            <div className="text-3xl font-bold mt-2">{totalSpent.toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-6">
            <div className="text-sm opacity-90">Reste</div>
            <div className="text-3xl font-bold mt-2">{(totalAllocated - totalSpent).toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader><CardTitle className="text-base">Lignes budgétaires</CardTitle></CardHeader>
        <CardContent>
          {loading ? <div className="py-8 text-center text-gray-400">Chargement...</div> :
           items.length === 0 ? <div className="py-8 text-center text-gray-400">Aucune ligne budgétaire</div> :
           <div className="space-y-3">
             {items.map(b => {
               const pct = b.allocated > 0 ? Math.round((b.spent / b.allocated) * 100) : 0;
               return (
                 <div key={b.id} className="p-4 rounded-lg bg-gray-50 border border-gray-100">
                   <div className="flex items-start justify-between mb-2">
                     <div>
                       <div className="font-semibold">{b.category}</div>
                       <div className="text-xs text-gray-500">{b.description || 'Aucune description'} · {b.year}{b.month ? '/' + b.month : ''}</div>
                     </div>
                     <Badge className={pct > 90 ? 'bg-red-100 text-red-700' : pct > 70 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}>{pct}%</Badge>
                   </div>
                   <div className="flex items-center justify-between text-sm mb-1">
                     <span>{(b.spent || 0).toLocaleString('fr-FR')} FC</span>
                     <span className="text-gray-500">/ {(b.allocated || 0).toLocaleString('fr-FR')} FC</span>
                   </div>
                   <Progress value={pct} className="h-2" />
                 </div>
               );
             })}
           </div>}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau budget</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Catégorie *" value={form.category||''} onChange={e => setForm({...form, category: e.target.value})} />
            <textarea className="w-full p-2 border rounded" rows={2} placeholder="Description" value={form.description||''} onChange={e => setForm({...form, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" placeholder="Année" value={form.year||''} onChange={e => setForm({...form, year: parseInt(e.target.value)})} />
              <Input type="number" placeholder="Mois (1-12, optionnel)" value={form.month||''} onChange={e => setForm({...form, month: parseInt(e.target.value) || null})} />
            </div>
            <Input type="number" placeholder="Montant alloué (FC) *" value={form.allocated||''} onChange={e => setForm({...form, allocated: parseInt(e.target.value)})} />
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

// Expenses
fs.writeFileSync(finDir + "/Expenses.tsx", `import { useState, useEffect } from 'react';
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
`);

// Invoices
fs.writeFileSync(finDir + "/Invoices.tsx", `import { useState, useEffect } from 'react';
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
`);

// Reports
fs.writeFileSync(finDir + "/Reports.tsx", `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, DollarSign, TrendingUp, AlertCircle, FileText } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

export default function FinanceReports() {
  const { token } = useAuth();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/internal/finance/reports', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : {})
      .then(d => { setData(d); setLoading(false); });
  }, []);

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-7 w-7 text-indigo-600" />Rapports financiers</h1>
        <p className="text-sm text-gray-500">Synthèse et analyse financière</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-5">
            <DollarSign className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">Budget total</div>
            <div className="text-2xl font-bold mt-1">{(data.totalBudget || 0).toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white">
          <CardContent className="p-5">
            <TrendingUp className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">Dépensé</div>
            <div className="text-2xl font-bold mt-1">{(data.totalSpent || 0).toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-5">
            <DollarSign className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">Reste</div>
            <div className="text-2xl font-bold mt-1">{(data.remaining || 0).toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-5">
            <AlertCircle className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">À traiter</div>
            <div className="text-2xl font-bold mt-1">{(data.pendingExpenses || 0) + (data.unpaidInvoices || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Dépenses par catégorie</CardTitle></CardHeader>
          <CardContent>
            {(data.byCategory || []).length === 0 ? <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div> :
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="total" label={({ category }) => category}>
                  {data.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => v.toLocaleString('fr-FR') + ' FC'} />
              </PieChart>
            </ResponsiveContainer>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Évolution mensuelle</CardTitle></CardHeader>
          <CardContent>
            {(data.monthlyExpenses || []).length === 0 ? <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div> :
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => v.toLocaleString('fr-FR') + ' FC'} />
                <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
`);

console.log("4 Finance pages created");

// Add routes to App.tsx
let app = fs.readFileSync("/app/src/App.tsx", "utf8");
if (!app.includes("FinanceBudget")) {
  app = app.replace(
    "import HRResources from '@/pages/internal/hr/Resources';",
    `import HRResources from '@/pages/internal/hr/Resources';
import FinanceBudget from '@/pages/internal/finance/Budget';
import FinanceExpenses from '@/pages/internal/finance/Expenses';
import FinanceInvoices from '@/pages/internal/finance/Invoices';
import FinanceReports from '@/pages/internal/finance/Reports';`
  );
  const closingRoutes = app.lastIndexOf("</Routes>");
  const newRoutes = `        <Route path="/internal/finance/budget" element={<ProtectedRoute><InternalLayout><FinanceBudget /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/finance/expenses" element={<ProtectedRoute><InternalLayout><FinanceExpenses /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/finance/invoices" element={<ProtectedRoute><InternalLayout><FinanceInvoices /></InternalLayout></ProtectedRoute>} />
        <Route path="/internal/finance/reports" element={<ProtectedRoute><InternalLayout><FinanceReports /></InternalLayout></ProtectedRoute>} />
`;
  app = app.substring(0, closingRoutes) + newRoutes + "        " + app.substring(closingRoutes);
  fs.writeFileSync("/app/src/App.tsx", app);
  console.log("Routes added to App.tsx");
}

console.log("\nLot 1b pages DONE");
