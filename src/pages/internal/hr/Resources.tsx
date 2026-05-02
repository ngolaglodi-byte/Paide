import { useState, useEffect } from 'react';
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
                  {r.category && <Badge className={`${categoryColors[r.category] || 'bg-gray-100 text-gray-700'} border-0`}>{r.category}</Badge>}
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
