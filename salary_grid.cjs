const fs = require("fs");
const db = require("better-sqlite3")("/app/data/app.db");

// ═══ 1. DB: grille salariale ═══
db.exec(`
  CREATE TABLE IF NOT EXISTS finance_salary_grid (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post TEXT NOT NULL,
    level TEXT NOT NULL,
    echelon INTEGER DEFAULT 1,
    base_salary INTEGER NOT NULL,
    housing_allowance INTEGER DEFAULT 0,
    transport_allowance INTEGER DEFAULT 0,
    other_allowance INTEGER DEFAULT 0,
    total_salary INTEGER NOT NULL,
    effective_date TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(post, level, echelon)
  );
  CREATE INDEX IF NOT EXISTS idx_salary_grid_post ON finance_salary_grid(post, level);
`);
console.log("Salary grid table created");

// ═══ 2. Seed avec des valeurs officielles (grille de démonstration) ═══
const count = db.prepare("SELECT COUNT(*) as c FROM finance_salary_grid").get().c;
if (count === 0) {
  const grid = [
    // Ministère (salaires élevés)
    { post: 'Ministre', level: 'ministere', base: 2500000, housing: 500000, transport: 200000 },
    { post: 'Directeur de Cabinet du Ministre', level: 'ministere', base: 1800000, housing: 400000, transport: 150000 },
    { post: 'Secrétaire Général', level: 'ministere', base: 1500000, housing: 350000, transport: 150000 },
    { post: 'Finance', level: 'ministere', base: 1200000, housing: 300000, transport: 120000 },
    { post: 'Plan', level: 'ministere', base: 1200000, housing: 300000, transport: 120000 },
    { post: 'Secrétaire', level: 'ministere', base: 800000, housing: 200000, transport: 100000 },
    // National
    { post: 'Coordonateur', level: 'national', base: 1500000, housing: 350000, transport: 150000 },
    { post: 'Coordonateur Adjoint', level: 'national', base: 1200000, housing: 300000, transport: 120000 },
    { post: 'Finance', level: 'national', base: 900000, housing: 250000, transport: 100000 },
    { post: 'Plan', level: 'national', base: 900000, housing: 250000, transport: 100000 },
    { post: 'Formation', level: 'national', base: 900000, housing: 250000, transport: 100000 },
    { post: 'Secrétaire', level: 'national', base: 700000, housing: 200000, transport: 80000 },
    // Provincial
    { post: 'Coordonateur', level: 'provincial', base: 1100000, housing: 280000, transport: 120000 },
    { post: 'Coordonateur Adjoint', level: 'provincial', base: 900000, housing: 220000, transport: 100000 },
    { post: 'Finance', level: 'provincial', base: 700000, housing: 200000, transport: 80000 },
    { post: 'Plan', level: 'provincial', base: 700000, housing: 200000, transport: 80000 },
    { post: 'Formation', level: 'provincial', base: 700000, housing: 200000, transport: 80000 },
    { post: 'Secrétaire', level: 'provincial', base: 550000, housing: 150000, transport: 70000 },
    // Sous-provincial
    { post: 'Coordonateur', level: 'sous_provincial', base: 850000, housing: 200000, transport: 100000 },
    { post: 'Coordonateur Adjoint', level: 'sous_provincial', base: 700000, housing: 180000, transport: 80000 },
    { post: 'Finance', level: 'sous_provincial', base: 550000, housing: 150000, transport: 70000 },
    { post: 'Plan', level: 'sous_provincial', base: 550000, housing: 150000, transport: 70000 },
    { post: 'Formation', level: 'sous_provincial', base: 550000, housing: 150000, transport: 70000 },
    { post: 'Secrétaire', level: 'sous_provincial', base: 450000, housing: 120000, transport: 60000 },
    // Centre
    { post: 'Chef de Centre', level: 'centre', base: 800000, housing: 200000, transport: 100000 },
    { post: 'Chef de Centre Adjoint', level: 'centre', base: 650000, housing: 170000, transport: 80000 },
    { post: 'Chargé des Opérations', level: 'centre', base: 500000, housing: 140000, transport: 70000 },
    { post: 'Intendant', level: 'centre', base: 450000, housing: 120000, transport: 60000 },
    { post: 'Disciplinaire', level: 'centre', base: 450000, housing: 120000, transport: 60000 },
    { post: 'Secrétaire', level: 'centre', base: 400000, housing: 100000, transport: 50000 },
  ];
  const stmt = db.prepare("INSERT INTO finance_salary_grid (post,level,echelon,base_salary,housing_allowance,transport_allowance,total_salary,effective_date) VALUES (?,?,?,?,?,?,?,?)");
  const today = new Date().toISOString().substring(0,10);
  grid.forEach(g => {
    const total = g.base + g.housing + g.transport;
    stmt.run(g.post, g.level, 1, g.base, g.housing, g.transport, total, today);
  });
  console.log("Seeded " + grid.length + " salary grid entries");
}

