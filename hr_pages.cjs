const fs = require("fs");
const path = require("path");

// Create HR pages directory
const hrDir = "/app/src/pages/internal/hr";
if (!fs.existsSync(hrDir)) fs.mkdirSync(hrDir, { recursive: true });

// ═══ PERSONNEL PAGE ═══
fs.writeFileSync(hrDir + "/Personnel.tsx", `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Edit, Search, UserCheck } from 'lucide-react';
import { toast } from 'sonner';

export default function HRPersonnel() {
  const { token } = useAuth();
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ status: 'active' });

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      const res = await fetch('/api/internal/hr/personnel', { headers: { Authorization: 'Bearer ' + token } });
      if (res.ok) setPersonnel(await res.json());
    } finally { setLoading(false); }
  };

  const save = async () => {
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
        setForm({ status: 'active' });
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
          <p className="text-sm text-gray-500">Gestion des agents PAIDE</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Ajouter</Button>
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
                <TableHead>Nom</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center">Chargement...</TableCell></TableRow> :
               filtered.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center text-gray-400">Aucun agent</TableCell></TableRow> :
               filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-mono">{p.matricule || '-'}</TableCell>
                  <TableCell>{p.name} {p.postnom || ''}</TableCell>
                  <TableCell>{p.post}</TableCell>
                  <TableCell>{p.province || '-'}</TableCell>
                  <TableCell><Badge className={p.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>{p.status}</Badge></TableCell>
                  <TableCell><Button size="sm" variant="ghost"><Edit className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouvel Agent</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Matricule" value={form.matricule||''} onChange={e => setForm({...form, matricule: e.target.value})} />
            <Input placeholder="Nom *" value={form.name||''} onChange={e => setForm({...form, name: e.target.value})} />
            <Input placeholder="Postnom" value={form.postnom||''} onChange={e => setForm({...form, postnom: e.target.value})} />
            <Input placeholder="Prénom" value={form.prenom||''} onChange={e => setForm({...form, prenom: e.target.value})} />
            <Input placeholder="Poste *" value={form.post||''} onChange={e => setForm({...form, post: e.target.value})} />
            <Input placeholder="Téléphone" value={form.phone||''} onChange={e => setForm({...form, phone: e.target.value})} />
            <Input type="email" placeholder="Email" value={form.email||''} onChange={e => setForm({...form, email: e.target.value})} />
            <Input type="date" placeholder="Date d'embauche" value={form.hire_date||''} onChange={e => setForm({...form, hire_date: e.target.value})} />
            <Input type="number" placeholder="Salaire (FC)" value={form.salary||''} onChange={e => setForm({...form, salary: parseInt(e.target.value) || 0})} />
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
`);
console.log("Personnel.tsx created");

// Helper to create simple list pages
function createListPage(name, title, icon, apiPath, columns, formFields) {
  const code = `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, ${icon} } from 'lucide-react';
import { toast } from 'sonner';

export default function HR${name}() {
  const { token } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [personnel, setPersonnel] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    fetch('${apiPath}', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []).then(d => { setItems(d); setLoading(false); });
    fetch('/api/internal/hr/personnel', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []).then(setPersonnel);
  }, []);

  const save = async () => {
    try {
      const res = await fetch('${apiPath}', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify(form) });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Créé avec succès');
        setDialogOpen(false); setForm({});
        const r = await fetch('${apiPath}', { headers: { Authorization: 'Bearer ' + token } });
        if (r.ok) setItems(await r.json());
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><${icon} className="h-6 w-6 text-blue-500" />${title}</h1>
          <p className="text-sm text-gray-500">Créations soumises à l'approbation du responsable</p>
        </div>
        <Button onClick={() => setDialogOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouveau</Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader><TableRow>${columns.map(c => `<TableHead>${c.label}</TableHead>`).join('')}<TableHead>Statut</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={${columns.length+1}} className="text-center">Chargement...</TableCell></TableRow> :
               items.length === 0 ? <TableRow><TableCell colSpan={${columns.length+1}} className="text-center text-gray-400">Aucune donnée</TableCell></TableRow> :
               items.map(i => (
                <TableRow key={i.id}>
                  ${columns.map(c => `<TableCell>{i.${c.key} || '-'}</TableCell>`).join('')}
                  <TableCell><Badge>{i.status || 'pending'}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nouveau — ${title}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <select className="w-full p-2 border rounded" value={form.personnel_id||''} onChange={e => setForm({...form, personnel_id: parseInt(e.target.value)})}>
              <option value="">-- Sélectionner un agent --</option>
              {personnel.map(p => <option key={p.id} value={p.id}>{p.name} {p.postnom || ''} ({p.matricule || '-'})</option>)}
            </select>
            ${formFields.map(f => {
              if (f.type === 'select') return `<select className="w-full p-2 border rounded" value={form.${f.key}||''} onChange={e => setForm({...form, ${f.key}: e.target.value})}><option value="">-- ${f.label} --</option>${f.options.map(o => `<option value="${o}">${o}</option>`).join('')}</select>`;
              if (f.type === 'number') return `<Input type="number" placeholder="${f.label}" value={form.${f.key}||''} onChange={e => setForm({...form, ${f.key}: parseInt(e.target.value) || 0})} />`;
              if (f.type === 'date') return `<Input type="date" placeholder="${f.label}" value={form.${f.key}||''} onChange={e => setForm({...form, ${f.key}: e.target.value})} />`;
              if (f.type === 'textarea') return `<textarea className="w-full p-2 border rounded" rows={3} placeholder="${f.label}" value={form.${f.key}||''} onChange={e => setForm({...form, ${f.key}: e.target.value})} />`;
              return `<Input placeholder="${f.label}" value={form.${f.key}||''} onChange={e => setForm({...form, ${f.key}: e.target.value})} />`;
            }).join('\n            ')}
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
`;
  fs.writeFileSync(hrDir + "/" + name + ".tsx", code);
  console.log(name + ".tsx created");
}

