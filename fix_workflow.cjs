const fs = require("fs");

// ====== 1. FIX MENUS IN InternalLayout.tsx ======
let layout = fs.readFileSync("/app/src/components/Layout/InternalLayout.tsx", "utf8");

// Replace the entire roleBasedItems object
const oldRoleItems = layout.match(/const roleBasedItems[\s\S]*?return roleBasedItems\[user\?\.\post \|\| 'default'\] \|\| roleBasedItems\['default'\];/);
if (!oldRoleItems) { console.log("ERROR: roleBasedItems not found"); process.exit(1); }

const newRoleItems = `const roleBasedItems: { [key: string]: any[] } = {
      // ═══ NIVEAU MINISTÈRE ═══
      'Ministre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/decisions', label: 'Décisions', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ NIVEAU NATIONAL ═══
      'Coordinateur National': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/centers', label: 'Centres', icon: Building },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/decisions', label: 'Décisions', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Chargé de Plan': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/centers', label: 'Centres', icon: Building },
        { path: '/internal/journal', label: 'Journal', icon: Calendar },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Chargé de Formation': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/formateurs', label: 'Formateurs', icon: UserCheck },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/statistiques', label: 'Statistiques', icon: Target },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Chargé de Suivi': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/statistiques', label: 'Statistiques', icon: Target },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Chargé des Opérations': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/journal', label: 'Journal', icon: Calendar },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ NIVEAU PROVINCIAL ═══
      'Coordinateur Provincial': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/centers', label: 'Centres', icon: Building },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/decisions', label: 'Décisions', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ NIVEAU SOUS-PROVINCIAL ═══
      'Coordinateur Sous-Provincial': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/centers', label: 'Centres', icon: Building },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ NIVEAU CENTRE ═══
      'Chef de Centre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/personnel', label: 'Personnel', icon: Users },
        { path: '/internal/equipement', label: 'Équipement', icon: Building },
        { path: '/internal/discipline', label: 'Discipline', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Directeur Centre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/personnel', label: 'Personnel', icon: Users },
        { path: '/internal/equipement', label: 'Équipement', icon: Building },
        { path: '/internal/discipline', label: 'Discipline', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Intendant': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/equipement', label: 'Équipement', icon: Building },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Disciplinaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/discipline', label: 'Discipline', icon: Shield },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Assistant Social': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/discipline', label: 'Discipline', icon: Shield },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ SECRÉTAIRE (tous niveaux) ═══
      'Secrétaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/users', label: 'Utilisateurs', icon: Users },
        { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
        { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ DEFAULT ═══
      'default': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        { path: '/internal/reports', label: 'Rapports', icon: FileText }
      ]
    };

    return roleBasedItems[user?.post || 'default'] || roleBasedItems['default'];`;

layout = layout.replace(oldRoleItems[0], newRoleItems);
fs.writeFileSync("/app/src/components/Layout/InternalLayout.tsx", layout);
console.log("1. MENUS FIXED");

// ====== 2. ADD DECISIONS TABLE + ROUTES IN SERVER.JS ======
let server = fs.readFileSync("/app/server.js", "utf8");

