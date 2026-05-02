const fs = require("fs");

// ═══ 1. SERVER: Enhance personnel create to optionally create user account ═══
let server = fs.readFileSync("/app/server.js", "utf8");

// Find and replace the personnel create route
const oldCreate = `app.post('/api/internal/hr/personnel', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    const r = db.prepare("INSERT INTO hr_personnel (matricule,name,postnom,prenom,gender,birth_date,nationality,phone,email,address,post,level,province,sous_province,center_id,hire_date,salary,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
      p.matricule, p.name, p.postnom||null, p.prenom||null, p.gender||null, p.birth_date||null, p.nationality||'Congolaise',
      p.phone||null, p.email||null, p.address||null, p.post, p.level||req.user.level,
      p.province||req.user.province, p.sous_province||req.user.sous_province, p.center_id||req.user.center_id,
      p.hire_date||null, p.salary||null, req.user.id
    );
    submitForApproval(db, 'personnel', r.lastInsertRowid, 'create', req.user, p);
    res.status(201).json({ id: r.lastInsertRowid, message: 'Agent créé, en attente d\\'approbation' });
  } catch (e) { console.error('HR personnel create:', e.message); res.status(500).json({ message: 'Erreur: ' + e.message }); }
});`;

const newCreate = `app.post('/api/internal/hr/personnel', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    const bcrypt = require('bcryptjs');
    
    // Start transaction
    const tx = db.transaction(() => {
      // 1. Create personnel record
      const r = db.prepare("INSERT INTO hr_personnel (matricule,name,postnom,prenom,gender,birth_date,nationality,phone,email,address,post,level,province,sous_province,center_id,hire_date,salary,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
        p.matricule, p.name, p.postnom||null, p.prenom||null, p.gender||null, p.birth_date||null, p.nationality||'Congolaise',
        p.phone||null, p.email||null, p.address||null, p.post, p.level||req.user.level,
        p.province||req.user.province, p.sous_province||req.user.sous_province, p.center_id||req.user.center_id,
        p.hire_date||null, p.salary||null, req.user.id
      );
      const personnelId = r.lastInsertRowid;
      let userId = null;
      let generatedEmail = null;
      let generatedPwd = null;
      
      // 2. Create user account if system access requested
      if (p.create_access && p.post) {
        // Generate email from name if not provided
        generatedEmail = p.email || (
          (p.prenom || p.name).charAt(0).toLowerCase() + '.' + 
          (p.postnom || p.name).toLowerCase().replace(/\\s+/g,'') + '@paide.cd'
        );
        // Generate random password
        generatedPwd = 'PAIDE-' + Math.random().toString(36).substring(2, 8).toUpperCase();
        const hash = bcrypt.hashSync(generatedPwd, 10);
        
        const userR = db.prepare("INSERT INTO users (name,postnom,prenom,email,password,level,post,province,sous_province,center_id,status,must_change_password,parent_id) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
          p.name, p.postnom||null, p.prenom||null, generatedEmail, hash, 
          p.level||req.user.level, p.post, 
          p.province||req.user.province, p.sous_province||req.user.sous_province, p.center_id||req.user.center_id,
          'active', 1, req.user.id
        );
        userId = userR.lastInsertRowid;
        
        // Link user to personnel
        db.prepare("UPDATE hr_personnel SET user_id=? WHERE id=?").run(userId, personnelId);
      }
      
      return { personnelId, userId, generatedEmail, generatedPwd };
    });
    
    const result = tx();
    submitForApproval(db, 'personnel', result.personnelId, 'create', req.user, p);
    
    const response = { id: result.personnelId, message: 'Agent créé, en attente d\\'approbation' };
    if (result.userId) {
      response.access = { 
        user_id: result.userId, 
        email: result.generatedEmail, 
        temporary_password: result.generatedPwd,
        message: 'Compte créé. Remettez ces identifiants à l\\'agent.'
      };
    }
    res.status(201).json(response);
  } catch (e) { console.error('HR personnel create:', e.message); res.status(500).json({ message: 'Erreur: ' + e.message }); }
});`;

if (!server.includes(oldCreate)) {
  console.log("Old personnel create route not found (maybe already updated)");
} else {
  server = server.replace(oldCreate, newCreate);
  console.log("1. Server route updated");
}

fs.writeFileSync("/app/server.js", server);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("SERVER SYNTAX OK");
} catch (e) { console.log("SERVER SYNTAX ERROR: " + e.stderr.split('\n')[0]); process.exit(1); }

// ═══ 2. MENU: Remove "Utilisateurs" from Secrétaire ═══
let layout = fs.readFileSync("/app/src/components/Layout/InternalLayout.tsx", "utf8");
const oldMenu = `'Secrétaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/users', label: 'Utilisateurs', icon: Users },
        { path: '/internal/hr/personnel', label: 'RH — Personnel', icon: UserCheck },`;

const newMenu = `'Secrétaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/hr/personnel', label: 'RH — Personnel', icon: UserCheck },`;

