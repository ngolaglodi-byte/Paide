import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Search, UserCheck, Key, Upload, FileText, Image, Camera, CheckCircle, X } from 'lucide-react';
import { toast } from 'sonner';

// Postes officiels par niveau (sans "Secrétaire" — un Secrétaire ne peut pas en créer un autre)
// Posts are now fetched dynamically from /api/internal/hr/creatable-posts

// Postes qui ont par défaut un accès système
const POSTS_WITH_ACCESS = new Set([
  'Ministre', 'Directeur de Cabinet du Ministre', 'Secrétaire Général', 'Finance', 'Plan', 'Formation',
  'Coordonateur', 'Coordonateur Adjoint',
  'Chef de Centre', 'Chef de Centre Adjoint', 'Chargé des Opérations', 'Intendant', 'Disciplinaire'
]);

function FileUpload({ label, value, onChange, icon: Icon, accept, required }: any) {
  const { token } = useAuth();
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Fichier trop volumineux (max 5MB)'); return; }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/internal/hr/personnel/upload', {
        method: 'POST',
        headers: { Authorization: 'Bearer ' + token },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        onChange(data.url);
        toast.success(label + ' uploadé');
      } else toast.error('Erreur upload');
    } catch { toast.error('Erreur'); }
    finally { setUploading(false); }
  };

  return (
    <div className="border-2 border-dashed border-gray-200 rounded-lg p-3 hover:border-indigo-300 transition-colors">
      <label className="flex items-center justify-between cursor-pointer">
        <div className="flex items-center gap-3 flex-1">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${value ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
            {value ? <CheckCircle className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-gray-700">{label}{required && <span className="text-red-500 ml-1">*</span>}</div>
            <div className="text-xs text-gray-400">
              {value ? 'Fichier uploadé' : uploading ? 'Upload en cours...' : 'Cliquer pour uploader (max 5MB)'}
            </div>
          </div>
        </div>
        {value && (
          <Button type="button" size="sm" variant="ghost" className="text-red-600" onClick={(e: any) => { e.preventDefault(); onChange(''); }}>
            <X className="h-4 w-4" />
          </Button>
        )}
        <input type="file" accept={accept} onChange={handleUpload} className="hidden" />
      </label>
      {value && (
        <a href={value} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline ml-13 inline-block mt-1">
          Voir le fichier
        </a>
      )}
    </div>
  );
}

export default function HRPersonnel() {
  const { user, token } = useAuth();
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ status: 'active', create_access: false, post_type: 'select' });
  const [credentialsDialog, setCredentialsDialog] = useState<any>(null);

  const [creatablePosts, setCreatablePosts] = useState<any>({ allowCustom: true });
  
  useEffect(() => {
    fetch('/api/internal/hr/creatable-posts', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : {})
      .then(setCreatablePosts);
  }, []);
  
  // Flatten posts with level labels for the dropdown
  const availablePostsGrouped = useMemo(() => {
    const levelLabels: Record<string,string> = {
      ministere: 'Ministère', national: 'National',
      provincial: 'Provincial', sous_provincial: 'Sous-Provincial', centre: 'Centre'
    };
    const groups: { level: string, label: string, posts: string[] }[] = [];
    ['ministere','national','provincial','sous_provincial','centre'].forEach(lvl => {
      if (creatablePosts[lvl] && creatablePosts[lvl].length > 0) {
        groups.push({ level: lvl, label: levelLabels[lvl], posts: creatablePosts[lvl] });
      }
    });
    return groups;
  }, [creatablePosts]);
  
  const availablePosts: string[] = [];
  availablePostsGrouped.forEach(g => g.posts.forEach(p => availablePosts.push(p)));

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/internal/hr/personnel', { headers: { Authorization: 'Bearer ' + token } });
      if (res.ok) setPersonnel(await res.json());
    } finally { setLoading(false); }
  };

  // Auto-toggle access based on post
  useEffect(() => {
    if (form.post && POSTS_WITH_ACCESS.has(form.post) && form.post_type === 'select') {
      setForm((f: any) => ({ ...f, create_access: true }));
    }
  }, [form.post]);

  const handlePostChange = (value: string) => {
    if (value === '_autre_') {
      setForm({ ...form, post_type: 'custom', post: '', create_access: false });
    } else if (value && value.includes('__')) {
      const [post, level] = value.split('__');
      setForm({ ...form, post_type: 'select', post, target_level: level });
    } else {
      setForm({ ...form, post_type: 'select', post: value });
    }
  };

  const save = async () => {
    if (!form.name || !form.post) { toast.error('Nom et poste requis'); return; }
    if (!form.photo_url) { toast.error('Photo d\'identité requise'); return; }
    if (!form.id_card_url) { toast.error('Carte d\'identité requise'); return; }
    if (!form.diploma1_url) { toast.error('Au moins un diplôme requis'); return; }

    try {
      const res = await fetch('/api/internal/hr/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        // Update with documents
        if (data.id) {
          await fetch('/api/internal/hr/personnel/' + data.id + '/documents', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
            body: JSON.stringify({
              photo_url: form.photo_url,
              id_card_url: form.id_card_url,
              diploma1_url: form.diploma1_url,
              diploma2_url: form.diploma2_url || null,
              diploma3_url: form.diploma3_url || null
            })
          });
        }
        toast.success(data.message || 'Agent créé');
        setDialogOpen(false);
        setForm({ status: 'active', create_access: false, post_type: 'select' });
        if (data.access) setCredentialsDialog(data.access);
        load();
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur de connexion'); }
  };

  const filtered = personnel.filter(p =>
    !search || (p.name || '').toLowerCase().includes(search.toLowerCase()) || (p.matricule || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="h-7 w-7 text-indigo-600" />Personnel</h1>
          <p className="text-sm text-gray-500">Gestion des employés de votre {user?.level === 'centre' ? 'centre' : user?.level === 'ministere' ? 'ministère' : 'niveau'}</p>
        </div>
        <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600"><Plus className="h-4 w-4 mr-1" />Nouvel agent</Button>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input placeholder="Rechercher par nom ou matricule..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Matricule</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Docs</TableHead>
              <TableHead>Accès</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center">Chargement...</TableCell></TableRow> :
               filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-gray-400 py-8">Aucun agent</TableCell></TableRow> :
               filtered.map(p => {
                 const docsCount = [p.photo_url, p.id_card_url, p.diploma1_url, p.diploma2_url, p.diploma3_url].filter(Boolean).length;
                 return (
                   <TableRow key={p.id}>
                     <TableCell className="font-mono text-sm">{p.matricule || '-'}</TableCell>
                     <TableCell>
                       <div className="flex items-center gap-2">
                         {p.photo_url ? (
                           <img src={p.photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                         ) : (
                           <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs">{(p.name || '?')[0]}</div>
                         )}
                         <span>{p.name} {p.postnom || ''}</span>
                       </div>
                     </TableCell>
                     <TableCell>{p.post}</TableCell>
                     <TableCell><Badge variant={docsCount >= 3 ? 'default' : 'outline'}>{docsCount}/5</Badge></TableCell>
                     <TableCell>{p.user_id ? <Badge className="bg-blue-100 text-blue-800"><Key className="h-3 w-3 mr-1" />Oui</Badge> : <Badge variant="outline">Non</Badge>}</TableCell>
                     <TableCell><Badge className={p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>{p.status}</Badge></TableCell>
                   </TableRow>
                 );
               })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvel Agent</DialogTitle></DialogHeader>

          <div className="space-y-5">
            {/* Section Identité */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                <UserCheck className="h-4 w-4 text-indigo-600" />Identité
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Matricule" value={form.matricule||''} onChange={e => setForm({...form, matricule: e.target.value})} />
                <div>
                  {form.post_type === 'custom' ? (
                    <div className="flex gap-2">
                      <Input placeholder="Poste personnalisé *" value={form.post||''} onChange={e => setForm({...form, post: e.target.value})} />
                      <Button type="button" size="sm" variant="outline" onClick={() => setForm({...form, post_type: 'select', post: ''})}>×</Button>
                    </div>
                  ) : (
                    <select className="w-full p-2 border rounded" value={form.post||''} onChange={e => handlePostChange(e.target.value)}>
                      <option value="">-- Sélectionner un poste * --</option>
                      {availablePostsGrouped.map(g => (
                        <optgroup key={g.level} label={g.label}>
                          {g.posts.map(p => <option key={g.level+'_'+p} value={p+'__'+g.level}>{p}</option>)}
                        </optgroup>
                      ))}
                      {creatablePosts.allowCustom && <option value="_autre_">✏️ Autre (saisir manuellement)</option>}
                    </select>
                  )}
                </div>
                <Input placeholder="Nom *" value={form.name||''} onChange={e => setForm({...form, name: e.target.value})} />
                <Input placeholder="Postnom" value={form.postnom||''} onChange={e => setForm({...form, postnom: e.target.value})} />
                <Input placeholder="Prénom" value={form.prenom||''} onChange={e => setForm({...form, prenom: e.target.value})} />
                <select className="w-full p-2 border rounded" value={form.gender||''} onChange={e => setForm({...form, gender: e.target.value})}>
                  <option value="">-- Sexe --</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                <Input type="date" placeholder="Date de naissance" value={form.birth_date||''} onChange={e => setForm({...form, birth_date: e.target.value})} />
                <Input placeholder="Nationalité" value={form.nationality||'Congolaise'} onChange={e => setForm({...form, nationality: e.target.value})} />
              </div>
            </div>

            {/* Section Contact */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">Contact</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Téléphone" value={form.phone||''} onChange={e => setForm({...form, phone: e.target.value})} />
                <Input type="email" placeholder="Email personnel" value={form.email||''} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div className="mt-3 space-y-2">
                <textarea className="w-full p-2 border rounded" rows={2} placeholder="Adresse complète (libre)" value={form.address||''} onChange={e => setForm({...form, address: e.target.value})} />
                <div className="grid grid-cols-3 gap-2">
                  <Input placeholder="Rue / Avenue / N°" value={form.address_street||''} onChange={e => setForm({...form, address_street: e.target.value})} />
                  <Input placeholder="Commune / Quartier" value={form.address_commune||''} onChange={e => setForm({...form, address_commune: e.target.value})} />
                  <Input placeholder="Ville" value={form.address_city||''} onChange={e => setForm({...form, address_city: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Section Professionnel */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">Information professionnelle</h3>
              <div className="grid grid-cols-2 gap-3">
                <Input type="date" placeholder="Date d'embauche" value={form.hire_date||''} onChange={e => setForm({...form, hire_date: e.target.value})} />
                
              </div>
            </div>

            {/* Section Documents */}
            <div>
              <h3 className="font-semibold text-sm text-gray-700 mb-3 flex items-center gap-2 border-b pb-2">
                <FileText className="h-4 w-4 text-indigo-600" />Documents
              </h3>
              <div className="space-y-2">
                <FileUpload label="Photo d'identité (format passeport)" value={form.photo_url} onChange={(url: string) => setForm({...form, photo_url: url})} icon={Camera} accept="image/*" required />
                <FileUpload label="Carte d'identité (recto/verso)" value={form.id_card_url} onChange={(url: string) => setForm({...form, id_card_url: url})} icon={Image} accept="image/*,.pdf" required />
                <FileUpload label="Diplôme 1" value={form.diploma1_url} onChange={(url: string) => setForm({...form, diploma1_url: url})} icon={FileText} accept="image/*,.pdf" required />
                <FileUpload label="Diplôme 2 (optionnel)" value={form.diploma2_url} onChange={(url: string) => setForm({...form, diploma2_url: url})} icon={FileText} accept="image/*,.pdf" />
                <FileUpload label="Diplôme 3 (optionnel)" value={form.diploma3_url} onChange={(url: string) => setForm({...form, diploma3_url: url})} icon={FileText} accept="image/*,.pdf" />
              </div>
            </div>

            {/* Section Accès système */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="create_access" checked={form.create_access||false} onChange={e => setForm({...form, create_access: e.target.checked})} className="h-4 w-4" />
                <label htmlFor="create_access" className="font-semibold text-blue-900 flex items-center gap-2">
                  <Key className="h-4 w-4" />Donner un accès au système
                </label>
              </div>
              {form.create_access && (
                <div className="mt-3 text-sm text-blue-800">
                  Un compte sera créé automatiquement.<br />
                  Email : <code>prenom.nom@paide.cd</code><br />
                  Mot de passe temporaire : <code>PAIDE-XXXXXX</code> (à changer à la première connexion)
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save} className="bg-indigo-600">Soumettre pour approbation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!credentialsDialog} onOpenChange={() => setCredentialsDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Key className="h-5 w-5 text-green-600" />Compte créé</DialogTitle></DialogHeader>
          {credentialsDialog && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                <p className="text-sm text-green-800 mb-3">{credentialsDialog.message}</p>
                <div className="space-y-2 font-mono text-sm">
                  <div><strong>Email :</strong> <span className="bg-white px-2 py-1 rounded">{credentialsDialog.email}</span></div>
                  <div><strong>Mot de passe :</strong> <span className="bg-white px-2 py-1 rounded">{credentialsDialog.temporary_password}</span></div>
                </div>
              </div>
              <p className="text-xs text-gray-500">Imprimez ou copiez ces informations. Le mot de passe ne sera plus affiché.</p>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => window.print()} variant="outline">Imprimer</Button>
            <Button onClick={() => setCredentialsDialog(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