// Add decisions table if not exists (in the DB init section)
const dbInitEnd = server.indexOf("Utilisateurs existants:");
if (dbInitEnd > -1) {
  const insertPoint = server.lastIndexOf("db.exec(", dbInitEnd);
  if (insertPoint > -1) {
    // Check if decisions table already created
    if (!server.includes("CREATE TABLE IF NOT EXISTS decision_requests")) {
      const createDecisions = `
  // Decisions workflow tables
  db.exec(\`
    CREATE TABLE IF NOT EXISTS decision_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      submitted_by INTEGER NOT NULL,
      submitted_level TEXT NOT NULL,
      target_level TEXT NOT NULL,
      target_user_id INTEGER,
      status TEXT DEFAULT 'pending',
      decision_by INTEGER,
      decision_comment TEXT,
      decision_date TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(submitted_by) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS decision_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      level TEXT NOT NULL,
      type_name TEXT NOT NULL
    );
  \`);
  // Seed decision types if empty
  const dtCount = db.prepare('SELECT COUNT(*) as c FROM decision_types').get().c;
  if (dtCount === 0) {
    const types = [
      ['ministere', 'Budget annuel'],
      ['ministere', 'Ouverture de centre'],
      ['ministere', 'Fermeture de centre'],
      ['ministere', 'Nomination'],
      ['ministere', 'Orientation stratégique'],
      ['national', 'Affectation de formation'],
      ['national', 'Validation de rapport'],
      ['national', 'Réallocation de ressources'],
      ['provincial', 'Validation inscriptions'],
      ['provincial', 'Approbation de rapport'],
      ['provincial', 'Demande équipement'],
    ];
    const ins = db.prepare('INSERT INTO decision_types (level, type_name) VALUES (?, ?)');
    types.forEach(t => ins.run(t[0], t[1]));
  }
`;
      // Insert after the last db.exec block before "Utilisateurs existants"
      const lastExec = server.lastIndexOf("db.exec(`", dbInitEnd);
      const afterExec = server.indexOf("`);", lastExec) + 3;
      server = server.substring(0, afterExec) + "\n" + createDecisions + server.substring(afterExec);
      console.log("2. DECISIONS TABLES ADDED");
    } else {
      console.log("2. DECISIONS TABLES ALREADY EXIST");
    }
  }
}

