import { useState, useEffect } from 'react';
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