// Paie
createListPage("Payroll", "Paie", "DollarSign", "/api/internal/hr/payroll",
  [{label:'Agent', key:'personnel_name'},{label:'Mois', key:'month'},{label:'Année', key:'year'},{label:'Salaire net', key:'net_salary'}],
  [
    {label:'Mois (1-12)', key:'month', type:'number'},
    {label:'Année', key:'year', type:'number'},
    {label:'Salaire de base (FC)', key:'base_salary', type:'number'},
    {label:'Prime (FC)', key:'bonus', type:'number'},
    {label:'Avance (FC)', key:'advance', type:'number'},
    {label:'Retenue (FC)', key:'deduction', type:'number'},
    {label:'Notes', key:'notes', type:'textarea'}
  ]
);

// Congés
createListPage("Leave", "Congés", "Calendar", "/api/internal/hr/leave",
  [{label:'Agent', key:'personnel_name'},{label:'Type', key:'type'},{label:'Début', key:'start_date'},{label:'Fin', key:'end_date'},{label:'Jours', key:'days'}],
  [
    {label:'Type', key:'type', type:'select', options:['annuel','maladie','maternité','exceptionnel']},
    {label:'Date de début', key:'start_date', type:'date'},
    {label:'Date de fin', key:'end_date', type:'date'},
    {label:'Nombre de jours', key:'days', type:'number'},
    {label:'Motif', key:'reason', type:'textarea'}
  ]
);

// Présences
createListPage("Attendance", "Présences", "Clock", "/api/internal/hr/attendance",
  [{label:'Agent', key:'personnel_name'},{label:'Date', key:'date'},{label:'Arrivée', key:'check_in'},{label:'Départ', key:'check_out'}],
  [
    {label:'Date', key:'date', type:'date'},
    {label:'Statut', key:'status', type:'select', options:['present','absent','retard','conge','mission']},
    {label:'Heure arrivée (HH:MM)', key:'check_in'},
    {label:'Heure départ (HH:MM)', key:'check_out'},
    {label:'Notes', key:'notes', type:'textarea'}
  ]
);

// Formations
fs.writeFileSync(hrDir + "/Trainings.tsx", `import { useState, useEffect } from 'react';
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
`);
console.log("Trainings.tsx created");

// Évaluations
createListPage("Evaluations", "Évaluations", "Target", "/api/internal/hr/evaluations",
  [{label:'Agent', key:'personnel_name'},{label:'Année', key:'year'},{label:'Performance', key:'performance_score'},{label:'Global', key:'global_score'}],
  [
    {label:'Année', key:'year', type:'number'},
    {label:'Performance (0-100)', key:'performance_score', type:'number'},
    {label:'Ponctualité (0-100)', key:'punctuality_score', type:'number'},
    {label:'Travail d\'équipe (0-100)', key:'teamwork_score', type:'number'},
    {label:'Initiative (0-100)', key:'initiative_score', type:'number'},
    {label:'Points forts', key:'strengths', type:'textarea'},
    {label:'Axes d\'amélioration', key:'improvements', type:'textarea'},
    {label:'Objectifs', key:'objectives', type:'textarea'}
  ]
);