// ═══ 3. SERVER: routes grille + auto-assign salary ═══
let server = fs.readFileSync("/app/server.js", "utf8");

if (!server.includes("/api/internal/finance/salary-grid")) {
  const insertBefore = server.lastIndexOf("app.listen(");
  const newRoutes = `
// ═══ SALARY GRID (Grille salariale officielle) ═══
app.get('/api/internal/finance/salary-grid', authenticateToken, (req, res) => {
  try {
    const grid = db.prepare("SELECT * FROM finance_salary_grid ORDER BY level, post, echelon").all();
    res.json(grid);
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.get('/api/internal/finance/salary-grid/lookup', authenticateToken, (req, res) => {
  try {
    const { post, level } = req.query;
    if (!post || !level) return res.json(null);
    const entry = db.prepare("SELECT * FROM finance_salary_grid WHERE post = ? AND level = ? ORDER BY echelon LIMIT 1").get(post, level);
    res.json(entry || null);
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/finance/salary-grid', authenticateToken, (req, res) => {
  try {
    if (!financeCanManage(req.user)) return res.status(403).json({ message: 'Réservé à Finance/Ministère' });
    const g = req.body;
    const total = (g.base_salary||0) + (g.housing_allowance||0) + (g.transport_allowance||0) + (g.other_allowance||0);
    const r = db.prepare("INSERT OR REPLACE INTO finance_salary_grid (post,level,echelon,base_salary,housing_allowance,transport_allowance,other_allowance,total_salary,effective_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)").run(
      g.post, g.level, g.echelon||1, g.base_salary||0, g.housing_allowance||0, g.transport_allowance||0, g.other_allowance||0, total, g.effective_date||new Date().toISOString().substring(0,10), req.user.id
    );
    res.status(201).json({ id: r.lastInsertRowid, total, message: 'Grille salariale mise à jour' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.delete('/api/internal/finance/salary-grid/:id', authenticateToken, (req, res) => {
  try {
    if (!financeCanManage(req.user)) return res.status(403).json({ message: 'Réservé à Finance/Ministère' });
    db.prepare("DELETE FROM finance_salary_grid WHERE id = ?").run(parseInt(req.params.id));
    res.json({ message: 'Supprimé' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});
`;
  server = server.substring(0, insertBefore) + newRoutes + "\n" + server.substring(insertBefore);
  fs.writeFileSync("/app/server.js", server);
  fs.copyFileSync("/app/server.js", "/app/server.cjs");
  try {
    require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
    console.log("Salary grid routes added - SYNTAX OK");
  } catch (e) { console.log("SYNTAX ERROR"); process.exit(1); }
}

// ═══ 4. UPDATE Personnel.tsx: remove salary field, show grille info instead ═══
let personnel = fs.readFileSync("/app/src/pages/internal/hr/Personnel.tsx", "utf8");

// Remove salary input field
personnel = personnel.replace(
  /<Input type="number" placeholder="Salaire \(FC\)"[^/]+\/>/,
  '<div className="text-xs text-gray-500 italic p-2 bg-amber-50 rounded border border-amber-200">💡 Le salaire sera automatiquement attribué selon la grille salariale officielle (géré par Finance/Ministère)</div>'
);

// Also remove from form state init
personnel = personnel.replace(
  "salary||''",
  "'' /* salary auto from grid */"
);

fs.writeFileSync("/app/src/pages/internal/hr/Personnel.tsx", personnel);
console.log("Personnel.tsx: salary field replaced by info message");

