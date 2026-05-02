const fs = require("fs");
const db = require("better-sqlite3")("/app/data/app.db");

// ═══ 1. DB TABLES pour les postes Finance ═══
db.exec(`
  CREATE TABLE IF NOT EXISTS finance_budget (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year INTEGER NOT NULL,
    month INTEGER,
    category TEXT NOT NULL,
    description TEXT,
    allocated INTEGER DEFAULT 0,
    spent INTEGER DEFAULT 0,
    level TEXT,
    province TEXT,
    sous_province TEXT,
    center_id INTEGER,
    status TEXT DEFAULT 'draft',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS finance_expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL,
    category TEXT,
    description TEXT,
    amount INTEGER NOT NULL,
    supplier TEXT,
    payment_method TEXT,
    receipt_url TEXT,
    budget_id INTEGER,
    level TEXT,
    province TEXT,
    sous_province TEXT,
    center_id INTEGER,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    approved_date TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS finance_invoices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    invoice_number TEXT UNIQUE,
    date TEXT NOT NULL,
    due_date TEXT,
    type TEXT DEFAULT 'outgoing',
    client_supplier TEXT,
    description TEXT,
    amount INTEGER NOT NULL,
    tax INTEGER DEFAULT 0,
    total INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    paid_date TEXT,
    document_url TEXT,
    level TEXT,
    province TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log("Finance tables created");

// ═══ 2. SERVER ROUTES ═══
let server = fs.readFileSync("/app/server.js", "utf8");
if (!server.includes("/api/internal/finance/budget")) {
  const insertBefore = server.lastIndexOf("app.listen(");
  const newRoutes = `
// ═══ FINANCE ROUTES ═══
function financeScopeFilter(user) {
  if (user.level === 'superadmin' || user.level === 'ministere') return {};
  if (user.level === 'national') return { level: 'national' };
  if (user.level === 'provincial') return { province: user.province };
  if (user.level === 'sous_provincial') return { sous_province: user.sous_province };
  if (user.level === 'centre') return { center_id: user.center_id };
  return { _denied: true };
}

function financeCanManage(user) {
  const roles = ['Finance','Ministre','Secrétaire Général','Coordonateur','Coordonateur Adjoint','Chef de Centre','Super Administrateur'];
  return roles.includes(user.post) || user.level === 'superadmin';
}

// Budget
app.get('/api/internal/finance/budget', authenticateToken, (req, res) => {
  try {
    const scope = financeScopeFilter(req.user);
    if (scope._denied) return res.json([]);
    let q = "SELECT * FROM finance_budget WHERE 1=1";
    const p = [];
    if (scope.level) { q += " AND (level = ? OR level IS NULL)"; p.push(scope.level); }
    if (scope.province) { q += " AND (province = ? OR province IS NULL)"; p.push(scope.province); }
    q += " ORDER BY year DESC, month DESC";
    res.json(db.prepare(q).all(...p));
  } catch (e) { console.error(e); res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/finance/budget', authenticateToken, (req, res) => {
  try {
    if (!financeCanManage(req.user)) return res.status(403).json({ message: 'Réservé aux responsables Finance' });
    const b = req.body;
    const r = db.prepare("INSERT INTO finance_budget (year,month,category,description,allocated,level,province,sous_province,center_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)").run(
      b.year, b.month||null, b.category, b.description||null, b.allocated||0,
      req.user.level, req.user.province||null, req.user.sous_province||null, req.user.center_id||null, req.user.id
    );
    res.status(201).json({ id: r.lastInsertRowid, message: 'Budget créé' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// Dépenses
app.get('/api/internal/finance/expenses', authenticateToken, (req, res) => {
  try {
    const scope = financeScopeFilter(req.user);
    if (scope._denied) return res.json([]);
    let q = "SELECT * FROM finance_expenses WHERE 1=1";
    const p = [];
    if (scope.level) { q += " AND (level = ? OR level IS NULL)"; p.push(scope.level); }
    if (scope.province) { q += " AND (province = ? OR province IS NULL)"; p.push(scope.province); }
    q += " ORDER BY date DESC";
    res.json(db.prepare(q).all(...p));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/finance/expenses', authenticateToken, (req, res) => {
  try {
    if (!financeCanManage(req.user)) return res.status(403).json({ message: 'Réservé aux responsables Finance' });
    const e = req.body;
    const r = db.prepare("INSERT INTO finance_expenses (date,category,description,amount,supplier,payment_method,budget_id,level,province,sous_province,center_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(
      e.date, e.category||null, e.description||null, e.amount, e.supplier||null, e.payment_method||null, e.budget_id||null,
      req.user.level, req.user.province||null, req.user.sous_province||null, req.user.center_id||null, req.user.id
    );
    res.status(201).json({ id: r.lastInsertRowid, message: 'Dépense enregistrée' });
  } catch (err) { res.status(500).json({ message: 'Erreur' }); }
});

// Factures
app.get('/api/internal/finance/invoices', authenticateToken, (req, res) => {
  try {
    const scope = financeScopeFilter(req.user);
    if (scope._denied) return res.json([]);
    let q = "SELECT * FROM finance_invoices WHERE 1=1";
    const p = [];
    if (scope.level) { q += " AND (level = ? OR level IS NULL)"; p.push(scope.level); }
    if (scope.province) { q += " AND (province = ? OR province IS NULL)"; p.push(scope.province); }
    q += " ORDER BY date DESC";
    res.json(db.prepare(q).all(...p));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/finance/invoices', authenticateToken, (req, res) => {
  try {
    if (!financeCanManage(req.user)) return res.status(403).json({ message: 'Réservé aux responsables Finance' });
    const i = req.body;
    const total = (i.amount||0) + (i.tax||0);
    const r = db.prepare("INSERT INTO finance_invoices (invoice_number,date,due_date,type,client_supplier,description,amount,tax,total,level,province,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(
      i.invoice_number||('INV-'+Date.now()), i.date, i.due_date||null, i.type||'outgoing',
      i.client_supplier||null, i.description||null, i.amount||0, i.tax||0, total,
      req.user.level, req.user.province||null, req.user.id
    );
    res.status(201).json({ id: r.lastInsertRowid, message: 'Facture créée' });
  } catch (err) { res.status(500).json({ message: 'Erreur' }); }
});

// Rapports financiers
app.get('/api/internal/finance/reports', authenticateToken, (req, res) => {
  try {
    const scope = financeScopeFilter(req.user);
    if (scope._denied) return res.json({});
    const filterSQL = scope.level ? "AND (level = ? OR level IS NULL)" : "";
    const filterParams = scope.level ? [scope.level] : [];
    
    const totalBudget = db.prepare("SELECT COALESCE(SUM(allocated), 0) as total FROM finance_budget WHERE 1=1 " + filterSQL).get(...filterParams).total;
    const totalSpent = db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM finance_expenses WHERE status = 'approved' " + filterSQL).get(...filterParams).total;
    const pendingExpenses = db.prepare("SELECT COUNT(*) as c FROM finance_expenses WHERE status = 'pending' " + filterSQL).get(...filterParams).c;
    const unpaidInvoices = db.prepare("SELECT COUNT(*) as c FROM finance_invoices WHERE status = 'pending' " + filterSQL).get(...filterParams).c;
    
    const byCategory = db.prepare("SELECT category, SUM(amount) as total FROM finance_expenses WHERE status = 'approved' " + filterSQL + " GROUP BY category").all(...filterParams);
    
    const monthlyExpenses = db.prepare("SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM finance_expenses WHERE status = 'approved' " + filterSQL + " GROUP BY month ORDER BY month DESC LIMIT 12").all(...filterParams);
    
    res.json({
      totalBudget, totalSpent, remaining: totalBudget - totalSpent,
      pendingExpenses, unpaidInvoices,
      byCategory, monthlyExpenses
    });
  } catch (e) { console.error('Finance reports:', e.message); res.status(500).json({ message: 'Erreur' }); }
});
`;
  server = server.substring(0, insertBefore) + newRoutes + "\n" + server.substring(insertBefore);
  fs.writeFileSync("/app/server.js", server);
  fs.copyFileSync("/app/server.js", "/app/server.cjs");
  
  try {
    require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
    console.log("Server routes added - SYNTAX OK");
  } catch (e) {
    console.log("SYNTAX ERROR");
    process.exit(1);
  }
} else {
  console.log("Finance routes already present");
}

// ═══ 3. UPDATE MENU with new posts ═══
let layout = fs.readFileSync("/app/src/components/Layout/InternalLayout.tsx", "utf8");

// Add new post menus BEFORE 'default'
const insertMarker = "      // Autres postes (par défaut)";
const newMenus = `      // ═══ POSTES MINISTÈRE ═══
      'Directeur de Cabinet du Ministre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Cabinet', icon: Briefcase, children: [
          { path: '/internal/decisions', label: 'Décisions', icon: Shield },
          { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
          { path: '/internal/reports', label: 'Rapports', icon: FileText },
        ]},
        { section: 'Collaboration', icon: Activity, children: [
          { path: '/internal/hr/agenda', label: 'Agenda', icon: CalendarDays },
          { path: '/internal/hr/meetings', label: 'Réunions', icon: Video },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],
      'Secrétaire Général': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion des Employés', icon: Briefcase, children: [
          { path: '/internal/hr/personnel', label: 'Personnel', icon: UserCheck },
          { path: '/internal/hr/organigram', label: 'Organigramme', icon: Network },
          { path: '/internal/hr/attendance', label: 'Présences', icon: Clock },
          { path: '/internal/hr/leave', label: 'Congés', icon: Calendar },
          { path: '/internal/hr/contracts', label: 'Contrats', icon: FileText },
          { path: '/internal/hr/approvals', label: 'Approbations', icon: Shield },
        ]},
        { section: 'Administration', icon: Inbox, children: [
          { path: '/internal/decisions', label: 'Décisions', icon: Shield },
          { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
          { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
          { path: '/internal/reports', label: 'Rapports', icon: FileText },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],
      // ═══ POSTE FINANCE (tous niveaux) ═══
      'Finance': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Finance', icon: DollarSign, children: [
          { path: '/internal/finance/budget', label: 'Budget', icon: Target },
          { path: '/internal/finance/expenses', label: 'Dépenses', icon: FileText },
          { path: '/internal/finance/invoices', label: 'Factures', icon: FileText },
          { path: '/internal/finance/reports', label: 'Rapports financiers', icon: BarChart3 },
          { path: '/internal/hr/payroll', label: 'Paie', icon: DollarSign },
        ]},
        { section: 'Collaboration', icon: Activity, children: [
          { path: '/internal/hr/agenda', label: 'Agenda', icon: CalendarDays },
          { path: '/internal/reports', label: 'Rapports', icon: FileText },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],
      // ═══ POSTE PLAN ═══
      'Plan': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Planification', icon: Target, children: [
          { path: '/internal/centers', label: 'Centres', icon: Building },
          { path: '/internal/journal', label: 'Journal', icon: Calendar },
          { path: '/internal/statistiques', label: 'Statistiques', icon: BarChart3 },
          { path: '/internal/reports', label: 'Rapports', icon: FileText },
        ]},
        { section: 'Collaboration', icon: Activity, children: [
          { path: '/internal/hr/agenda', label: 'Agenda', icon: CalendarDays },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],
      // ═══ POSTE FORMATION ═══
      'Formation': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Formation', icon: BookOpen, children: [
          { path: '/internal/formateurs', label: 'Formateurs', icon: UserCheck },
          { path: '/internal/formations', label: 'Formations', icon: BookOpen },
          { path: '/internal/hr/trainings', label: 'Formations internes', icon: BookOpen },
          { path: '/internal/statistiques', label: 'Statistiques', icon: BarChart3 },
          { path: '/internal/reports', label: 'Rapports', icon: FileText },
        ]},
        { section: 'Collaboration', icon: Activity, children: [
          { path: '/internal/hr/agenda', label: 'Agenda', icon: CalendarDays },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],
      // ═══ COORDONATEUR ADJOINT (national, provincial, sous-provincial) ═══
      'Coordonateur Adjoint': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Opérations', icon: Briefcase, children: [
          { path: '/internal/centers', label: 'Centres', icon: Building },
          { path: '/internal/children', label: 'Enfants', icon: UserCheck },
          { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        ]},
        { section: 'Décisions', icon: Shield, children: [
          { path: '/internal/decisions', label: 'Décisions', icon: Shield },
          { path: '/internal/hr/approvals', label: 'Approbations RH', icon: Shield },
        ]},
        { section: 'Collaboration', icon: Activity, children: [
          { path: '/internal/reports', label: 'Rapports', icon: FileText },
          { path: '/internal/hr/agenda', label: 'Agenda', icon: CalendarDays },
          { path: '/internal/hr/meetings', label: 'Réunions', icon: Video },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],
      // ═══ CHEF DE CENTRE ADJOINT ═══
      'Chef de Centre Adjoint': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion du Centre', icon: Building, children: [
          { path: '/internal/children', label: 'Enfants', icon: UserCheck },
          { path: '/internal/formations', label: 'Formations', icon: BookOpen },
          { path: '/internal/personnel', label: 'Personnel', icon: Users },
          { path: '/internal/equipement', label: 'Équipement', icon: Building },
          { path: '/internal/discipline', label: 'Discipline', icon: Shield },
        ]},
        { section: 'Collaboration', icon: Activity, children: [
          { path: '/internal/reports', label: 'Rapports', icon: FileText },
          { path: '/internal/hr/agenda', label: 'Agenda', icon: CalendarDays },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],

`;

if (!layout.includes("'Directeur de Cabinet du Ministre':")) {
  layout = layout.replace(insertMarker, newMenus + "      " + insertMarker);
  console.log("5 new post menus added");
} else {
  console.log("Posts already have menus");
}

fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", layout);

console.log("\nLot 1b DONE");