// Contrats
createListPage("Contracts", "Contrats", "FileText", "/api/internal/hr/contracts",
  [{label:'Agent', key:'personnel_name'},{label:'Type', key:'type'},{label:'Début', key:'start_date'},{label:'Fin', key:'end_date'}],
  [
    {label:'Type', key:'type', type:'select', options:['CDI','CDD','Stage','Intérim']},
    {label:'Date début', key:'start_date', type:'date'},
    {label:'Date fin (si CDD)', key:'end_date', type:'date'},
    {label:'Salaire (FC)', key:'salary', type:'number'},
    {label:'Poste', key:'position'},
    {label:'Notes', key:'notes', type:'textarea'}
  ]
);

// Discipline
createListPage("Disciplinary", "Disciplinaire", "Shield", "/api/internal/hr/disciplinary",
  [{label:'Agent', key:'personnel_name'},{label:'Type', key:'type'},{label:'Sévérité', key:'severity'},{label:'Date', key:'date'}],
  [
    {label:'Type', key:'type', type:'select', options:['Retard répété','Absence injustifiée','Faute professionnelle','Comportement','Autre']},
    {label:'Sévérité', key:'severity', type:'select', options:['warning','suspension','dismissal']},
    {label:'Date', key:'date', type:'date'},
    {label:'Motif', key:'reason', type:'textarea'},
    {label:'Décision proposée', key:'decision', type:'textarea'}
  ]
);

// ═══ APPROVALS PAGE (pour les responsables) ═══
fs.writeFileSync(hrDir + "/Approvals.tsx", `import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const moduleLabels: Record<string,string> = {
  personnel: 'Personnel', payroll: 'Paie', leave: 'Congés',
  training: 'Formation', evaluation: 'Évaluation', contract: 'Contrat',
  disciplinary: 'Disciplinaire'
};

export default function HRApprovals() {
  const { token } = useAuth();
  const [data, setData] = useState<any>({ pending: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<any>(null);
  const [comment, setComment] = useState('');

  const load = async () => {
    const res = await fetch('/api/internal/hr/approvals', { headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) { setData(await res.json()); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (status: string) => {
    if (!decision) return;
    const res = await fetch('/api/internal/hr/approvals/' + decision.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ status, comment })
    });
    const d = await res.json();
    if (res.ok) { toast.success(d.message); setDecision(null); setComment(''); load(); }
    else toast.error(d.message);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-orange-500" />Approbations RH</h1>
        <p className="text-sm text-gray-500">Valider les demandes soumises par les Secrétaires</p>
      </div>

      <Card>
        <CardHeader><CardTitle>En attente ({data.pending.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Action</TableHead><TableHead>Demandeur</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center">Chargement...</TableCell></TableRow> :
               data.pending.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-gray-400">Aucune demande en attente</TableCell></TableRow> :
               data.pending.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell><Badge className="bg-blue-100 text-blue-800">{moduleLabels[a.module] || a.module}</Badge></TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.requester_name}</TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell><Button size="sm" onClick={() => setDecision(a)}>Traiter</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historique ({data.history.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Demandeur</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.history.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-gray-400">Aucun historique</TableCell></TableRow> :
               data.history.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell><Badge className="bg-gray-100 text-gray-800">{moduleLabels[a.module] || a.module}</Badge></TableCell>
                  <TableCell>{a.requester_name}</TableCell>
                  <TableCell><Badge className={a.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{a.status === 'approved' ? 'Approuvé' : 'Rejeté'}</Badge></TableCell>
                  <TableCell>{a.approved_date ? new Date(a.approved_date).toLocaleDateString('fr-FR') : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!decision} onOpenChange={() => setDecision(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Traiter la demande</DialogTitle></DialogHeader>
          {decision && (
            <div className="space-y-3">
              <p><strong>Module :</strong> {moduleLabels[decision.module] || decision.module}</p>
              <p><strong>Action :</strong> {decision.action}</p>
              <p><strong>Demandeur :</strong> {decision.requester_name}</p>
              <p><strong>Détails :</strong></p>
              <pre className="text-xs bg-gray-50 p-2 rounded max-h-40 overflow-auto">{decision.payload}</pre>
              <textarea className="w-full p-2 border rounded" rows={3} placeholder="Commentaire (facultatif)" value={comment} onChange={e => setComment(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => decide('rejected')} className="border-red-300 text-red-700"><X className="h-4 w-4 mr-2" />Rejeter</Button>
            <Button onClick={() => decide('approved')} className="bg-green-600"><Check className="h-4 w-4 mr-2" />Approuver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
`);
console.log("Approvals.tsx created");

console.log("\nAll 9 HR pages created");