// ═══ 5. CREATE Finance Salary Grid page ═══
const salaryGridPage = `import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DollarSign, Plus, Edit, Search, Scale } from 'lucide-react';
import { toast } from 'sonner';

const LEVELS = [
  { value: 'ministere', label: 'Ministère', color: 'bg-purple-100 text-purple-700' },
  { value: 'national', label: 'National', color: 'bg-indigo-100 text-indigo-700' },
  { value: 'provincial', label: 'Provincial', color: 'bg-teal-100 text-teal-700' },
  { value: 'sous_provincial', label: 'Sous-Provincial', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'centre', label: 'Centre', color: 'bg-emerald-100 text-emerald-700' },
];

export default function SalaryGrid() {
  const { user, token } = useAuth();
  const [grid, setGrid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({ level: 'national', echelon: 1 });

  const canEdit = user?.post === 'Finance' || user?.post === 'Ministre' || user?.post === 'Secrétaire Général' || user?.level === 'superadmin';

  const load = async () => {
    const r = await fetch('/api/internal/finance/salary-grid', { headers: { Authorization: 'Bearer ' + token } });
    if (r.ok) setGrid(await r.json());
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.post || !form.level || !form.base_salary) { toast.error('Champs requis manquants'); return; }
    const r = await fetch('/api/internal/finance/salary-grid', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify(form)
    });
    if (r.ok) { toast.success('Grille mise à jour'); setDialogOpen(false); setForm({ level: 'national', echelon: 1 }); load(); }
    else toast.error('Erreur');
  };

  const filtered = useMemo(() => {
    return grid.filter(g => {
      if (levelFilter !== 'all' && g.level !== levelFilter) return false;
      if (search && !g.post.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [grid, levelFilter, search]);

  const formTotal = (parseInt(form.base_salary) || 0) + (parseInt(form.housing_allowance) || 0) + (parseInt(form.transport_allowance) || 0) + (parseInt(form.other_allowance) || 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Scale className="h-7 w-7 text-indigo-600" />Grille Salariale Officielle</h1>
          <p className="text-sm text-gray-500">Rémunération par poste et niveau — source légale pour toute la paie</p>
        </div>
        {canEdit && <Button onClick={() => setDialogOpen(true)} className="bg-indigo-600"><Plus className="h-4 w-4 mr-1" />Nouvelle entrée</Button>}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        {LEVELS.map(lvl => {
          const count = grid.filter(g => g.level === lvl.value).length;
          return (
            <Card key={lvl.value} className="border-0 shadow-sm cursor-pointer hover:shadow-md" onClick={() => setLevelFilter(lvl.value)}>
              <CardContent className="p-4">
                <Badge className={lvl.color + ' border-0 mb-2'}>{lvl.label}</Badge>
                <div className="text-2xl font-bold">{count}</div>
                <div className="text-xs text-gray-500">postes</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 flex-1 min-w-[250px]">
              <Search className="h-4 w-4 text-gray-400" />
              <Input placeholder="Rechercher par poste..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />
            </div>
            <select className="p-2 border rounded text-sm" value={levelFilter} onChange={e => setLevelFilter(e.target.value)}>
              <option value="all">Tous les niveaux</option>
              {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>
              <TableHead>Niveau</TableHead>
              <TableHead>Poste</TableHead>
              <TableHead>Échelon</TableHead>
              <TableHead>Base</TableHead>
              <TableHead>Logement</TableHead>
              <TableHead>Transport</TableHead>
              <TableHead>Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={7} className="text-center py-8">Chargement...</TableCell></TableRow> :
               filtered.length === 0 ? <TableRow><TableCell colSpan={7} className="text-center py-8 text-gray-400">Aucune entrée</TableCell></TableRow> :
               filtered.map(g => {
                 const lvl = LEVELS.find(l => l.value === g.level);
                 return (
                   <TableRow key={g.id}>
                     <TableCell><Badge className={(lvl?.color || '') + ' border-0'}>{lvl?.label || g.level}</Badge></TableCell>
                     <TableCell className="font-medium">{g.post}</TableCell>
                     <TableCell><Badge variant="outline">{g.echelon}</Badge></TableCell>
                     <TableCell>{(g.base_salary || 0).toLocaleString('fr-FR')} FC</TableCell>
                     <TableCell>{(g.housing_allowance || 0).toLocaleString('fr-FR')} FC</TableCell>
                     <TableCell>{(g.transport_allowance || 0).toLocaleString('fr-FR')} FC</TableCell>
                     <TableCell className="font-bold text-indigo-600">{(g.total_salary || 0).toLocaleString('fr-FR')} FC</TableCell>
                   </TableRow>
                 );
               })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {canEdit && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Nouvelle entrée dans la grille</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <select className="p-2 border rounded" value={form.level} onChange={e => setForm({...form, level: e.target.value})}>
                  {LEVELS.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
                </select>
                <Input type="number" placeholder="Échelon" value={form.echelon||1} onChange={e => setForm({...form, echelon: parseInt(e.target.value) || 1})} />
              </div>
              <Input placeholder="Poste *" value={form.post||''} onChange={e => setForm({...form, post: e.target.value})} />
              <Input type="number" placeholder="Salaire de base (FC) *" value={form.base_salary||''} onChange={e => setForm({...form, base_salary: parseInt(e.target.value) || 0})} />
              <Input type="number" placeholder="Indemnité logement (FC)" value={form.housing_allowance||''} onChange={e => setForm({...form, housing_allowance: parseInt(e.target.value) || 0})} />
              <Input type="number" placeholder="Indemnité transport (FC)" value={form.transport_allowance||''} onChange={e => setForm({...form, transport_allowance: parseInt(e.target.value) || 0})} />
              <Input type="number" placeholder="Autres indemnités (FC)" value={form.other_allowance||''} onChange={e => setForm({...form, other_allowance: parseInt(e.target.value) || 0})} />
              <div className="p-3 bg-indigo-50 rounded border border-indigo-200">
                <div className="text-sm font-semibold text-indigo-900">Total calculé</div>
                <div className="text-2xl font-bold text-indigo-700">{formTotal.toLocaleString('fr-FR')} FC</div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={save} className="bg-indigo-600">Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
`;
fs.writeFileSync("/app/src/pages/internal/finance/SalaryGrid.tsx", salaryGridPage);
console.log("SalaryGrid.tsx created");

