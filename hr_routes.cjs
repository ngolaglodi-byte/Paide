const fs = require("fs");
let code = fs.readFileSync("/app/server.js", "utf8");

// Check if already added
if (code.includes("api/internal/hr/")) {
  console.log("HR routes already present");
  process.exit(0);
}

// Find a good insertion point — right before "// Démarrage serveur" or at the end
const insertBefore = code.lastIndexOf("app.listen(");
if (insertBefore === -1) { console.log("Insert point not found"); process.exit(1); }

const hrRoutes = `
// ═══════════════════════════════════════════════════════════════
// HR MODULE — Gestion des Ressources Humaines
// Workflow: Secrétaire crée/modifie → Responsable niveau approuve
// ═══════════════════════════════════════════════════════════════

// Helper: scope par niveau hiérarchique
function hrScopeFilter(user) {
  if (user.level === 'superadmin' || user.level === 'ministere') return {};
  if (user.level === 'national') return { level: 'national' };
  if (user.level === 'provincial') return { province: user.province };
  if (user.level === 'sous_provincial') return { sous_province: user.sous_province };
  if (user.level === 'centre') return { center_id: user.center_id };
  return { _denied: true };
}

function hrCanApprove(user) {
  const responsables = ['Ministre','Coordinateur National','Coordinateur Provincial','Coordinateur Sous-Provincial','Chef de Centre','Super Administrateur'];
  return responsables.includes(user.post) || user.level === 'superadmin';
}

function hrIsSecretaire(user) {
  return user.post === 'Secrétaire' || user.level === 'superadmin';
}

// Helper: submit pour approbation
function submitForApproval(db, module, recordId, action, user, payload) {
  const levels = ['ministere','national','provincial','sous_provincial','centre'];
  const targetLevel = user.level === 'superadmin' ? 'superadmin' : user.level;
  return db.prepare("INSERT INTO hr_approvals (module, record_id, action, requested_by, requested_level, target_level, status, payload) VALUES (?,?,?,?,?,?,?,?)").run(
    module, recordId, action, user.id, user.level, targetLevel, 'pending', JSON.stringify(payload || {})
  );
}

// ─── PERSONNEL ───
app.get('/api/internal/hr/personnel', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    if (scope._denied) return res.json([]);
    let query = "SELECT * FROM hr_personnel WHERE 1=1";
    const params = [];
    if (scope.level) { query += " AND level = ?"; params.push(scope.level); }
    if (scope.province) { query += " AND province = ?"; params.push(scope.province); }
    if (scope.sous_province) { query += " AND sous_province = ?"; params.push(scope.sous_province); }
    if (scope.center_id) { query += " AND center_id = ?"; params.push(scope.center_id); }
    query += " ORDER BY created_at DESC";
    res.json(db.prepare(query).all(...params));
  } catch (e) { console.error('HR personnel error:', e.message); res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/personnel', authenticateToken, (req, res) => {
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
});

app.put('/api/internal/hr/personnel/:id', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const id = parseInt(req.params.id);
    const p = req.body;
    db.prepare("UPDATE hr_personnel SET matricule=COALESCE(?,matricule),name=COALESCE(?,name),postnom=COALESCE(?,postnom),prenom=COALESCE(?,prenom),phone=COALESCE(?,phone),email=COALESCE(?,email),address=COALESCE(?,address),post=COALESCE(?,post),salary=COALESCE(?,salary),status=COALESCE(?,status),updated_at=CURRENT_TIMESTAMP WHERE id=?").run(
      p.matricule||null, p.name||null, p.postnom||null, p.prenom||null, p.phone||null, p.email||null, p.address||null, p.post||null, p.salary||null, p.status||null, id
    );
    submitForApproval(db, 'personnel', id, 'update', req.user, p);
    res.json({ message: 'Modification en attente d\\'approbation' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── PAIE ───
app.get('/api/internal/hr/payroll', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let query = "SELECT pay.*, p.name as personnel_name, p.matricule FROM hr_payroll pay JOIN hr_personnel p ON pay.personnel_id = p.id WHERE 1=1";
    const params = [];
    if (scope.province) { query += " AND p.province = ?"; params.push(scope.province); }
    if (scope.center_id) { query += " AND p.center_id = ?"; params.push(scope.center_id); }
    query += " ORDER BY pay.year DESC, pay.month DESC";
    res.json(db.prepare(query).all(...params));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/payroll', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    const net = (p.base_salary||0) + (p.bonus||0) - (p.advance||0) - (p.deduction||0);
    const r = db.prepare("INSERT INTO hr_payroll (personnel_id,month,year,base_salary,bonus,advance,deduction,net_salary,notes,created_by) VALUES (?,?,?,?,?,?,?,?,?,?)").run(
      p.personnel_id, p.month, p.year, p.base_salary||0, p.bonus||0, p.advance||0, p.deduction||0, net, p.notes||null, req.user.id
    );
    submitForApproval(db, 'payroll', r.lastInsertRowid, 'create', req.user, p);
    res.status(201).json({ id: r.lastInsertRowid, net, message: 'Paie créée, en attente d\\'approbation' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── CONGÉS ───
app.get('/api/internal/hr/leave', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let query = "SELECT l.*, p.name as personnel_name, p.matricule FROM hr_leave l JOIN hr_personnel p ON l.personnel_id = p.id WHERE 1=1";
    const params = [];
    if (scope.province) { query += " AND p.province = ?"; params.push(scope.province); }
    if (scope.center_id) { query += " AND p.center_id = ?"; params.push(scope.center_id); }
    query += " ORDER BY l.created_at DESC";
    res.json(db.prepare(query).all(...params));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/leave', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    const r = db.prepare("INSERT INTO hr_leave (personnel_id,type,start_date,end_date,days,reason,created_by) VALUES (?,?,?,?,?,?,?)").run(
      p.personnel_id, p.type||'annuel', p.start_date, p.end_date, p.days, p.reason||null, req.user.id
    );
    submitForApproval(db, 'leave', r.lastInsertRowid, 'create', req.user, p);
    res.status(201).json({ id: r.lastInsertRowid, message: 'Demande de congé soumise' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── PRÉSENCES ───
app.get('/api/internal/hr/attendance', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    const month = req.query.month || new Date().toISOString().substring(0,7);
    let query = "SELECT a.*, p.name as personnel_name, p.matricule FROM hr_attendance a JOIN hr_personnel p ON a.personnel_id = p.id WHERE a.date LIKE ?";
    const params = [month + '%'];
    if (scope.province) { query += " AND p.province = ?"; params.push(scope.province); }
    if (scope.center_id) { query += " AND p.center_id = ?"; params.push(scope.center_id); }
    query += " ORDER BY a.date DESC";
    res.json(db.prepare(query).all(...params));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/attendance', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    db.prepare("INSERT OR REPLACE INTO hr_attendance (personnel_id,date,status,check_in,check_out,notes,created_by) VALUES (?,?,?,?,?,?,?)").run(
      p.personnel_id, p.date, p.status||'present', p.check_in||null, p.check_out||null, p.notes||null, req.user.id
    );
    res.status(201).json({ message: 'Présence enregistrée' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── FORMATIONS INTERNES ───
app.get('/api/internal/hr/trainings', authenticateToken, (req, res) => {
  try {
    const trainings = db.prepare("SELECT * FROM hr_trainings ORDER BY start_date DESC").all();
    res.json(trainings);
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/trainings', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    const r = db.prepare("INSERT INTO hr_trainings (title,description,trainer,start_date,end_date,location,created_by) VALUES (?,?,?,?,?,?,?)").run(
      p.title, p.description||null, p.trainer||null, p.start_date||null, p.end_date||null, p.location||null, req.user.id
    );
    submitForApproval(db, 'training', r.lastInsertRowid, 'create', req.user, p);
    res.status(201).json({ id: r.lastInsertRowid, message: 'Formation créée, en attente d\\'approbation' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── ÉVALUATIONS ───
app.get('/api/internal/hr/evaluations', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let query = "SELECT e.*, p.name as personnel_name FROM hr_evaluations e JOIN hr_personnel p ON e.personnel_id = p.id WHERE 1=1";
    const params = [];
    if (scope.province) { query += " AND p.province = ?"; params.push(scope.province); }
    if (scope.center_id) { query += " AND p.center_id = ?"; params.push(scope.center_id); }
    query += " ORDER BY e.year DESC";
    res.json(db.prepare(query).all(...params));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/evaluations', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    const global = Math.round(((p.performance_score||0) + (p.punctuality_score||0) + (p.teamwork_score||0) + (p.initiative_score||0)) / 4);
    const r = db.prepare("INSERT INTO hr_evaluations (personnel_id,year,performance_score,punctuality_score,teamwork_score,initiative_score,global_score,strengths,improvements,objectives,evaluator_id) VALUES (?,?,?,?,?,?,?,?,?,?,?)").run(
      p.personnel_id, p.year, p.performance_score||0, p.punctuality_score||0, p.teamwork_score||0, p.initiative_score||0, global, p.strengths||null, p.improvements||null, p.objectives||null, req.user.id
    );
    submitForApproval(db, 'evaluation', r.lastInsertRowid, 'create', req.user, p);
    res.status(201).json({ id: r.lastInsertRowid, global, message: 'Évaluation soumise' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── CONTRATS ───
app.get('/api/internal/hr/contracts', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let query = "SELECT c.*, p.name as personnel_name, p.matricule FROM hr_contracts c JOIN hr_personnel p ON c.personnel_id = p.id WHERE 1=1";
    const params = [];
    if (scope.province) { query += " AND p.province = ?"; params.push(scope.province); }
    if (scope.center_id) { query += " AND p.center_id = ?"; params.push(scope.center_id); }
    query += " ORDER BY c.start_date DESC";
    res.json(db.prepare(query).all(...params));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/contracts', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    const r = db.prepare("INSERT INTO hr_contracts (personnel_id,type,start_date,end_date,salary,position,notes,created_by) VALUES (?,?,?,?,?,?,?,?)").run(
      p.personnel_id, p.type||'CDI', p.start_date, p.end_date||null, p.salary||null, p.position||null, p.notes||null, req.user.id
    );
    submitForApproval(db, 'contract', r.lastInsertRowid, 'create', req.user, p);
    res.status(201).json({ id: r.lastInsertRowid, message: 'Contrat soumis' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── DISCIPLINAIRE ───
app.get('/api/internal/hr/disciplinary', authenticateToken, (req, res) => {
  try {
    const scope = hrScopeFilter(req.user);
    let query = "SELECT d.*, p.name as personnel_name, p.matricule FROM hr_disciplinary d JOIN hr_personnel p ON d.personnel_id = p.id WHERE 1=1";
    const params = [];
    if (scope.province) { query += " AND p.province = ?"; params.push(scope.province); }
    if (scope.center_id) { query += " AND p.center_id = ?"; params.push(scope.center_id); }
    query += " ORDER BY d.date DESC";
    res.json(db.prepare(query).all(...params));
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

app.post('/api/internal/hr/disciplinary', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const p = req.body;
    const r = db.prepare("INSERT INTO hr_disciplinary (personnel_id,type,severity,date,reason,decision,created_by) VALUES (?,?,?,?,?,?,?)").run(
      p.personnel_id, p.type, p.severity||'warning', p.date, p.reason, p.decision||null, req.user.id
    );
    submitForApproval(db, 'disciplinary', r.lastInsertRowid, 'create', req.user, p);
    res.status(201).json({ id: r.lastInsertRowid, message: 'Sanction soumise pour approbation' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── APPROBATIONS (pour les responsables) ───
app.get('/api/internal/hr/approvals', authenticateToken, (req, res) => {
  try {
    if (!hrCanApprove(req.user)) return res.json({ pending: [], history: [] });
    const targetLevel = req.user.level === 'superadmin' ? null : req.user.level;
    let pending, history;
    if (targetLevel) {
      pending = db.prepare("SELECT a.*, u.name as requester_name FROM hr_approvals a LEFT JOIN users u ON a.requested_by = u.id WHERE a.target_level = ? AND a.status = ? ORDER BY a.created_at DESC").all(targetLevel, 'pending');
      history = db.prepare("SELECT a.*, u.name as requester_name FROM hr_approvals a LEFT JOIN users u ON a.requested_by = u.id WHERE a.approved_by = ? ORDER BY a.approved_date DESC LIMIT 50").all(req.user.id);
    } else {
      pending = db.prepare("SELECT a.*, u.name as requester_name FROM hr_approvals a LEFT JOIN users u ON a.requested_by = u.id WHERE a.status = ? ORDER BY a.created_at DESC").all('pending');
      history = db.prepare("SELECT a.*, u.name as requester_name FROM hr_approvals a LEFT JOIN users u ON a.requested_by = u.id WHERE a.status != ? ORDER BY a.approved_date DESC LIMIT 50").all('pending');
    }
    res.json({ pending, history });
  } catch (e) { console.error('HR approvals:', e.message); res.status(500).json({ message: 'Erreur' }); }
});

app.put('/api/internal/hr/approvals/:id', authenticateToken, (req, res) => {
  try {
    if (!hrCanApprove(req.user)) return res.status(403).json({ message: 'Réservé aux responsables' });
    const id = parseInt(req.params.id);
    const { status, comment } = req.body;
    if (!['approved','rejected'].includes(status)) return res.status(400).json({ message: 'Statut invalide' });
    db.prepare("UPDATE hr_approvals SET status=?, approved_by=?, approved_date=datetime('now'), comment=? WHERE id=?").run(status, req.user.id, comment||null, id);
    res.json({ message: 'Décision enregistrée' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

`;

code = code.substring(0, insertBefore) + hrRoutes + "\n" + code.substring(insertBefore);
fs.writeFileSync("/app/server.js", code);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("HR ROUTES ADDED - SYNTAX OK");
} catch (e) {
  const m = e.stderr.match(/server\.cjs:(\d+)/);
  if (m) { const lines = code.split('\n'); console.log("ERROR line " + m[1] + ": " + lines[parseInt(m[1])-1].trim()); }
  else console.log("ERROR: " + e.stderr.split('\n')[0]);
}