// Replace the GET /api/internal/decisions route with full workflow
const decisionsGetStart = server.indexOf("app.get('/api/internal/decisions'");
if (decisionsGetStart > -1) {
  // Find the end of this route
  let braces = 0;
  let end = decisionsGetStart;
  let started = false;
  for (let i = decisionsGetStart; i < server.length; i++) {
    if (server[i] === '{') { braces++; started = true; }
    if (server[i] === '}') braces--;
    if (started && braces === 0) { end = i + 1; break; }
  }
  // Also find the POST decisions route
  const decisionsPostStart = server.indexOf("app.post('/api/internal/decisions");
  let postEnd = decisionsPostStart;
  if (decisionsPostStart > -1) {
    braces = 0; started = false;
    for (let i = decisionsPostStart; i < server.length; i++) {
      if (server[i] === '{') { braces++; started = true; }
      if (server[i] === '}') braces--;
      if (started && braces === 0) { postEnd = i + 1; break; }
    }
  }

  const replaceEnd = Math.max(end, postEnd);
  
  const newDecisionRoutes = `// ═══ DECISIONS WORKFLOW ═══
// GET: liste des décisions (soumises + reçues)
app.get('/api/internal/decisions', authenticateToken, (req, res) => {
  try {
    const me = req.user;
    const levels = ['ministere', 'national', 'provincial', 'sous_provincial', 'centre'];
    const myIndex = levels.indexOf(me.level);
    
    // Décisions que j'ai soumises
    let submitted = [];
    try { submitted = db.prepare('SELECT d.*, u.name as submitted_by_name, u.post as submitted_by_post, v.name as decision_by_name FROM decision_requests d JOIN users u ON d.submitted_by = u.id LEFT JOIN users v ON d.decision_by = v.id WHERE d.submitted_by = ? ORDER BY d.created_at DESC').all(me.id); } catch {}
    
    // Décisions en attente pour moi (niveau supérieur)
    let pending = [];
    const responsablePosts = ['Ministre', 'Coordinateur National', 'Coordinateur Provincial', 'Coordinateur Sous-Provincial', 'Chef de Centre'];
    if (responsablePosts.includes(me.post) || me.level === 'superadmin') {
      try { pending = db.prepare('SELECT d.*, u.name as submitted_by_name, u.post as submitted_by_post FROM decision_requests d JOIN users u ON d.submitted_by = u.id WHERE d.target_level = ? AND d.status = ? ORDER BY d.created_at DESC').all(me.level, 'pending'); } catch {}
    }
    
    // Historique des décisions que j'ai prises
    let decided = [];
    try { decided = db.prepare('SELECT d.*, u.name as submitted_by_name, u.post as submitted_by_post FROM decision_requests d JOIN users u ON d.submitted_by = u.id WHERE d.decision_by = ? ORDER BY d.decision_date DESC').all(me.id); } catch {}
    
    // Types de décisions disponibles pour mon niveau
    let types = [];
    if (myIndex > 0) {
      try { types = db.prepare('SELECT * FROM decision_types WHERE level = ?').all(levels[myIndex - 1]); } catch {}
    }
    
    res.json({ submitted, pending, decided, types, myLevel: me.level, myPost: me.post });
  } catch (error) {
    console.error('Erreur decisions:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// POST: soumettre une demande de décision
app.post('/api/internal/decisions', authenticateToken, (req, res) => {
  try {
    const me = req.user;
    const { title, description, type } = req.body;
    if (!title || !type) return res.status(400).json({ message: 'Titre et type requis' });
    
    const levels = ['ministere', 'national', 'provincial', 'sous_provincial', 'centre'];
    const myIndex = levels.indexOf(me.level);
    if (myIndex <= 0) return res.status(403).json({ message: 'Le niveau supérieur ne peut pas soumettre de demande' });
    
    const targetLevel = levels[myIndex - 1];
    
    const result = db.prepare('INSERT INTO decision_requests (title, description, type, submitted_by, submitted_level, target_level, status) VALUES (?,?,?,?,?,?,?)').run(
      title, description || '', type, me.id, me.level, targetLevel, 'pending'
    );
    
    // Notification au niveau supérieur
    try {
      const targets = db.prepare("SELECT id FROM users WHERE level = ? AND status = 'active'").all(targetLevel);
      const notifStmt = db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?,?,?,?)');
      targets.forEach(t => {
        notifStmt.run(t.id, 'decision', 'Nouvelle demande', me.name + ' (' + me.post + ') a soumis: ' + title);
      });
    } catch {}
    
    res.status(201).json({ id: result.lastInsertRowid, message: 'Demande soumise' });
  } catch (error) {
    console.error('Erreur submit decision:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// PUT: approuver/rejeter/demander complément
app.put('/api/internal/decisions/:id', authenticateToken, (req, res) => {
  try {
    const me = req.user;
    const { status, comment } = req.body;
    const id = parseInt(req.params.id);
    
    if (!['approved', 'rejected', 'needs_info'].includes(status)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    
    const decision = db.prepare('SELECT * FROM decision_requests WHERE id = ?').get(id);
    if (!decision) return res.status(404).json({ message: 'Décision non trouvée' });
    if (decision.target_level !== me.level && me.level !== 'superadmin') {
      return res.status(403).json({ message: 'Vous ne pouvez pas traiter cette demande' });
    }
    
    db.prepare('UPDATE decision_requests SET status = ?, decision_by = ?, decision_comment = ?, decision_date = datetime(?) WHERE id = ?').run(
      status, me.id, comment || '', 'now', id
    );
    
    // Notification au demandeur
    const statusLabels = { approved: 'approuvée', rejected: 'rejetée', needs_info: 'en attente de complément' };
    try {
      db.prepare('INSERT INTO notifications (user_id, type, title, message) VALUES (?,?,?,?)').run(
        decision.submitted_by, 'decision', 'Décision ' + statusLabels[status],
        'Votre demande "' + decision.title + '" a été ' + statusLabels[status] + (comment ? '. Commentaire: ' + comment : '')
      );
    } catch {}
    
    res.json({ message: 'Décision ' + statusLabels[status] });
  } catch (error) {
    console.error('Erreur decision update:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});`;

  server = server.substring(0, decisionsGetStart) + newDecisionRoutes + "\n\n" + server.substring(replaceEnd);
  console.log("3. DECISIONS ROUTES REPLACED");
} else {
  console.log("3. DECISIONS GET ROUTE NOT FOUND - skipping");
}

fs.writeFileSync("/app/server.js", server);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("\nALL DONE — SYNTAX OK");
} catch (e) {
  const m = e.stderr.match(/server\.cjs:(\d+)/);
  const lines = server.split("\n");
  if (m) console.log("SYNTAX ERROR at line " + m[1] + ": " + lines[parseInt(m[1])-1].trim());
  else console.log("SYNTAX ERROR: " + e.stderr.split("\n")[0]);
}