if (layout.includes(oldMenu)) {
  layout = layout.replace(oldMenu, newMenu);
  fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", layout);
  console.log("2. Users removed from Secrétaire menu");
} else {
  console.log("2. Menu already updated");
}

// ═══ 3. FRONTEND: Update Personnel page with access toggle ═══
const personnelPage = `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Search, UserCheck, Key } from 'lucide-react';
import { toast } from 'sonner';

export default function HRPersonnel() {
  const { token } = useAuth();
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ status: 'active', create_access: false });
  const [credentialsDialog, setCredentialsDialog] = useState<any>(null);

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/internal/hr/personnel', { headers: { Authorization: 'Bearer ' + token } });
      if (res.ok) setPersonnel(await res.json());
    } finally { setLoading(false); }
  };

  const save = async () => {
    if (!form.name || !form.post) { toast.error('Nom et poste requis'); return; }
    try {
      const res = await fetch('/api/internal/hr/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Agent créé');
        setDialogOpen(false);
        setForm({ status: 'active', create_access: false });
        if (data.access) setCredentialsDialog(data.access);
        load();
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur de connexion'); }
  };

  const filtered = personnel.filter(p => 
    !search || (p.name||'').toLowerCase().includes(search.toLowerCase()) || (p.matricule||'').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><UserCheck className="h-6 w-6 text-blue-500" />Personnel</h1>
          <p className="text-sm text-gray-500">Gestion des agents PAIDE — avec ou sans accès système</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvel agent</Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Search className="h-4 w-4 text-gray-400" />
            <Input placeholder="Rechercher par nom ou matricule..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matricule</TableHead>
                <TableHead>Nom complet</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Accès</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center">Chargement...</TableCell></TableRow> :
               filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-gray-400">Aucun agent</TableCell></TableRow> :
               filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono text-sm">{p.matricule || '-'}</TableCell>
                  <TableCell>{p.name} {p.postnom || ''} {p.prenom || ''}</TableCell>
                  <TableCell>{p.post}</TableCell>
                  <TableCell>{p.province || '-'}</TableCell>
                  <TableCell>{p.user_id ? <Badge className="bg-blue-100 text-blue-800"><Key className="h-3 w-3 mr-1" />Oui</Badge> : <Badge variant="outline">Non</Badge>}</TableCell>
                  <TableCell><Badge className={p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{p.status}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Nouvel Agent</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input placeholder="Matricule" value={form.matricule||''} onChange={e => setForm({...form, matricule: e.target.value})} />
              <Input placeholder="Poste *" value={form.post||''} onChange={e => setForm({...form, post: e.target.value})} />
              <Input placeholder="Nom *" value={form.name||''} onChange={e => setForm({...form, name: e.target.value})} />
              <Input placeholder="Postnom" value={form.postnom||''} onChange={e => setForm({...form, postnom: e.target.value})} />
              <Input placeholder="Prénom" value={form.prenom||''} onChange={e => setForm({...form, prenom: e.target.value})} />
              <Input placeholder="Téléphone" value={form.phone||''} onChange={e => setForm({...form, phone: e.target.value})} />
              <Input type="email" placeholder="Email personnel" value={form.email||''} onChange={e => setForm({...form, email: e.target.value})} />
              <Input type="date" placeholder="Date d'embauche" value={form.hire_date||''} onChange={e => setForm({...form, hire_date: e.target.value})} />
              <Input type="number" placeholder="Salaire (FC)" value={form.salary||''} onChange={e => setForm({...form, salary: parseInt(e.target.value) || 0})} />
              <select className="w-full p-2 border rounded" value={form.gender||''} onChange={e => setForm({...form, gender: e.target.value})}>
                <option value="">-- Sexe --</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <textarea className="w-full p-2 border rounded" rows={2} placeholder="Adresse" value={form.address||''} onChange={e => setForm({...form, address: e.target.value})} />

            {/* Système d'accès — Option C */}
            <div className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <input type="checkbox" id="create_access" checked={form.create_access||false} onChange={e => setForm({...form, create_access: e.target.checked})} className="h-4 w-4" />
                <label htmlFor="create_access" className="font-semibold text-blue-900 flex items-center gap-2">
                  <Key className="h-4 w-4" />Donner un accès au système
                </label>
              </div>
              {form.create_access && (
                <div className="mt-3 text-sm text-blue-800">
                  Un compte de connexion sera créé automatiquement.<br />
                  L'email sera généré depuis le nom (ex: <code>p.mutombo@paide.cd</code>).<br />
                  Un mot de passe temporaire sera généré. L'agent devra le changer à sa première connexion.
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={save}>Soumettre pour approbation</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Credentials dialog — shown after account creation */}
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
              <div className="text-xs text-gray-500">
                Imprimez ou copiez ces informations. Le mot de passe ne sera plus affiché.
                L'agent devra le changer à sa première connexion.
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => { window.print(); }} variant="outline">Imprimer</Button>
            <Button onClick={() => setCredentialsDialog(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`;
fs.writeFileSync("/app/src/pages/internal/hr/Personnel.tsx", personnelPage);
console.log("3. Personnel page enhanced with access toggle");

console.log("\nAll done - Option C implemented");
