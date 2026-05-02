const db = require("better-sqlite3")("/app/data/app.db");

// Create all HR tables
db.exec(`
  -- Personnel (agents PAIDE)
  CREATE TABLE IF NOT EXISTS hr_personnel (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    matricule TEXT UNIQUE,
    name TEXT NOT NULL,
    postnom TEXT,
    prenom TEXT,
    gender TEXT,
    birth_date TEXT,
    nationality TEXT DEFAULT 'Congolaise',
    phone TEXT,
    email TEXT,
    address TEXT,
    post TEXT,
    level TEXT,
    province TEXT,
    sous_province TEXT,
    center_id INTEGER,
    hire_date TEXT,
    status TEXT DEFAULT 'active',
    salary INTEGER,
    photo_url TEXT,
    user_id INTEGER,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  -- Paie
  CREATE TABLE IF NOT EXISTS hr_payroll (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnel_id INTEGER NOT NULL,
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    base_salary INTEGER DEFAULT 0,
    bonus INTEGER DEFAULT 0,
    advance INTEGER DEFAULT 0,
    deduction INTEGER DEFAULT 0,
    net_salary INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft',
    paid_date TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(personnel_id) REFERENCES hr_personnel(id)
  );
  
  -- Congés
  CREATE TABLE IF NOT EXISTS hr_leave (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnel_id INTEGER NOT NULL,
    type TEXT DEFAULT 'annuel',
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    days INTEGER NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    approved_date TEXT,
    comment TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(personnel_id) REFERENCES hr_personnel(id)
  );
  
  -- Présences
  CREATE TABLE IF NOT EXISTS hr_attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnel_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    status TEXT DEFAULT 'present',
    check_in TEXT,
    check_out TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(personnel_id) REFERENCES hr_personnel(id),
    UNIQUE(personnel_id, date)
  );
  
  -- Formations internes
  CREATE TABLE IF NOT EXISTS hr_trainings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    trainer TEXT,
    start_date TEXT,
    end_date TEXT,
    location TEXT,
    status TEXT DEFAULT 'planned',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE TABLE IF NOT EXISTS hr_training_participants (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    training_id INTEGER NOT NULL,
    personnel_id INTEGER NOT NULL,
    result TEXT,
    FOREIGN KEY(training_id) REFERENCES hr_trainings(id),
    FOREIGN KEY(personnel_id) REFERENCES hr_personnel(id)
  );
  
  -- Évaluations annuelles
  CREATE TABLE IF NOT EXISTS hr_evaluations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnel_id INTEGER NOT NULL,
    year INTEGER NOT NULL,
    performance_score INTEGER,
    punctuality_score INTEGER,
    teamwork_score INTEGER,
    initiative_score INTEGER,
    global_score INTEGER,
    strengths TEXT,
    improvements TEXT,
    objectives TEXT,
    evaluator_id INTEGER,
    status TEXT DEFAULT 'draft',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(personnel_id) REFERENCES hr_personnel(id)
  );
  
  -- Contrats
  CREATE TABLE IF NOT EXISTS hr_contracts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnel_id INTEGER NOT NULL,
    type TEXT DEFAULT 'CDI',
    start_date TEXT NOT NULL,
    end_date TEXT,
    salary INTEGER,
    position TEXT,
    status TEXT DEFAULT 'active',
    document_url TEXT,
    notes TEXT,
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(personnel_id) REFERENCES hr_personnel(id)
  );
  
  -- Disciplinaire
  CREATE TABLE IF NOT EXISTS hr_disciplinary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    personnel_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    severity TEXT DEFAULT 'warning',
    date TEXT NOT NULL,
    reason TEXT NOT NULL,
    decision TEXT,
    status TEXT DEFAULT 'pending',
    created_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(personnel_id) REFERENCES hr_personnel(id)
  );
  
  -- Workflow d'approbation général
  CREATE TABLE IF NOT EXISTS hr_approvals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    module TEXT NOT NULL,
    record_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    requested_by INTEGER NOT NULL,
    requested_level TEXT NOT NULL,
    target_level TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    approved_by INTEGER,
    approved_date TEXT,
    comment TEXT,
    payload TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
  
  CREATE INDEX IF NOT EXISTS idx_hr_approvals_status ON hr_approvals(status, target_level);
  CREATE INDEX IF NOT EXISTS idx_hr_personnel_level ON hr_personnel(level, province);
`);

console.log("HR tables created:");
["hr_personnel","hr_payroll","hr_leave","hr_attendance","hr_trainings","hr_evaluations","hr_contracts","hr_disciplinary","hr_approvals"].forEach(t => {
  console.log("  " + t + ": " + db.prepare("SELECT COUNT(*) as c FROM " + t).get().c + " rows");
});