// ═══ 6. Add route in App.tsx ═══
let app = fs.readFileSync("/app/src/App.tsx", "utf8");
if (!app.includes("FinanceSalaryGrid")) {
  app = app.replace(
    "import FinanceReports from '@/pages/internal/finance/Reports';",
    `import FinanceReports from '@/pages/internal/finance/Reports';
import FinanceSalaryGrid from '@/pages/internal/finance/SalaryGrid';`
  );
  const closingRoutes = app.lastIndexOf("</Routes>");
  const newRoute = `        <Route path="/internal/finance/salary-grid" element={<ProtectedRoute><InternalLayout><FinanceSalaryGrid /></InternalLayout></ProtectedRoute>} />
`;
  app = app.substring(0, closingRoutes) + newRoute + "        " + app.substring(closingRoutes);
  fs.writeFileSync("/app/src/App.tsx", app);
  console.log("Route added to App.tsx");
}

// ═══ 7. Add menu entry for Finance ═══
let layout = fs.readFileSync("/app/src/components/Layout/InternalLayout.tsx", "utf8");
if (layout.includes("'Finance':") && !layout.includes("'/internal/finance/salary-grid'")) {
  layout = layout.replace(
    "{ path: '/internal/finance/reports', label: 'Rapports financiers', icon: BarChart3 },",
    "{ path: '/internal/finance/reports', label: 'Rapports financiers', icon: BarChart3 },\n          { path: '/internal/finance/salary-grid', label: 'Grille salariale', icon: Target },"
  );
  fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", layout);
  console.log("Menu entry added for Finance");
}

// Also for Ministre
if (layout.includes("'Ministre': [")) {
  if (!layout.match(/'Ministre':[\s\S]*?salary-grid/)) {
    // Add it to Ministre menu if not there
    layout = layout.replace(
      /('Ministre':\s*\[[^\]]*?{ path: '\/internal\/messaging', label: 'Messages', icon: MessageCircle },\s*)/,
      "$1\n        { path: '/internal/finance/salary-grid', label: 'Grille salariale', icon: Target },"
    );
    fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", layout);
  }
}

console.log("\nSalary grid system DONE");
