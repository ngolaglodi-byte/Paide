const fs = require("fs");
const db = require("better-sqlite3")("/app/data/app.db");

// ═══ 1. DB TABLES for new tools ═══
db.exec(`
  CREATE TABLE IF NOT EXISTS hr_meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_date TEXT NOT NULL,
    end_date TEXT,
    location TEXT,
    organizer_id INTEGER,
    level TEXT,
    province TEXT,
    sous_province TEXT,
    center_id INTEGER,
    status TEXT DEFAULT 'scheduled',
    minutes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS hr_meeting_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER NOT NULL,
    personnel_id INTEGER,
    user_id INTEGER,
    status TEXT DEFAULT 'invited',
    FOREIGN KEY(meeting_id) REFERENCES hr_meetings(id)
  );
  CREATE TABLE IF NOT EXISTS hr_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    end_date TEXT,
    type TEXT DEFAULT 'general',
    level TEXT,
    province TEXT,
    sous_province TEXT,
    center_id INTEGER,
    color TEXT DEFAULT '#4F46E5',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS hr_resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    category TEXT,
    description TEXT,
    file_url TEXT,
    tags TEXT,
    level TEXT,
    province TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);
console.log("HR tables created");

// ═══ 2. SERVER ROUTES ═══
let server = fs.readFileSync("/app/server.js", "utf8");

if (!server.includes("/api/internal/hr/meetings")) {
  const insertBefore = server.lastIndexOf("app.listen(");
  const newRoutes = `
// ═══ MEETINGS ═══
app.get('/api/internal/hr/meetings', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let q = "SELECT * FROM hr_meetings WHERE 1=1";
    const p = [];
    if (scope.level) { q += " AND (level = ? OR level IS NULL)"; p.push(scope.level); }
    if (scope.province) { q += " AND (province = ? OR province IS NULL)"; p.push(scope.province); }
    q += " ORDER BY start_date DESC LIMIT 100";
    res.json(db.prepare(q).all(...p));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/meetings', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const m = req.body;
    const r = db.prepare("INSERT INTO hr_meetings (title,description,start_date,end_date,location,level,province,sous_province,center_id,organizer_id,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
      m.title, m.description||null, m.start_date, m.end_date||null, m.location||null,
      req.user.level, req.user.province||null, req.user.sous_province||null, req.user.center_id||null,
      m.organizer_id||req.user.id, req.user.id
    );
    res.status(201).json({ id: r.lastInsertRowid, message: 'Réunion créée' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.put('/api/internal/hr/meetings/:id', authenticateToken, (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const m = req.body;
    db.prepare("UPDATE hr_meetings SET title=COALESCE(?,title),description=COALESCE(?,description),start_date=COALESCE(?,start_date),end_date=COALESCE(?,end_date),location=COALESCE(?,location),status=COALESCE(?,status),minutes=COALESCE(?,minutes) WHERE id=?").run(
      m.title||null, m.description||null, m.start_date||null, m.end_date||null, m.location||null, m.status||null, m.minutes||null, id
    );
    res.json({ message: 'Réunion mise à jour' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ═══ EVENTS (Agenda/Calendrier) ═══
app.get('/api/internal/hr/events', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let q = "SELECT * FROM hr_events WHERE 1=1";
    const p = [];
    if (scope.level) { q += " AND (level = ? OR level IS NULL)"; p.push(scope.level); }
    if (scope.province) { q += " AND (province = ? OR province IS NULL)"; p.push(scope.province); }
    q += " ORDER BY date ASC";
    res.json(db.prepare(q).all(...p));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/events', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const e = req.body;
    const r = db.prepare("INSERT INTO hr_events (title,description,date,end_date,type,level,province,sous_province,center_id,color,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
      e.title, e.description||null, e.date, e.end_date||null, e.type||'general',
      req.user.level, req.user.province||null, req.user.sous_province||null, req.user.center_id||null,
      e.color||'#4F46E5', req.user.id
    );
    res.status(201).json({ id: r.lastInsertRowid, message: 'Événement créé' });
  } catch (err) { res.status(500).json({ message: 'Erreur' }); }
});

app.delete('/api/internal/hr/events/:id', authenticateToken, (req, res) => {
  try {
    db.prepare("DELETE FROM hr_events WHERE id=?").run(parseInt(req.params.id));
    res.json({ message: 'Supprimé' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ═══ RESOURCES ═══
app.get('/api/internal/hr/resources', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let q = "SELECT * FROM hr_resources WHERE 1=1";
    const p = [];
    if (scope.level) { q += " AND (level = ? OR level IS NULL)"; p.push(scope.level); }
    q += " ORDER BY created_at DESC";
    res.json(db.prepare(q).all(...p));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/resources', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const r = req.body;
    const result = db.prepare("INSERT INTO hr_resources (title,category,description,file_url,tags,level,province,created_by) VALUES (?,?,?,?,?,?,?,?)").run(
      r.title, r.category||null, r.description||null, r.file_url||null, r.tags||null,
      req.user.level, req.user.province||null, req.user.id
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Ressource ajoutée' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ═══ ORGANIGRAMME ═══
app.get('/api/internal/hr/organigram', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let q = "SELECT p.*, u.name as manager_name FROM hr_personnel p LEFT JOIN users u ON p.user_id = u.id WHERE 1=1";
    const pm = [];
    if (scope.level) { q += " AND p.level = ?"; pm.push(scope.level); }
    if (scope.province) { q += " AND p.province = ?"; pm.push(scope.province); }
    q += " ORDER BY p.level, p.post";
    const personnel = db.prepare(q).all(...pm);
    
    // Group by post/level
    const byLevel = {};
    const postOrder = ['Ministre','Coordinateur National','Coordinateur Provincial','Coordinateur Sous-Provincial','Chef de Centre','Secrétaire','Chargé de Plan','Chargé de Formation','Chargé de Suivi','Intendant','Disciplinaire','Assistant Social'];
    personnel.forEach(p => {
      const key = p.post || 'Autre';
      if (!byLevel[key]) byLevel[key] = [];
      byLevel[key].push(p);
    });
    
    res.json({ personnel, byPost: byLevel, order: postOrder });
  } catch (e) { console.error(e); res.status(500).json({ message: 'Erreur' }); }
});
`;
  server = server.substring(0, insertBefore) + newRoutes + "\n" + server.substring(insertBefore);
  fs.writeFileSync("/app/server.js", server);
  fs.copyFileSync("/app/server.js", "/app/server.cjs");
  
  try {
    require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
    console.log("Server routes added - SYNTAX OK");
  } catch (e) {
    console.log("SYNTAX ERROR: " + e.stderr.split('\n')[0]);
    process.exit(1);
  }
} else {
  console.log("Server routes already present");
}

// ═══ 3. RESTRUCTURE MENU: "Gestion des Employés" avec sous-menu ═══
let layout = fs.readFileSync("/app/src/components/Layout/InternalLayout.tsx", "utf8");

// Remove all current "RH — " entries and replace with grouped "Gestion des Employés"
const oldSecretaire = `'Secrétaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/hr/personnel', label: 'RH — Personnel', icon: UserCheck },
        { path: '/internal/hr/payroll', label: 'RH — Paie', icon: DollarSign },
        { path: '/internal/hr/leave', label: 'RH — Congés', icon: Calendar },
        { path: '/internal/hr/attendance', label: 'RH — Présences', icon: Clock },
        { path: '/internal/hr/trainings', label: 'RH — Formations', icon: BookOpen },
        { path: '/internal/hr/evaluations', label: 'RH — Évaluations', icon: Target },
        { path: '/internal/hr/contracts', label: 'RH — Contrats', icon: FileText },
        { path: '/internal/hr/disciplinary', label: 'RH — Discipline', icon: Shield },
        { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
        { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],`;

const newSecretaire = `'Secrétaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion des Employés', icon: Briefcase, children: [
          { path: '/internal/hr/personnel', label: 'Personnel', icon: UserCheck },
          { path: '/internal/hr/organigram', label: 'Organigramme', icon: Network },
          { path: '/internal/hr/attendance', label: 'Présences', icon: Clock },
          { path: '/internal/hr/leave', label: 'Congés', icon: Calendar },
          { path: '/internal/hr/contracts', label: 'Contrats', icon: FileText },
          { path: '/internal/hr/payroll', label: 'Paie', icon: DollarSign },
          { path: '/internal/hr/evaluations', label: 'Évaluations', icon: Target },
          { path: '/internal/hr/trainings', label: 'Formations', icon: BookOpen },
          { path: '/internal/hr/disciplinary', label: 'Discipline', icon: Shield },
        ]},
        { section: 'Collaboration', icon: Activity, children: [
          { path: '/internal/hr/agenda', label: 'Agenda', icon: CalendarDays },
          { path: '/internal/hr/meetings', label: 'Réunions', icon: Video },
          { path: '/internal/hr/resources', label: 'Ressources', icon: Library },
        ]},
        { section: 'Administration', icon: Inbox, children: [
          { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
          { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],`;

if (layout.includes(oldSecretaire)) {
  layout = layout.replace(oldSecretaire, newSecretaire);
  console.log("Secretaire menu restructured");
} else {
  console.log("Secretaire menu already updated (skipping)");
}

// Add new icon imports
const iconsToAdd = ['Briefcase', 'Network', 'CalendarDays', 'Video', 'Library', 'Activity'];
iconsToAdd.forEach(icon => {
  if (!layout.match(new RegExp('\\b' + icon + '\\b[,\\s]*\\n?} from .lucide-react'))) {
    layout = layout.replace(/  Clock,\n} from 'lucide-react';/, `  Clock,\n  ${icon},\n} from 'lucide-react';`);
  }
});

fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", layout);

// ═══ 4. UPDATE RENDERING to support sections ═══
// Find the menu rendering part and add section support
const oldRender = `<nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}`;

const newRender = `<nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item: any, idx: number) => {
          // Section with children (grouped menu)
          if (item.children) {
            const SectionIcon = item.icon;
            return (
              <div key={idx} className="pt-3 first:pt-0">
                <div className="px-3 py-1 flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <SectionIcon className="w-3.5 h-3.5" />
                  {item.section}
                </div>
                <div className="mt-1 space-y-0.5">
                  {item.children.map((sub: any) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={() => setSidebarOpen(false)}
                        className={\`flex items-center px-3 py-2 rounded-md text-sm transition-colors \${
                          isActiveLink(sub.path)
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }\`}
                      >
                        <SubIcon className="w-4 h-4 mr-3" />
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          // Normal item
          const Icon = item.icon;
          return (
            <Link
              key={item.path}`;

if (layout.includes(oldRender)) {
  layout = layout.replace(oldRender, newRender);
  fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", layout);
  console.log("Menu rendering updated with sections");
} else {
  console.log("Menu rendering already updated");
}

console.log("\nLot 1 server + menu DONE");
