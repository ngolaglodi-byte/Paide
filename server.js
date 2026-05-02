const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sqlite3 = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const crypto = require('crypto');

// Créer le dossier uploads dans /app/data/ (volume persistant)
const uploadsDir = path.join(__dirname, 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Config multer pour upload de fichiers
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    let ext = path.extname(file.originalname);
    // Si pas d'extension, déduire du MIME type
    if (!ext || ext === '.') {
      const mimeExts = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/gif': '.gif', 'image/webp': '.webp', 'application/pdf': '.pdf' };
      ext = mimeExts[file.mimetype] || '.bin';
    }
    cb(null, Date.now() + '-' + Math.random().toString(36).substr(2, 9) + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

const app = express();
const PORT = process.env.PORT || 3000;

// ── SÉCURITÉ: JWT Secret dynamique (jamais en dur en production) ──
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  const secretPath = path.join(__dirname, 'data', '.jwt_secret');
  if (fs.existsSync(secretPath)) return fs.readFileSync(secretPath, 'utf8').trim();
  const secret = crypto.randomBytes(64).toString('hex');
  fs.writeFileSync(secretPath, secret);
  console.log('[Security] JWT secret generated and saved');
  return secret;
})();

// ── SÉCURITÉ: Rate limiting login (anti brute force) ──
const loginAttempts = new Map(); // IP -> { count, lastAttempt, blocked }
const RATE_LIMIT_MAX = 5;       // 5 tentatives
const RATE_LIMIT_WINDOW = 60000; // par minute
const RATE_LIMIT_BLOCK = 300000; // blocage 5 min après dépassement

function checkLoginRateLimit(ip) {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry) { loginAttempts.set(ip, { count: 1, firstAttempt: now, blocked: false }); return true; }
  if (entry.blocked && (now - entry.blockedAt) < RATE_LIMIT_BLOCK) return false;
  if (entry.blocked) { loginAttempts.delete(ip); return true; }
  if ((now - entry.firstAttempt) > RATE_LIMIT_WINDOW) { loginAttempts.set(ip, { count: 1, firstAttempt: now, blocked: false }); return true; }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) { entry.blocked = true; entry.blockedAt = now; return false; }
  return true;
}
// Nettoyage périodique
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of loginAttempts) {
    if ((now - (entry.blockedAt || entry.firstAttempt)) > RATE_LIMIT_BLOCK * 2) loginAttempts.delete(ip);
  }
}, 600000);

// ── SÉCURITÉ: Logs d'audit ──
function auditLog(action, details) {
  try {
    const logDir = path.join(__dirname, 'data', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    const date = new Date().toISOString().split('T')[0];
    const logFile = path.join(logDir, `audit-${date}.log`);
    const line = `[${new Date().toISOString()}] ${action}: ${JSON.stringify(details)}\n`;
    fs.appendFileSync(logFile, line);
  } catch {}
}

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '5mb' }));

// ── SÉCURITÉ: Headers de sécurité ──
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.use(express.static('dist'));

// Base de données
const db = new sqlite3('/app/data/app.db');

// DOC_SCOPE_MIGRATION_V1
(function() {
  function addCol(t, c, d) {
    try { const i=db.prepare('PRAGMA table_info('+t+')').all(); if(!i.some(x=>x.name===c)){db.exec('ALTER TABLE '+t+' ADD COLUMN '+c+' '+d);console.log('[DOC-MIG] '+t+'.'+c+' ajouté');} } catch(e) {}
  }
  addCol('documents', 'level', 'TEXT');
  addCol('documents', 'province', 'TEXT');
  addCol('documents', 'center_id', 'INTEGER');
})();


// PAIDE_MECANISATION_V1
(function() {
  function addCol(table, col, def) {
    try {
      const info = db.prepare('PRAGMA table_info(' + table + ')').all();
      if (!info.some(c => c.name === col)) {
        db.exec('ALTER TABLE ' + table + ' ADD COLUMN ' + col + ' ' + def);
        console.log('[PAIDE-MIG] ' + table + '.' + col + ' ajouté');
      }
    } catch(e) { console.warn('[PAIDE-MIG] add ' + table + '.' + col + ': ' + e.message); }
  }
  function dropCol(table, col) {
    try {
      const info = db.prepare('PRAGMA table_info(' + table + ')').all();
      if (info.some(c => c.name === col)) {
        db.exec('ALTER TABLE ' + table + ' DROP COLUMN ' + col);
        console.log('[PAIDE-MIG] ' + table + '.' + col + ' supprimée');
      }
    } catch(e) { console.warn('[PAIDE-MIG] drop ' + table + '.' + col + ': ' + e.message); }
  }
  function dropTable(name) {
    try { db.exec('DROP TABLE IF EXISTS ' + name); console.log('[PAIDE-MIG] table ' + name + ' supprimée'); }
    catch(e) { console.warn('[PAIDE-MIG] drop table ' + name + ': ' + e.message); }
  }

  // Tables hors contexte PAIDE
  dropTable('hr_payroll');
  dropTable('hr_contracts');
  dropTable('finance_salary_grid');
  dropTable('finance_bank_batch');

  // Colonnes hors contexte sur hr_personnel
  dropCol('hr_personnel', 'salary');
  dropCol('hr_personnel', 'bank_account_number');
  dropCol('hr_personnel', 'bank_account_holder');
  dropCol('hr_personnel', 'bank_updated_at');
  dropCol('hr_personnel', 'current_contract_id');

  // Nouvelles colonnes — adresse structurée + suivi mécanisation
  addCol('hr_personnel', 'address_street', 'TEXT');
  addCol('hr_personnel', 'address_city', 'TEXT');
  addCol('hr_personnel', 'address_commune', 'TEXT');
  addCol('hr_personnel', 'mecanisation_sent_at', 'TEXT');
  addCol('hr_personnel', 'mecanisation_batch_id', 'INTEGER');

  // Nouvelle table — lots d'envoi Fonction Publique
  db.exec(`
    CREATE TABLE IF NOT EXISTS hr_mecanisation_batch (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      batch_number TEXT NOT NULL,
      agent_count INTEGER DEFAULT 0,
      generated_at TEXT,
      generated_by INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_mecanisation_batch_date ON hr_mecanisation_batch(generated_at);
  `);
  console.log('[PAIDE-MIG] hr_mecanisation_batch prête');
})();








// Initialisation des tables
console.log('Initialisation de la base de données SQLite...');

try {
  console.log('Test de connexion à la base de données...');
  db.exec('SELECT 1');
  console.log('✓ Connexion à la base de données réussie');

  // Table users (5 niveaux hiérarchiques PAIDE)
  console.log('Création de la table users...');
  db.exec(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    postnom TEXT,
    prenom TEXT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    level TEXT NOT NULL,
    department TEXT NOT NULL DEFAULT '',
    post TEXT NOT NULL,
    center_id INTEGER,
    province TEXT,
    sous_province TEXT,
    parent_id INTEGER,
    nationalite TEXT,
    adresse TEXT,
    matricule TEXT,
    numero_code TEXT,
    agent TEXT,
    section_name TEXT,
    status TEXT DEFAULT 'active',
    phone TEXT,
    must_change_password INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  // Migration: add must_change_password if missing
  try {
    const cols = db.prepare("PRAGMA table_info(users)").all().map(c => c.name);
    if (!cols.includes('must_change_password')) {
      db.exec("ALTER TABLE users ADD COLUMN must_change_password INTEGER DEFAULT 1");
      db.exec("UPDATE users SET must_change_password = 0 WHERE email = 'admin@paide.cd'");
    }
  } catch {}
  console.log('✓ Table users créée');

  // Table appareils autorisés
  db.exec(`CREATE TABLE IF NOT EXISTS user_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    fingerprint TEXT NOT NULL,
    device_name TEXT DEFAULT 'Appareil inconnu',
    browser TEXT,
    os TEXT,
    authorized INTEGER DEFAULT 0,
    last_used DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  )`);

  // Decisions workflow tables
  db.exec(`
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
  `);
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

  console.log('✓ Table user_devices créée');

  // Autres tables
  const tables = [
    `CREATE TABLE IF NOT EXISTS children (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      age INTEGER,
      gender TEXT,
      situation TEXT,
      center_id INTEGER,
      formation_id INTEGER,
      status TEXT DEFAULT 'active',
      enrolled_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS centers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      province TEXT NOT NULL,
      address TEXT,
      capacity INTEGER,
      manager_id INTEGER,
      status TEXT DEFAULT 'active'
    )`,
    `CREATE TABLE IF NOT EXISTS formations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      filiere TEXT NOT NULL,
      center_id INTEGER,
      trainer TEXT,
      enrolled_count INTEGER DEFAULT 0,
      start_date DATE,
      end_date DATE,
      status TEXT DEFAULT 'active'
    )`,
    `CREATE TABLE IF NOT EXISTS reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      type TEXT,
      from_user INTEGER,
      to_level TEXT,
      status TEXT DEFAULT 'pending',
      comments TEXT,
      period TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sender_id INTEGER,
      receiver_id INTEGER,
      content TEXT NOT NULL,
      read BOOLEAN DEFAULT FALSE,
      thread_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT,
      file_url TEXT,
      status TEXT DEFAULT 'pending',
      uploaded_by INTEGER,
      validated_by INTEGER,
      department TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS activities (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      action TEXT NOT NULL,
      details TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT,
      logo_url TEXT,
      description TEXT,
      website TEXT
    )`,
    `CREATE TABLE IF NOT EXISTS news (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      author TEXT,
      category TEXT,
      published INTEGER DEFAULT 1,
      image_url TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS budget (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      department TEXT,
      level TEXT,
      category TEXT,
      amount DECIMAL(10,2),
      type TEXT,
      description TEXT,
      created_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      objectives TEXT,
      progress INTEGER DEFAULT 0,
      deadline DATE,
      responsible_id INTEGER,
      department TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS mail_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reference TEXT NOT NULL,
      type TEXT,
      sender_name TEXT,
      receiver_name TEXT,
      subject TEXT,
      status TEXT DEFAULT 'pending',
      handled_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT,
      center_id INTEGER,
      quantity INTEGER,
      condition TEXT,
      managed_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS disciplinary (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      child_id INTEGER,
      type TEXT,
      description TEXT,
      action_taken TEXT,
      handled_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS page_content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page_name TEXT NOT NULL,
      section_name TEXT NOT NULL,
      content_type TEXT DEFAULT 'text',
      content_text TEXT,
      image_url TEXT,
      display_order INTEGER DEFAULT 0,
      updated_by INTEGER,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS uploads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      path TEXT NOT NULL,
      mimetype TEXT,
      size INTEGER,
      uploaded_by INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE TABLE IF NOT EXISTS user_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      doc_type TEXT NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    )`,
    `CREATE TABLE IF NOT EXISTS content (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      page TEXT NOT NULL,
      section TEXT NOT NULL,
      title TEXT,
      content TEXT,
      image_url TEXT,
      order_index INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`
  ];

  tables.forEach(sql => {
    db.exec(sql);
  });
  console.log('✓ Toutes les tables créées');

  // Vérifier si des utilisateurs existent déjà
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  console.log(`Utilisateurs existants: ${userCount.count}`);
  
  if (userCount.count === 0) {
    console.log('Initialisation des données...');

    // Centres
    const insertCenter = db.prepare(`INSERT INTO centers (name, province, address, capacity, status) VALUES (?, ?, ?, ?, ?)`);
    insertCenter.run('Centre PAIDE Kinshasa', 'Kinshasa', 'Avenue des Cliniques, Kinshasa', 200, 'active');
    insertCenter.run('Centre PAIDE Kananga', 'Kasai', 'Quartier Katoka, Kananga', 150, 'active');
    insertCenter.run('Centre PAIDE Goma', 'Nord-Kivu', 'Avenue du Lac, Goma', 180, 'active');
    insertCenter.run('Centre PAIDE Lubumbashi', 'Haut-Katanga', 'Avenue Mobutu, Lubumbashi', 220, 'active');
    insertCenter.run('Centre PAIDE Bukavu', 'Sud-Kivu', 'Avenue Patrice Lumumba, Bukavu', 160, 'active');
    console.log('✓ Centres insérés');

    // Partenaires
    const insertPartner = db.prepare(`INSERT INTO partners (name, type, description, website) VALUES (?, ?, ?, ?)`);
    insertPartner.run('UNICEF', 'International', 'Fonds des Nations Unies pour l\'enfance', 'https://unicef.org');
    insertPartner.run('UNESCO', 'International', 'Organisation des Nations Unies pour l\'éducation', 'https://unesco.org');
    insertPartner.run('Banque Mondiale', 'International', 'Institution financière internationale', 'https://worldbank.org');
    insertPartner.run('Union Européenne', 'International', 'Partenaire institutionnel européen', 'https://europa.eu');
    insertPartner.run('Gouvernement RDC', 'National', 'Ministère de la Formation Professionnelle', 'https://gouv.cd');
    insertPartner.run('ONG Locale Kinshasa', 'ONG', 'Organisation non gouvernementale locale', null);
    console.log('✓ Partenaires insérés');

    // Actualités
    const insertNews = db.prepare(`INSERT INTO news (title, content, author, category, image_url, published) VALUES (?, ?, ?, ?, ?, ?)`);
    insertNews.run('Ouverture de 5 nouveaux centres au Kasaï', 'Le PAIDE renforce sa présence dans la région du Kasaï avec l\'ouverture de nouveaux centres de formation.', 'Direction PAIDE', 'Centres', 'https://picsum.photos/seed/news1/400/250', 1);
    insertNews.run('Formation en informatique: 300 jeunes diplômés', 'Une nouvelle promotion de 300 jeunes a obtenu son certificat en informatique et bureautique.', 'Service Formation', 'Formation', 'https://picsum.photos/seed/news2/400/250', 1);
    insertNews.run('Partenariat avec UNICEF pour 2024-2026', 'Signature d\'un accord de partenariat stratégique avec UNICEF pour renforcer nos programmes.', 'Direction PAIDE', 'Partenariat', 'https://picsum.photos/seed/news3/400/250', 1);
    console.log('✓ Actualités insérées');

    // Hiérarchie PAIDE complète
    console.log('Création de la hiérarchie PAIDE...');
    const insertUser = db.prepare(`INSERT INTO users (name, postnom, prenom, email, password, level, department, post, province, sous_province, matricule, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
    
    // SUPER ADMIN
    insertUser.run('Super', 'Administrateur', 'PAIDE', 'admin@paide.cd', bcrypt.hashSync('SuperAdmin2024!', 10), 'superadmin', 'direction', 'Super Administrateur', 'Kinshasa', null, 'SA001', '+243 81 000 0001');
    
    // NIVEAU MINISTÈRE
    insertUser.run('Pascal', 'TSHIBANGU', 'Kalala', 'ministre@paide.cd', bcrypt.hashSync('minister123', 10), 'ministere', 'ministere', 'Ministre', 'Kinshasa', null, 'MIN001', '+243 81 000 0010');
    insertUser.run('Marie', 'MUKENDI', 'Grace', 'secretaire.ministre@paide.cd', bcrypt.hashSync('secmin123', 10), 'ministere', 'ministere', 'Secrétaire', 'Kinshasa', null, 'MIN002', '+243 81 000 0011');
    insertUser.run('Joseph', 'KABILA', 'Plan', 'plan.ministre@paide.cd', bcrypt.hashSync('planmin123', 10), 'ministere', 'ministere', 'Chargé de Plan', 'Kinshasa', null, 'MIN003', '+243 81 000 0012');
    insertUser.run('Claire', 'TSHISEKEDI', 'Formation', 'formation.ministre@paide.cd', bcrypt.hashSync('formmin123', 10), 'ministere', 'ministere', 'Chargé de Formation', 'Kinshasa', null, 'MIN004', '+243 81 000 0013');
    
    // NIVEAU NATIONAL
    insertUser.run('Jean-Claude', 'KABILA', 'Moise', 'coord.national@paide.cd', bcrypt.hashSync('coordnat123', 10), 'national', 'coordination', 'Coordonateur', 'Kinshasa', null, 'NAT001', '+243 81 000 0020');
    insertUser.run('Antoinette', 'TSHISEKEDI', 'Marie', 'secretaire.national@paide.cd', bcrypt.hashSync('secnat123', 10), 'national', 'coordination', 'Secrétaire', 'Kinshasa', null, 'NAT002', '+243 81 000 0021');
    insertUser.run('Pierre', 'MUKENDI', 'Plan', 'plan.national@paide.cd', bcrypt.hashSync('plannat123', 10), 'national', 'coordination', 'Chargé de Plan', 'Kinshasa', null, 'NAT003', '+243 81 000 0022');
    insertUser.run('Sarah', 'KABONGO', 'Formation', 'formation.national@paide.cd', bcrypt.hashSync('formnat123', 10), 'national', 'coordination', 'Chargé de Formation', 'Kinshasa', null, 'NAT004', '+243 81 000 0023');
    
    // NIVEAU PROVINCIAL
    insertUser.run('Robert', 'LUMUMBA', 'Patrice', 'coord.kinshasa@paide.cd', bcrypt.hashSync('provkin123', 10), 'provincial', 'coordination', 'Coordonateur', 'Kinshasa', null, 'KIN001', '+243 81 000 0030');
    insertUser.run('Grace', 'MULUMBA', 'Secrétaire', 'secretaire.kinshasa@paide.cd', bcrypt.hashSync('seckin123', 10), 'provincial', 'coordination', 'Secrétaire', 'Kinshasa', null, 'KIN002', '+243 81 000 0031');
    insertUser.run('Joseph', 'KABANGE', 'Desire', 'coord.kasai@paide.cd', bcrypt.hashSync('provkas123', 10), 'provincial', 'coordination', 'Coordonateur', 'Kasaï', null, 'KAS001', '+243 81 000 0040');
    
    console.log('✓ Hiérarchie PAIDE créée');
    console.log('COMPTES PAIDE:');
    console.log('SUPER ADMIN: admin@paide.cd / SuperAdmin2024!');
    console.log('MINISTRE: ministre@paide.cd / minister123');
    console.log('SECRÉTAIRE MINISTRE: secretaire.ministre@paide.cd / secmin123');
    console.log('COORD NATIONAL: coord.national@paide.cd / coordnat123');
    console.log('SECRÉTAIRE NATIONAL: secretaire.national@paide.cd / secnat123');
    console.log('COORD PROVINCIAL: coord.kinshasa@paide.cd / provkin123');
    console.log('SECRÉTAIRE PROVINCIAL: secretaire.kinshasa@paide.cd / seckin123');

    console.log('✓ Toutes les données ont été insérées');
  }

  console.log('✓ Base de données initialisée avec succès');
  
} catch (error) {
  console.error('❌ ERREUR CRITIQUE lors de l\'initialisation de la base de données:', error);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Middleware d'authentification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token d\'accès requis' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Token invalide' });
    req.user = user;
    next();
  });
};

// Middleware de vérification SuperAdmin
const requireSuperAdmin = (req, res, next) => {
  if (req.user.level !== 'superadmin') {
    return res.status(403).json({ message: 'Accès réservé au Super Administrateur' });
  }
  next();
};

// Servir les fichiers uploadés
app.use('/uploads', express.static(uploadsDir));

// Routes SuperAdmin
app.get('/api/superadmin/content/:page?', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const { page } = req.params;
    console.log(`GET /api/superadmin/content/${page || 'all'} appelé`);
    
    let query = 'SELECT * FROM content';
    let params = [];
    
    if (page) {
      query += ' WHERE page = ?';
      params.push(page);
    }
    
    query += ' ORDER BY page, order_index, created_at DESC';
    
    const content = db.prepare(query).all(...params);
    console.log(`✓ ${content.length} éléments de contenu récupérés`);
    
    res.json(content);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération du contenu:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

app.post('/api/superadmin/content', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const { page, section, title, content, image_url, order_index } = req.body;
    console.log('POST /api/superadmin/content appelé');
    
    const insertContent = db.prepare(`
      INSERT INTO content (page, section, title, content, image_url, order_index) 
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    const result = insertContent.run(page, section, title, content, image_url, order_index || 0);
    console.log(`✓ Nouveau contenu créé avec ID: ${result.lastInsertRowid}`);
    
    res.status(201).json({
      id: result.lastInsertRowid,
      message: 'Contenu créé avec succès'
    });
  } catch (error) {
    console.error('❌ Erreur lors de la création du contenu:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

app.put('/api/superadmin/content/:id', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { page, section, title, content, image_url, order_index } = req.body;
    console.log(`PUT /api/superadmin/content/${id} appelé`);

    // Only update fields that are provided (COALESCE keeps existing values)
    const updateContent = db.prepare(`
      UPDATE content
      SET page = COALESCE(?, page),
          section = COALESCE(?, section),
          title = COALESCE(?, title),
          content = COALESCE(?, content),
          image_url = COALESCE(?, image_url),
          order_index = COALESCE(?, order_index),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    const result = updateContent.run(
      page || null, section || null, title || null, content || null,
      image_url !== undefined ? image_url : null,
      order_index || null, id
    );

    if (result.changes === 0) {
      return res.status(404).json({ message: 'Contenu non trouvé' });
    }

    console.log(`✓ Contenu ${id} mis à jour`);
    res.json({ message: 'Contenu mis à jour avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour du contenu:', error);
    res.status(500).json({
      message: 'Erreur serveur',
      error: error.message
    });
  }
});

app.delete('/api/superadmin/content/:id', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    console.log(`DELETE /api/superadmin/content/${id} appelé`);
    
    const deleteContent = db.prepare('DELETE FROM content WHERE id = ?');
    const result = deleteContent.run(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ message: 'Contenu non trouvé' });
    }
    
    console.log(`✓ Contenu ${id} supprimé`);
    res.json({ message: 'Contenu supprimé avec succès' });
  } catch (error) {
    console.error('❌ Erreur lors de la suppression du contenu:', error);
    res.status(500).json({ 
      message: 'Erreur serveur', 
      error: error.message 
    });
  }
});

// Routes dashboard
app.get('/api/internal/dashboard/stats', authenticateToken, (req, res) => {
  try {
    const user = req.user;

    // Requêtes réelles depuis la base de données — filtrées par niveau
    let whereChildren = '', whereCenter = '', whereFormation = '', params = [];

    if (user.level === 'centre' && user.center_id) {
      whereChildren = ' WHERE c.center_id = ?'; whereCenter = ' WHERE id = ?'; whereFormation = ' WHERE center_id = ?';
      params = [user.center_id];
    } else if (user.level === 'sous_provincial' && user.sous_province) {
      whereChildren = ' WHERE ct.province = ?'; whereCenter = ' WHERE province = ?'; whereFormation = ' WHERE center_id IN (SELECT id FROM centers WHERE province = ?)';
      params = [user.province];
    } else if (user.level === 'provincial' && user.province) {
      whereChildren = ' WHERE ct.province = ?'; whereCenter = ' WHERE province = ?'; whereFormation = ' WHERE center_id IN (SELECT id FROM centers WHERE province = ?)';
      params = [user.province];
    }
    // ministere, national, superadmin → pas de filtre (tout)

    const childrenTotal = db.prepare(`SELECT COUNT(*) as c FROM children c LEFT JOIN centers ct ON c.center_id = ct.id${whereChildren}`).get(...params)?.c || 0;
    const childrenActive = db.prepare(`SELECT COUNT(*) as c FROM children c LEFT JOIN centers ct ON c.center_id = ct.id${whereChildren ? whereChildren + " AND c.status='active'" : " WHERE c.status='active'"}`).get(...params)?.c || 0;
    const centersTotal = db.prepare(`SELECT COUNT(*) as c FROM centers${whereCenter}`).get(...(whereCenter ? params : []))?.c || 0;
    const centersActive = db.prepare(`SELECT COUNT(*) as c FROM centers${whereCenter ? whereCenter + " AND status='active'" : " WHERE status='active'"}`).get(...(whereCenter ? params : []))?.c || 0;
    const provinces = db.prepare('SELECT COUNT(DISTINCT province) as c FROM centers').get()?.c || 0;
    const formationsTotal = db.prepare(`SELECT COUNT(*) as c FROM formations${whereFormation}`).get(...(whereFormation ? params : []))?.c || 0;
    const formationsActive = db.prepare(`SELECT COUNT(*) as c FROM formations${whereFormation ? whereFormation + " AND status='active'" : " WHERE status='active'"}`).get(...(whereFormation ? params : []))?.c || 0;
    const usersCount = db.prepare('SELECT COUNT(*) as c FROM users').get()?.c || 0;

    // Données pour graphiques
    const filiereStats = db.prepare('SELECT filiere, COUNT(*) as count, SUM(enrolled_count) as inscrits FROM formations GROUP BY filiere').all();
    const provinceStats = db.prepare('SELECT c.province, COUNT(DISTINCT c.id) as centres, (SELECT COUNT(*) FROM children ch WHERE ch.center_id IN (SELECT id FROM centers WHERE province = c.province)) as enfants FROM centers c GROUP BY c.province').all();

    // Activités récentes depuis la DB (derniers enfants, formations, utilisateurs)
    let recentChildren = []; try { recentChildren = db.prepare("SELECT c.name, ct.name as center_name, c.enrolled_date FROM children c LEFT JOIN centers ct ON c.center_id = ct.id ORDER BY c.enrolled_date DESC LIMIT 3").all(); } catch {}
    let recentFormations = []; try { recentFormations = db.prepare("SELECT f.filiere, ct.name as center_name, f.start_date FROM formations f LEFT JOIN centers ct ON f.center_id = ct.id ORDER BY f.start_date DESC LIMIT 2").all(); } catch {}
    let recentUsers = []; try { recentUsers = db.prepare("SELECT name, level, created_at FROM users ORDER BY created_at DESC LIMIT 2").all(); } catch {}

    const activities = [];
    recentChildren.forEach(c => activities.push({ type: "child", text: "Enfant inscrit: " + c.name + " au " + (c.center_name || "Centre"), date: c.enrolled_date }));
    recentFormations.forEach(f => activities.push({ type: "formation", text: "Formation: " + f.filiere + " — " + (f.center_name || "Centre"), date: f.start_date }));
    recentUsers.forEach(u => activities.push({ type: "user", text: "Nouveau compte: " + u.name + " (" + u.level + ")", date: u.created_at }));
    activities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Alertes réelles
    const alertes = [];
    let capacityCenters = []; try { capacityCenters = db.prepare("SELECT name, capacity, (SELECT COUNT(*) FROM children WHERE center_id = centers.id AND status=\"active\") as current FROM centers WHERE capacity > 0").all(); } catch {}
    capacityCenters.forEach(c => {
      const pct = c.capacity > 0 ? Math.round((c.current / c.capacity) * 100) : 0;
      if (pct >= 80) alertes.push({ level: pct >= 95 ? "critical" : "warning", text: c.name + " à " + pct + "% de capacité (" + c.current + "/" + c.capacity + ")", type: "capacity" });
    });
    let pendingReports = 0; try { pendingReports = db.prepare("SELECT COUNT(*) as c FROM decisions WHERE status=\"en_attente\"").get()?.c || 0; } catch {}
    if (pendingReports > 0) alertes.push({ level: "info", text: pendingReports + " décision(s) en attente de validation", type: "pending" });
    let upcomingFormations = 0; try { upcomingFormations = db.prepare("SELECT COUNT(*) as c FROM formations WHERE status=\"active\"").get()?.c || 0; } catch {}
    if (upcomingFormations > 0) alertes.push({ level: "success", text: upcomingFormations + " formation(s) en cours", type: "formation" });

    // Taux de réussite réel
    let graduated = 0; try { graduated = db.prepare("SELECT COUNT(*) as c FROM children WHERE status=\"graduated\"").get()?.c || 0; } catch {}
    const tauxReussite = childrenTotal > 0 ? Math.round((graduated / childrenTotal) * 100) : 0;

    const stats = {
      children: { total: childrenTotal, active: childrenActive, graduated },
      centers: { total: centersTotal, active: centersActive, provinces },
      formations: { total: formationsTotal, ongoing: formationsActive, completed: formationsTotal - formationsActive },
      users: { count: usersCount },
      tauxReussite,
      activities: activities.slice(0, 5),
      alertes,
      charts: {
        filieres: filiereStats.map(f => ({ name: f.filiere, value: f.inscrits || f.count })),
        provinces: provinceStats.map(p => ({ province: p.province, enfants: p.enfants, centres: p.centres }))
      }
    };

    res.json(stats);
  } catch (error) {
    console.error("Erreur stats dashboard:", error);
    res.status(500).json({ message: "Erreur serveur" });
  }
});

// Routes gestion utilisateurs
app.get('/api/internal/users', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    // All authenticated users can read the users list (needed for messaging)
    let users;
    if (user.level === 'superadmin') {
      users = db.prepare('SELECT id,name,postnom,prenom,email,level,post,province,sous_province,center_id,status,created_at FROM users WHERE level != ?').all('superadmin');
    } else {
      let query = 'SELECT id,name,postnom,prenom,email,level,post,province,sous_province,center_id,status,created_at FROM users WHERE level = ? AND parent_id = ?';
      users = db.prepare(query).all(user.level, user.id);
    }
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.post('/api/internal/users', authenticateToken, (req, res) => {
  try {
    const creator = req.user;
    if (creator.post !== 'Secrétaire' && creator.level !== 'superadmin') {
      return res.status(403).json({ message: 'Accès réservé aux Secrétaires' });
    }

    const { name, postnom, prenom, post, level, province, sous_province, center_id, nationalite, adresse, matricule, numero_code, agent, section_name } = req.body;

    if (!name || !post) {
      return res.status(400).json({ message: 'Nom et poste requis' });
    }

    // Auto-generate email: première lettre prénom + nom @ paide.cd
    const prenomClean = (prenom || name.split(' ')[0] || 'u').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    const nomClean = (postnom || name.split(' ').pop() || 'user').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z]/g, '');
    let autoEmail = `${prenomClean.charAt(0)}.${nomClean}@paide.cd`;
    let suffix = 2;
    while (db.prepare('SELECT id FROM users WHERE email = ?').get(autoEmail)) {
      autoEmail = `${prenomClean.charAt(0)}.${nomClean}${suffix}@paide.cd`;
      suffix++;
    }

    // Auto-generate password: PAIDE- + 6 random chars
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let autoPassword = 'PAIDE-';
    for (let i = 0; i < 6; i++) autoPassword += chars.charAt(Math.floor(Math.random() * chars.length));

    // Sécurité : le secrétaire ne peut créer que dans son level et sa localité
    let finalLevel, finalProvince, finalSousProvince, finalCenterId;
    if (creator.level === 'superadmin') {
      finalLevel = level || 'centre';
      finalProvince = province;
      finalSousProvince = sous_province;
      finalCenterId = center_id;
    } else {
      finalLevel = creator.level;
      finalProvince = creator.province;
      finalSousProvince = creator.sous_province;
      finalCenterId = creator.center_id;
    }

    const hashedPwd = bcrypt.hashSync(autoPassword, 10);
    const result = db.prepare(`INSERT INTO users (name, postnom, prenom, email, password, level, department, post, province, sous_province, center_id, parent_id, nationalite, adresse, matricule, numero_code, agent, section_name, must_change_password) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)`).run(
      name, postnom || null, prenom || null, autoEmail, hashedPwd,
      finalLevel, '', post,
      finalProvince || null, finalSousProvince || null, finalCenterId || null,
      creator.id,
      nationalite || null, adresse || null, matricule || null, numero_code || null, agent || null, section_name || null
    );

    console.log(`[Users] Compte créé: ${autoEmail} (${post}) par ${creator.email}`);
    auditLog('USER_CREATED', { email: autoEmail, post, level: finalLevel, createdBy: creator.email });
    res.status(201).json({
      id: result.lastInsertRowid,
      email: autoEmail,
      password: autoPassword,
      name, postnom, prenom, post,
      level: finalLevel,
      province: finalProvince,
      sous_province: finalSousProvince,
      center_id: finalCenterId,
      created_at: new Date().toISOString(),
      message: 'Compte créé avec succès'
    });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.delete('/api/internal/users/:id', authenticateToken, (req, res) => {
  try {
    const creator = req.user;
    if (creator.post !== 'Secrétaire' && creator.level !== 'superadmin') {
      return res.status(403).json({ message: 'Accès réservé aux Secrétaires' });
    }
    const { id } = req.params;
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (target.email === 'admin@paide.cd') return res.status(403).json({ message: 'Impossible de supprimer le SuperAdmin' });
    if (creator.level !== 'superadmin' && target.parent_id !== creator.id) {
      return res.status(403).json({ message: 'Vous ne pouvez supprimer que les comptes que vous avez créés' });
    }
    // Supprimer toutes les données liées avant de supprimer l'utilisateur
    db.prepare('DELETE FROM user_devices WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM user_documents WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM uploads WHERE uploaded_by = ?').run(id);
    db.prepare('DELETE FROM hr_approvals WHERE requested_by = ? OR approved_by = ?').run(id, id);
    db.prepare('UPDATE decision_requests SET submitted_by = NULL WHERE submitted_by = ?').run(id);
    db.prepare('UPDATE decision_requests SET decision_by = NULL WHERE decision_by = ?').run(id);
    db.prepare('UPDATE hr_personnel SET user_id = NULL WHERE user_id = ?').run(id);
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    // Supprimer le fichier avatar si existant
    if (target.avatar_url) {
      const avatarPath = path.join(__dirname, 'data', 'uploads', path.basename(target.avatar_url));
      try { fs.unlinkSync(avatarPath); } catch {}
    }
    res.json({ message: 'Compte supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression utilisateur:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Réinitialisation mot de passe (Secrétaire réinitialise ses agents, SuperAdmin réinitialise les Secrétaires)
app.post('/api/internal/users/:id/reset-password', authenticateToken, (req, res) => {
  try {
    const creator = req.user;
    if (creator.post !== 'Secrétaire' && creator.level !== 'superadmin') {
      return res.status(403).json({ message: 'Accès réservé aux Secrétaires et SuperAdmin' });
    }
    const { id } = req.params;
    const target = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!target) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    if (target.email === 'admin@paide.cd') return res.status(403).json({ message: 'Impossible de réinitialiser le SuperAdmin' });
    if (creator.level !== 'superadmin' && target.parent_id !== creator.id) {
      return res.status(403).json({ message: 'Vous ne pouvez réinitialiser que les comptes que vous avez créés' });
    }

    // Générer nouveau mot de passe
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let newPassword = 'PAIDE-';
    for (let i = 0; i < 6; i++) newPassword += chars.charAt(Math.floor(Math.random() * chars.length));

    const hashed = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ?, must_change_password = 1 WHERE id = ?').run(hashed, id);

    console.log(`[Users] Password reset for ${target.email} by ${creator.email}`);
    auditLog('PASSWORD_RESET', { targetEmail: target.email, resetBy: creator.email });
    res.json({
      message: 'Mot de passe réinitialisé',
      name: target.name,
      postnom: target.postnom,
      prenom: target.prenom,
      email: target.email,
      post: target.post,
      level: target.level,
      password: newPassword,
      province: target.province
    });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Routes nouvelles pages internes
// ═══ DECISIONS WORKFLOW ═══
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
    const responsablePosts = ['Ministre', 'Coordonateur', 'Chef de Centre'];
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
});


app.get('/api/internal/courrier', authenticateToken, (req, res) => {
  try {
    const user = req.user;

    const courrier = db.prepare('SELECT * FROM mail_register ORDER BY created_at DESC').all();
    res.json(courrier);
  } catch (error) {
    console.error('Erreur courrier:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/internal/courrier', authenticateToken, (req, res) => {
  try {
    const user = req.user;

    const { reference, type, sender_name, receiver_name, subject } = req.body;

    if (!reference || !type || !sender_name || !receiver_name || !subject) {
      return res.status(400).json({ message: 'Tous les champs sont requis' });
    }

    const result = db.prepare(`
      INSERT INTO mail_register (reference, type, sender_name, receiver_name, subject, handled_by) 
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(reference, type, sender_name, receiver_name, subject, user.id);

    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Courrier enregistré avec succès' 
    });
  } catch (error) {
    console.error('Erreur ajout courrier:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/internal/documents', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    // Scope: Secrétaire/Responsable voit les docs de son niveau
    // SuperAdmin/Ministère voit tout
    let q = "SELECT d.*, u.name as uploaded_by_name FROM documents d JOIN users u ON d.uploaded_by = u.id WHERE 1=1";
    const params = [];
    if (user.level === 'superadmin') {
      // SuperAdmin = technique, pas dans l'organisation → pas de documents internes
      return res.json([]);
    }
    {
      q += " AND (d.level = ? OR d.level IS NULL)";
      params.push(user.level);
      if (user.province) { q += " AND (d.province = ? OR d.province IS NULL)"; params.push(user.province); }
      if (user.center_id) { q += " AND (d.center_id = ? OR d.center_id IS NULL)"; params.push(user.center_id); }
    }
    q += " ORDER BY d.created_at DESC";
    const documents = db.prepare(q).all(...params);
    res.json(documents);
  } catch (error) {
    console.error('Erreur documents:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/internal/documents', authenticateToken, upload.single('document'), (req, res) => {
  try {
    const user = req.user;
    if (user.post !== 'Secrétaire') {
      return res.status(403).json({ message: 'Accès réservé aux Secrétaires' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Aucun fichier uploadé' });
    }

    const { title, type } = req.body;
    
    if (!title || !type) {
      return res.status(400).json({ message: 'Titre et type requis' });
    }

    const file_url = `/uploads/${req.file.filename}`;

    const result = db.prepare(`
      INSERT INTO documents (title, type, file_url, uploaded_by, department, level, province, center_id) 
      VALUES (?, ?, ?, ?, ?)
    `).run(title, type, file_url, user.id, user.department || 'administration');

    res.status(201).json({ 
      id: result.lastInsertRowid, 
      message: 'Document uploadé avec succès',
      file_url 
    });
  } catch (error) {
    console.error('Erreur upload document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/api/internal/documents/:id', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    if (user.post !== 'Secrétaire') {
      return res.status(403).json({ message: 'Accès réservé aux Secrétaires' });
    }

    const { id } = req.params;
    
    // Récupérer le document pour supprimer le fichier physique
    const document = db.prepare('SELECT * FROM documents WHERE id = ?').get(id);
    
    if (!document) {
      return res.status(404).json({ message: 'Document non trouvé' });
    }

    // Supprimer le fichier physique
    const filePath = path.join(__dirname, document.file_url);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Supprimer l'entrée de la base
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);
    
    res.json({ message: 'Document supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression document:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes d'authentification
app.post('/api/auth/login', (req, res) => {
  const { email, password, fingerprint, device_name, browser, os } = req.body;
  const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

  // Rate limiting
  if (!checkLoginRateLimit(clientIp)) {
    auditLog('LOGIN_BLOCKED', { email, ip: clientIp, reason: 'rate_limit' });
    return res.status(429).json({ message: 'Trop de tentatives. Réessayez dans 5 minutes.' });
  }

  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

    if (!user || !bcrypt.compareSync(password, user.password)) {
      auditLog('LOGIN_FAILED', { email, ip: clientIp });
      return res.status(401).json({ message: 'Email ou mot de passe incorrect' });
    }

    // SuperAdmin bypass device check
    if (user.level !== 'superadmin' && fingerprint) {
      const existingDevices = db.prepare('SELECT * FROM user_devices WHERE user_id = ?').all(user.id);

      if (existingDevices.length === 0) {
        // First login ever — register this device automatically
        db.prepare('INSERT INTO user_devices (user_id, fingerprint, device_name, browser, os, authorized) VALUES (?,?,?,?,?,1)').run(
          user.id, fingerprint, device_name || 'Premier appareil', browser || '', os || ''
        );
        console.log(`[Device] First device registered for ${user.email}: ${fingerprint.substring(0, 12)}...`);
      } else {
        // Check if this device is authorized
        const device = db.prepare('SELECT * FROM user_devices WHERE user_id = ? AND fingerprint = ?').get(user.id, fingerprint);

        if (!device) {
          // New device — create pending request
          const existing = db.prepare('SELECT id FROM user_devices WHERE user_id = ? AND fingerprint = ? AND authorized = 0').get(user.id, fingerprint);
          if (!existing) {
            db.prepare('INSERT INTO user_devices (user_id, fingerprint, device_name, browser, os, authorized) VALUES (?,?,?,?,?,0)').run(
              user.id, fingerprint, device_name || 'Nouvel appareil', browser || '', os || ''
            );
          }
          console.log(`[Device] Unauthorized device blocked for ${user.email}: ${fingerprint.substring(0, 12)}...`);
          return res.status(403).json({
            message: 'Appareil non autorisé. Contactez le Super Administrateur pour autoriser cet appareil.',
            code: 'DEVICE_NOT_AUTHORIZED',
            device_pending: true
          });
        } else if (device.authorized === 0) {
          // Device exists but not yet authorized
          return res.status(403).json({
            message: 'Cet appareil est en attente d\'autorisation par le Super Administrateur.',
            code: 'DEVICE_PENDING',
            device_pending: true
          });
        }

        // Device authorized — update last_used
        db.prepare('UPDATE user_devices SET last_used = CURRENT_TIMESTAMP WHERE id = ?').run(device.id);
      }
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        level: user.level,
        department: user.department,
        post: user.post,
        province: user.province,
        sous_province: user.sous_province,
        center_id: user.center_id
      },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    const { password: _, ...userWithoutPassword } = user;

    auditLog('LOGIN_SUCCESS', { email: user.email, ip: clientIp, level: user.level, post: user.post, device: fingerprint?.substring(0, 12) });

    res.json({
      token,
      user: userWithoutPassword,
      must_change_password: user.must_change_password === 1
    });
  } catch (error) {
    console.error('Erreur lors de l\'authentification:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Changement de mot de passe
app.post('/api/auth/change-password', authenticateToken, (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) return res.status(400).json({ message: 'Ancien et nouveau mot de passe requis' });
    if (newPassword.length < 8) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères' });
    if (!/[A-Z]/.test(newPassword)) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins une majuscule' });
    if (!/[0-9]/.test(newPassword)) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins un chiffre' });
    if (!/[^a-zA-Z0-9]/.test(newPassword)) return res.status(400).json({ message: 'Le mot de passe doit contenir au moins un caractère spécial (@#$!...)' });
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
    if (!user || !bcrypt.compareSync(currentPassword, user.password)) {
      return res.status(401).json({ message: 'Mot de passe actuel incorrect' });
    }
    const hashed = bcrypt.hashSync(newPassword, 10);
    db.prepare('UPDATE users SET password = ?, must_change_password = 0 WHERE id = ?').run(hashed, req.user.id);
    res.json({ message: 'Mot de passe modifié avec succès' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Audit logs (SuperAdmin)
app.get('/api/admin/audit', authenticateToken, (req, res) => {
  try {
    if (req.user.level !== 'superadmin') return res.status(403).json({ message: 'Accès réservé au Super Admin' });
    const logDir = path.join(__dirname, 'data', 'logs');
    if (!fs.existsSync(logDir)) return res.json({ logs: [], files: [] });

    const { date, type } = req.query;
    const files = fs.readdirSync(logDir).filter(f => f.startsWith('audit-')).sort().reverse();

    // Read specific date or latest
    const targetFile = date ? `audit-${date}.log` : files[0];
    if (!targetFile || !fs.existsSync(path.join(logDir, targetFile))) return res.json({ logs: [], files });

    const content = fs.readFileSync(path.join(logDir, targetFile), 'utf8');
    const logs = content.trim().split('\n').filter(Boolean).map(line => {
      const match = line.match(/^\[(.+?)\] (\w+): (.+)$/);
      if (!match) return null;
      try {
        return { timestamp: match[1], action: match[2], details: JSON.parse(match[3]) };
      } catch { return { timestamp: match[1], action: match[2], details: { raw: match[3] } }; }
    }).filter(Boolean).reverse();

    // Filter by type if specified
    const filtered = type ? logs.filter(l => l.action === type) : logs;

    // Stats
    const stats = {
      total: logs.length,
      login_success: logs.filter(l => l.action === 'LOGIN_SUCCESS').length,
      login_failed: logs.filter(l => l.action === 'LOGIN_FAILED').length,
      login_blocked: logs.filter(l => l.action === 'LOGIN_BLOCKED').length,
      user_created: logs.filter(l => l.action === 'USER_CREATED').length,
      password_reset: logs.filter(l => l.action === 'PASSWORD_RESET').length,
    };

    res.json({ logs: filtered, files, stats, date: targetFile.replace('audit-', '').replace('.log', '') });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Gestion appareils (SuperAdmin)
app.get('/api/admin/devices', authenticateToken, (req, res) => {
  try {
    if (req.user.level !== 'superadmin') return res.status(403).json({ message: 'Accès réservé au Super Admin' });
    const devices = db.prepare(`
      SELECT d.*, u.name as user_name, u.email as user_email, u.post as user_post, u.level as user_level
      FROM user_devices d
      JOIN users u ON d.user_id = u.id
      ORDER BY d.authorized ASC, d.created_at DESC
    `).all();
    res.json(devices);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.get('/api/admin/devices/pending', authenticateToken, (req, res) => {
  try {
    if (req.user.level !== 'superadmin') return res.status(403).json({ message: 'Accès réservé au Super Admin' });
    const pending = db.prepare(`
      SELECT d.*, u.name as user_name, u.email as user_email, u.post as user_post
      FROM user_devices d
      JOIN users u ON d.user_id = u.id
      WHERE d.authorized = 0
      ORDER BY d.created_at DESC
    `).all();
    res.json(pending);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.post('/api/admin/devices/:id/authorize', authenticateToken, (req, res) => {
  try {
    if (req.user.level !== 'superadmin') return res.status(403).json({ message: 'Accès réservé au Super Admin' });
    db.prepare('UPDATE user_devices SET authorized = 1 WHERE id = ?').run(req.params.id);
    res.json({ message: 'Appareil autorisé' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.post('/api/admin/devices/:id/revoke', authenticateToken, (req, res) => {
  try {
    if (req.user.level !== 'superadmin') return res.status(403).json({ message: 'Accès réservé au Super Admin' });
    db.prepare('DELETE FROM user_devices WHERE id = ?').run(req.params.id);
    res.json({ message: 'Appareil révoqué' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// Upload avatar
app.post('/api/auth/avatar', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier' });
    const avatarUrl = '/uploads/' + req.file.filename;
    try { db.exec("ALTER TABLE users ADD COLUMN avatar_url TEXT"); } catch {}
    db.prepare('UPDATE users SET avatar_url = ? WHERE id = ?').run(avatarUrl, req.user.id);
    res.json({ avatar_url: avatarUrl, message: 'Photo mise à jour' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes publiques
app.get('/api/public/news', (req, res) => {
  try {
    console.log('GET /api/public/news appelé');
    const news = db.prepare('SELECT * FROM news WHERE published = 1 ORDER BY created_at DESC LIMIT 10').all();
    console.log(`✓ ${news.length} actualités récupérées`);
    res.json(news);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des actualités:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.get('/api/public/partners', (req, res) => {
  try {
    console.log('GET /api/public/partners appelé');
    const partners = db.prepare('SELECT * FROM partners ORDER BY name').all();
    console.log(`✓ ${partners.length} partenaires récupérés`);
    res.json(partners);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des partenaires:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.get('/api/public/centers', (req, res) => {
  try {
    console.log('GET /api/public/centers appelé');
    const centers = db.prepare('SELECT * FROM centers ORDER BY province, name').all();
    console.log(`✓ ${centers.length} centres récupérés`);
    res.json(centers);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des centres:', error);
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.get('/api/public/content/:page', (req, res) => {
  try {
    const { page } = req.params;
    const content = db.prepare('SELECT * FROM content WHERE page = ? ORDER BY order_index, created_at DESC').all(page);
    res.json(content);
  } catch (error) {
    console.error('Erreur contenu public:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/public/contact', (req, res) => {
  const { name, email, organization, subject, message } = req.body;
  
  try {
    console.log('Nouveau message de contact:', { name, email, organization, subject, message });
    res.json({ message: 'Message envoyé avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ─── Routes manquantes (restaurées) ───

// SuperAdmin upload
app.get('/api/superadmin/upload', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const uploads = db.prepare('SELECT * FROM uploads ORDER BY created_at DESC').all();
    res.json(uploads);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.post('/api/superadmin/upload', authenticateToken, requireSuperAdmin, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier envoyé' });
    const { filename, originalname, size, mimetype } = req.file;
    const filePath = '/uploads/' + filename;
    db.prepare('INSERT INTO uploads (filename, original_name, file_path, file_size, mime_type, uploaded_by) VALUES (?,?,?,?,?,?)').run(filename, originalname, filePath, size, mimetype, req.user.id);
    res.status(201).json({ id: db.prepare('SELECT last_insert_rowid() as id').get().id, filename, imageUrl: filePath, message: 'Fichier uploadé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.delete('/api/superadmin/upload/:id', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const result = db.prepare('DELETE FROM uploads WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Fichier non trouvé' });
    res.json({ message: 'Fichier supprimé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// User documents upload
app.post('/api/internal/users/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier' });
    const { user_id, doc_type } = req.body;
    if (!user_id || !doc_type) return res.status(400).json({ message: 'user_id et doc_type requis' });
    const { filename, originalname, size } = req.file;
    const filePath = '/uploads/' + filename;
    db.prepare('INSERT INTO user_documents (user_id, doc_type, filename, original_name, file_path, file_size) VALUES (?,?,?,?,?,?)').run(user_id, doc_type, filename, originalname, filePath, size);
    res.status(201).json({ imageUrl: filePath, message: 'Document uploadé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur upload', error: error.message });
  }
});

app.get('/api/internal/users/:id/documents', authenticateToken, (req, res) => {
  try {
    const docs = db.prepare('SELECT * FROM user_documents WHERE user_id = ? ORDER BY uploaded_at DESC').all(req.params.id);
    res.json(docs);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Health check DB
app.get('/api/health/database', (req, res) => {
  try {
    const newsCount = db.prepare('SELECT COUNT(*) as count FROM news').get();
    const partnersCount = db.prepare('SELECT COUNT(*) as count FROM partners').get();
    const centersCount = db.prepare('SELECT COUNT(*) as count FROM centers').get();
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
    res.json({ status: 'healthy', database: 'connected', tables: { news: newsCount.count, partners: partnersCount.count, centers: centersCount.count, users: usersCount.count }, timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: error.message });
  }
});

// Messages internes

// Contacts pour la messagerie — règles hiérarchiques strictes
app.get('/api/internal/messages/contacts', authenticateToken, (req, res) => {
  try {
    const me = req.user;
    const levels = ['ministere', 'national', 'provincial', 'sous_provincial', 'centre'];
    const myIndex = levels.indexOf(me.level);
    
    // Postes de responsable à chaque niveau
    const responsablePosts = [
      'Ministre', 'Coordonateur', 'Chef de Centre', 'Super Administrateur'
    ];
    const isResponsable = responsablePosts.includes(me.post) || me.level === 'superadmin';
    
    const allUsers = db.prepare(
      "SELECT id, name, postnom, email, level, post, province, sous_province, center_id FROM users WHERE id != ? AND status = 'active' AND level != 'superadmin' ORDER BY level, post, name"
    ).all(me.id);
    
    const contacts = [];
    
    allUsers.forEach(u => {
      const uIndex = levels.indexOf(u.level);
      const uIsResponsable = responsablePosts.includes(u.post);
      
      // SuperAdmin voit tout le monde
      if (me.level === 'superadmin') {
        contacts.push({ ...u, category: uIndex <= myIndex ? 'Administration' : levelLabels(u.level) });
        return;
      }
      
      // Règle 1: Même niveau = même bureau → tout le monde se parle
      if (u.level === me.level) {
        // Filtrer par province si provincial ou inférieur
        if (me.level === 'provincial' && me.province && u.province && u.province !== me.province) return;
        if (me.level === 'sous_provincial' && me.sous_province && u.sous_province && u.sous_province !== me.sous_province) return;
        if (me.level === 'centre' && me.center_id && u.center_id && u.center_id !== me.center_id) return;
        contacts.push({ ...u, category: 'Mon bureau' });
        return;
      }
      
      // Règle 2: Seul le responsable peut communiquer avec d'autres niveaux
      if (!isResponsable) return; // Non-responsable = uniquement son bureau
      
      // Règle 3: Responsable → niveau supérieur direct (seulement le responsable de ce niveau)
      if (uIndex === myIndex - 1 && uIsResponsable) {
        contacts.push({ ...u, category: 'Hiérarchie supérieure' });
        return;
      }
      
      // Règle 4: Responsable → niveau inférieur direct (seulement les responsables)
      if (uIndex === myIndex + 1 && uIsResponsable) {
        // Filtrer par zone géographique
        if (me.level === 'provincial' && u.province && me.province && u.province !== me.province) return;
        if (me.level === 'sous_provincial' && u.level === 'centre') {
          if (u.sous_province && me.sous_province && u.sous_province !== me.sous_province) return;
        }
        contacts.push({ ...u, category: 'Niveau inférieur' });
        return;
      }
    });
    
    res.json(contacts);
  } catch (error) {
    console.error('Erreur contacts:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

function levelLabels(l) {
  return { superadmin: 'Administration', ministere: 'Ministère', national: 'National', provincial: 'Provincial', sous_provincial: 'Sous-Provincial', centre: 'Centre' }[l] || l;
}


// Messages envoyés et reçus
app.get('/api/internal/messages', authenticateToken, (req, res) => {
  try {
    // Retourne les messages envoyés ET reçus par l'utilisateur
    const messages = db.prepare(
      'SELECT m.*, s.name as sender_name, s.postnom as sender_postnom, s.post as sender_post, r.name as receiver_name, r.postnom as receiver_postnom, r.post as receiver_post FROM messages m JOIN users s ON m.sender_id = s.id JOIN users r ON m.receiver_id = r.id WHERE m.sender_id = ? OR m.receiver_id = ? ORDER BY m.created_at ASC'
    ).all(req.user.id, req.user.id);
    res.json(messages);
  } catch (error) {
    console.error('Erreur messages:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/internal/messages', authenticateToken, (req, res) => {
  const { receiver_id, content } = req.body;
  try {
    const result = db.prepare('INSERT INTO messages (sender_id, receiver_id, content) VALUES (?, ?, ?)').run(req.user.id, receiver_id, content);
    res.json({ id: result.lastInsertRowid, message: 'Message envoyé' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Rapports
app.get('/api/internal/reports', authenticateToken, (req, res) => {
  try {
    const reports = db.prepare('SELECT r.*, u.name as from_user_name FROM reports r JOIN users u ON r.from_user = u.id WHERE r.from_user = ? OR r.to_level = ? ORDER BY r.created_at DESC').all(req.user.id, req.user.level);
    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.post('/api/internal/reports', authenticateToken, (req, res) => {
  const { title, content, type, to_level, period } = req.body;
  try {
    const result = db.prepare('INSERT INTO reports (title, content, type, from_user, to_level, period) VALUES (?, ?, ?, ?, ?, ?)').run(title, content, type, req.user.id, to_level, period);
    res.json({ id: result.lastInsertRowid, message: 'Rapport soumis' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Routes notifications
app.get('/api/internal/notifications', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    
    // Générer des notifications basées sur le rôle
    const notifications = [];
    
    // Notifications communes
    notifications.push({
      id: 1,
      type: 'message',
      title: 'Nouveau message reçu',
      content: 'Marie Kabila vous a envoyé un message concernant le rapport mensuel.',
      read: false,
      priority: 'medium',
      from_user: 'Marie Kabila',
      action_url: '/internal/messaging',
      created_at: new Date().toISOString()
    });

    // Notifications pour Ministre/Coordonateurs
    if (user.post === 'Ministre' || user.post?.includes('Coordonateur')) {
      notifications.unshift({
        id: 2,
        type: 'report',
        title: '3 rapports en attente de validation',
        content: 'Vous avez 3 nouveaux rapports soumis par vos équipes qui nécessitent votre validation.',
        read: false,
        priority: 'high',
        action_url: '/internal/decisions',
        created_at: new Date().toISOString()
      });
    }

    // Notifications pour Secrétaires
    if (user.post === 'Secrétaire') {
      notifications.unshift({
        id: 3,
        type: 'user',
        title: 'Nouveau compte créé',
        content: 'Un nouveau compte utilisateur a été créé avec succès.',
        read: false,
        priority: 'low',
        action_url: '/internal/users',
        created_at: new Date().toISOString()
      });
    }

    res.json(notifications);
  } catch (error) {
    console.error('Erreur notifications:', error);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// CRUD Enfants
app.get('/api/internal/children', authenticateToken, (req, res) => {
  try {
    let query = 'SELECT c.*, ct.name as center_name FROM children c LEFT JOIN centers ct ON c.center_id = ct.id WHERE 1=1';
    const params = [];
    if (req.user.level === 'centre' && req.user.center_id) { query += ' AND c.center_id = ?'; params.push(req.user.center_id); }
    else if (req.user.level === 'provincial' && req.user.province) { query += ' AND ct.province = ?'; params.push(req.user.province); }
    const { search, status, center_id, page } = req.query;
    if (search) { query += ' AND c.name LIKE ?'; params.push(`%${search}%`); }
    if (status) { query += ' AND c.status = ?'; params.push(status); }
    if (center_id) { query += ' AND c.center_id = ?'; params.push(center_id); }
    query += ' ORDER BY c.name';
    const pageNum = parseInt(page) || 1;
    const limit = 20;
    const offset = (pageNum - 1) * limit;
    const total = db.prepare(query.replace('c.*, ct.name as center_name', 'COUNT(*) as count')).get(...params)?.count || 0;
    query += ' LIMIT ? OFFSET ?'; params.push(limit, offset);
    const children = db.prepare(query).all(...params);
    res.json({ children, total, page: pageNum, totalPages: Math.ceil(total / limit) });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur', error: error.message }); }
});

app.post('/api/internal/children', authenticateToken, (req, res) => {
  try {
    const { name, age, gender, situation, center_id, formation_id, status } = req.body;
    if (!name) return res.status(400).json({ message: 'Nom requis' });
    const result = db.prepare('INSERT INTO children (name, age, gender, situation, center_id, formation_id, status) VALUES (?,?,?,?,?,?,?)').run(
      name, age || null, gender || null, situation || null, center_id || null, formation_id || null, status || 'active'
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Enfant ajouté' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.put('/api/internal/children/:id', authenticateToken, (req, res) => {
  try {
    const { name, age, gender, situation, center_id, formation_id, status } = req.body;
    db.prepare('UPDATE children SET name=?,age=?,gender=?,situation=?,center_id=?,formation_id=?,status=? WHERE id=?').run(
      name, age, gender, situation, center_id, formation_id, status, req.params.id
    );
    res.json({ message: 'Enfant mis à jour' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.delete('/api/internal/children/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM children WHERE id = ?').run(req.params.id);
    res.json({ message: 'Enfant supprimé' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// CRUD Centres internes
app.get('/api/internal/centers', authenticateToken, (req, res) => {
  try {
    let query = 'SELECT * FROM centers WHERE 1=1';
    const params = [];
    if (req.user.level === 'provincial' && req.user.province) { query += ' AND province = ?'; params.push(req.user.province); }
    else if (req.user.level === 'centre' && req.user.center_id) { query += ' AND id = ?'; params.push(req.user.center_id); }
    { const _all = db.prepare(query + ' ORDER BY province, name').all(...params); const _p = parseInt(req.query.page) || 1; const _ps = parseInt(req.query.pageSize) || 50; res.json({ data: _all.slice((_p-1)*_ps, _p*_ps), total: _all.length, page: _p, pageSize: _ps }); }
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.post('/api/internal/centers', authenticateToken, (req, res) => {
  try {
    const { name, province, address, capacity, status } = req.body;
    if (!name || !province) return res.status(400).json({ message: 'Nom et province requis' });
    const result = db.prepare('INSERT INTO centers (name, province, address, capacity, status) VALUES (?,?,?,?,?)').run(name, province, address || '', capacity || 0, status || 'active');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Centre ajouté' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.put('/api/internal/centers/:id', authenticateToken, (req, res) => {
  try {
    const { name, province, address, capacity, status } = req.body;
    db.prepare('UPDATE centers SET name=?,province=?,address=?,capacity=?,status=? WHERE id=?').run(name, province, address, capacity, status, req.params.id);
    res.json({ message: 'Centre mis à jour' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.delete('/api/internal/centers/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM centers WHERE id = ?').run(req.params.id);
    res.json({ message: 'Centre supprimé' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// CRUD Formations internes
app.get('/api/internal/formations', authenticateToken, (req, res) => {
  try {
    let query = 'SELECT f.*, c.name as center_name FROM formations f LEFT JOIN centers c ON f.center_id = c.id WHERE 1=1';
    const params = [];
    if (req.user.level === 'centre' && req.user.center_id) { query += ' AND f.center_id = ?'; params.push(req.user.center_id); }
    else if (req.user.level === 'provincial' && req.user.province) { query += ' AND c.province = ?'; params.push(req.user.province); }
    { const _all = db.prepare(query + ' ORDER BY f.name').all(...params); const _p = parseInt(req.query.page) || 1; const _ps = parseInt(req.query.pageSize) || 50; res.json({ data: _all.slice((_p-1)*_ps, _p*_ps), total: _all.length, page: _p, pageSize: _ps }); }
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.post('/api/internal/formations', authenticateToken, (req, res) => {
  try {
    const { name, filiere, center_id, trainer, start_date, end_date, status } = req.body;
    if (!name || !filiere) return res.status(400).json({ message: 'Nom et filière requis' });
    const result = db.prepare('INSERT INTO formations (name, filiere, center_id, trainer, start_date, end_date, status) VALUES (?,?,?,?,?,?,?)').run(
      name, filiere, center_id || null, trainer || null, start_date || null, end_date || null, status || 'active'
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Formation ajoutée' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.put('/api/internal/formations/:id', authenticateToken, (req, res) => {
  try {
    const { name, filiere, center_id, trainer, start_date, end_date, status } = req.body;
    db.prepare('UPDATE formations SET name=?,filiere=?,center_id=?,trainer=?,start_date=?,end_date=?,status=? WHERE id=?').run(
      name, filiere, center_id, trainer, start_date, end_date, status, req.params.id
    );
    res.json({ message: 'Formation mise à jour' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.delete('/api/internal/formations/:id', authenticateToken, (req, res) => {
  try {
    db.prepare('DELETE FROM formations WHERE id = ?').run(req.params.id);
    res.json({ message: 'Formation supprimée' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// Formateurs
app.get('/api/internal/formateurs', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    // Retourne les formateurs avec leur centre
    const formateurs = db.prepare(`
      SELECT f.*, c.name as center_name
      FROM formations f
      LEFT JOIN centers c ON f.center_id = c.id
      WHERE f.trainer IS NOT NULL AND f.trainer != ''
      ORDER BY f.trainer
    `).all();
    // Transform to formateur format
    const result = formateurs.map(f => ({
      id: f.id, name: f.trainer, specialite: f.filiere, filiere: f.filiere,
      center_id: f.center_id, center_name: f.center_name, phone: '', status: f.status || 'active',
      created_at: f.start_date
    }));
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

app.post('/api/internal/formateurs', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    if (user.post !== 'Chargé de Formation' && user.level !== 'superadmin') {
      return res.status(403).json({ message: 'Accès réservé aux Chargés de Formation' });
    }
    const { name, specialite, filiere, center_id, phone } = req.body;
    if (!name || !filiere) return res.status(400).json({ message: 'Nom et filière requis' });
    const result = db.prepare('INSERT INTO formations (name, filiere, trainer, center_id, status) VALUES (?, ?, ?, ?, ?)').run(
      filiere + ' - ' + name, filiere, name, center_id || null, 'active'
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Formateur ajouté' });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Statistiques formations
app.get('/api/internal/statistiques', authenticateToken, (req, res) => {
  try {
    const user = req.user;
    // Stats par filière
    const filieres = db.prepare(`
      SELECT filiere, COUNT(*) as total_formations, SUM(enrolled_count) as total_inscrits
      FROM formations GROUP BY filiere
    `).all();
    const filiereStats = filieres.map(f => ({
      filiere: f.filiere, total_formations: f.total_formations,
      total_inscrits: f.total_inscrits || 0, taux_reussite: Math.floor(Math.random() * 20 + 75)
    }));

    // Stats par centre
    const centres = db.prepare(`
      SELECT c.name as center_name, c.province, c.capacity as capacite,
        (SELECT COUNT(*) FROM children ch WHERE ch.center_id = c.id) as total_enfants,
        (SELECT COUNT(*) FROM formations f WHERE f.center_id = c.id) as total_formations
      FROM centers c ORDER BY c.province
    `).all();

    res.json({ filieres: filiereStats, centres });
  } catch (error) {
    res.status(500).json({ message: 'Erreur serveur', error: error.message });
  }
});

// Personnel (Chef de Centre)
app.get('/api/internal/personnel', authenticateToken, (req, res) => {
  try {
    let query = 'SELECT id, name, postnom, email, post, level, province, status, created_at FROM users WHERE 1=1';
    const params = [];
    if (req.user.level === 'centre' && req.user.center_id) {
      query += ' AND center_id = ?'; params.push(req.user.center_id);
    } else if (req.user.level === 'sous_provincial') {
      query += ' AND sous_province = ?'; params.push(req.user.sous_province);
    } else if (req.user.level === 'provincial') {
      query += ' AND province = ?'; params.push(req.user.province);
    }
    res.json(db.prepare(query + ' ORDER BY name').all(...params));
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// Journal des opérations (Chargé des Opérations)
app.get('/api/internal/journal', authenticateToken, (req, res) => {
  try {
    const entries = db.prepare('SELECT * FROM activities WHERE user_id = ? OR 1=1 ORDER BY created_at DESC LIMIT 50').all(req.user.id);
    res.json(entries);
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.post('/api/internal/journal', authenticateToken, (req, res) => {
  try {
    const { action, details } = req.body;
    if (!action) return res.status(400).json({ message: 'Action requise' });
    const result = db.prepare('INSERT INTO activities (user_id, action, details) VALUES (?, ?, ?)').run(req.user.id, action, details || '');
    res.status(201).json({ id: result.lastInsertRowid, message: 'Activité enregistrée' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// Équipement (Intendant)
app.get('/api/internal/equipement', authenticateToken, (req, res) => {
  try {
    let query = 'SELECT * FROM equipment WHERE 1=1';
    const params = [];
    if (req.user.center_id) { query += ' AND center_id = ?'; params.push(req.user.center_id); }
    res.json(db.prepare(query + ' ORDER BY name').all(...params));
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.post('/api/internal/equipement', authenticateToken, (req, res) => {
  try {
    const { name, category, quantity, condition, center_id } = req.body;
    if (!name) return res.status(400).json({ message: 'Nom requis' });
    const result = db.prepare('INSERT INTO equipment (name, category, quantity, condition, center_id, managed_by) VALUES (?,?,?,?,?,?)').run(
      name, category || 'autre', quantity || 1, condition || 'bon', center_id || req.user.center_id, req.user.id
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Équipement ajouté' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.put('/api/internal/equipement/:id', authenticateToken, (req, res) => {
  try {
    const { name, category, quantity, condition } = req.body;
    db.prepare('UPDATE equipment SET name=?, category=?, quantity=?, condition=? WHERE id=?').run(name, category, quantity, condition, req.params.id);
    res.json({ message: 'Équipement mis à jour' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// Discipline (Disciplinaire)
app.get('/api/internal/discipline', authenticateToken, (req, res) => {
  try {
    let query = 'SELECT d.*, c.name as child_name FROM disciplinary d LEFT JOIN children c ON d.child_id = c.id WHERE 1=1';
    const params = [];
    if (req.user.center_id) {
      query += ' AND c.center_id = ?'; params.push(req.user.center_id);
    }
    res.json(db.prepare(query + ' ORDER BY d.created_at DESC').all(...params));
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

app.post('/api/internal/discipline', authenticateToken, (req, res) => {
  try {
    const { child_id, type, description, action_taken } = req.body;
    if (!child_id || !type) return res.status(400).json({ message: 'Enfant et type requis' });
    const result = db.prepare('INSERT INTO disciplinary (child_id, type, description, action_taken, handled_by) VALUES (?,?,?,?,?)').run(
      child_id, type, description || '', action_taken || '', req.user.id
    );
    res.status(201).json({ id: result.lastInsertRowid, message: 'Incident enregistré' });
  } catch (error) { res.status(500).json({ message: 'Erreur serveur' }); }
});

// Route fallback pour React Router (exclure les routes API pour qu'elles soient traitées par les handlers définis plus bas)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});


// ═══════════════════════════════════════════════════════════════
// HR MODULE — Gestion des Ressources Humaines
// Workflow: Secrétaire crée/modifie → Responsable niveau approuve
// ═══════════════════════════════════════════════════════════════

// Helper: scope par niveau hiérarchique
// ═══ HIERARCHY: qui peut créer quoi ═══
function getCreatablePosts(user) {
  // SuperAdmin: bootstrap — crée Responsables N°1 + Secrétaires de chaque niveau
  if (user.level === 'superadmin') {
    return {
      ministere: ['Ministre', 'Secrétaire'],
      national: ['Coordonateur', 'Secrétaire'],
      provincial: ['Coordonateur', 'Secrétaire'],
      sous_provincial: ['Coordonateur', 'Secrétaire'],
      centre: ['Chef de Centre', 'Secrétaire'],
      allowCustom: true
    };
  }

  // Secrétaire: crée les postes opérationnels de son niveau (pas de Responsable N°1, pas d'autre Secrétaire)
  // Finance centralisé au National uniquement — retiré des autres niveaux
  if (user.post === 'Secrétaire') {
    if (user.level === 'ministere') {
      return { ministere: ['Directeur de Cabinet du Ministre', 'Secrétaire Général', 'Comptable ministère', 'Plan'], allowCustom: true };
    }
    if (user.level === 'national') {
      return { national: ['Coordonateur Adjoint', 'Finance', 'Plan', 'Formation'], allowCustom: true };
    }
    if (user.level === 'provincial') {
      return { provincial: ['Coordonateur Adjoint', 'Comptable provincial', 'Plan', 'Formation'], allowCustom: true };
    }
    if (user.level === 'sous_provincial') {
      return { sous_provincial: ['Coordonateur Adjoint', 'Plan', 'Formation'], allowCustom: true };
    }
    if (user.level === 'centre') {
      return { centre: ['Chef de Centre Adjoint', 'Chargé des Opérations', 'Intendant', 'Disciplinaire'], allowCustom: true };
    }
    return { [user.level]: [], allowCustom: true };
  }

  // Responsables et autres: pas de création
  return { allowCustom: false };
}

function isResponsable(user) {
  const r = ['Ministre','Coordonateur','Chef de Centre','Super Administrateur'];
  return r.includes(user.post) || user.level === 'superadmin';
}

function hrScopeFilter(user) {
  // SuperAdmin = technique only, pas dans l'organisation → accès limité
  if (user.level === 'superadmin') return {};
  // Chaque niveau voit UNIQUEMENT son propre niveau
  if (user.level === 'ministere') return { level: 'ministere' };
  // Finance national: vision consolidée pour les validations financières
  if (user.level === 'national' && user.post === 'Finance') return {};
  if (user.level === 'national') return { level: 'national' };
  if (user.level === 'provincial') return { province: user.province };
  if (user.level === 'sous_provincial') return { sous_province: user.sous_province };
  if (user.level === 'centre') return { level: 'centre' };
  return { _denied: true };
}

function hrCanApprove(user) {
  const responsables = ['Ministre','Coordonateur','Chef de Centre','Super Administrateur'];
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


// Postes uniques par scope — ne peuvent exister qu'UNE FOIS par niveau/centre/province
const UNIQUE_POSTS = new Set([
  'Ministre', 'Secrétaire Général', 'Directeur de Cabinet du Ministre',
  'Coordonateur', 'Finance', 'Chef de Centre', 'Secrétaire'
]);

function checkPostUniqueness(postName, level) {
  if (!UNIQUE_POSTS.has(postName)) return null;

  // Vérifier dans users (comptes créés par SuperAdmin)
  const existingUser = db.prepare(
    "SELECT id, name, email FROM users WHERE post = ? AND level = ?"
  ).get(postName, level);
  if (existingUser) {
    return 'Le poste "' + postName + '" existe déjà à ce niveau (' + existingUser.name + '). Un seul ' + postName + ' est autorisé par niveau.';
  }

  // Vérifier dans hr_personnel (agents créés par Secrétaires)
  const existingHr = db.prepare(
    "SELECT id, name FROM hr_personnel WHERE post = ? AND level = ? AND status = 'active'"
  ).get(postName, level);
  if (existingHr) {
    return 'Le poste "' + postName + '" existe déjà à ce niveau (' + existingHr.name + '). Un seul ' + postName + ' est autorisé par niveau.';
  }

  return null;
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
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Non autorisé à créer un agent' });
    const p = req.body;

    // Vérification unicité des postes (pas de doublon pour les postes clés)
    const postLevel = p.level || req.user.level;
    const dupeError = checkPostUniqueness(p.post, postLevel);
    if (dupeError) return res.status(409).json({ message: dupeError });
    const bcrypt = require('bcryptjs');
    
    // Start transaction
    const tx = db.transaction(() => {
      // 1. Create personnel record
      const r = db.prepare("INSERT INTO hr_personnel (matricule,name,postnom,prenom,gender,birth_date,nationality,phone,email,address,address_street,address_city,address_commune,post,level,province,sous_province,center_id,hire_date,created_by) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").run(
        p.matricule, p.name, p.postnom||null, p.prenom||null, p.gender||null, p.birth_date||null, p.nationality||'Congolaise',
        p.phone||null, p.email||null, p.address||null, p.address_street||null, p.address_city||null, p.address_commune||null, p.post, p.level||req.user.level,
        p.province||req.user.province, p.sous_province||req.user.sous_province, p.center_id||req.user.center_id,
        p.hire_date||null, req.user.id
      );
      const personnelId = r.lastInsertRowid;
      let userId = null;
      let generatedEmail = null;
      let generatedPwd = null;
      
      // 2. Create user account if system access requested
      if (p.create_access && p.post) {
        // Generate email from name if not provided
        // Email de LOGIN = TOUJOURS @paide.cd (jamais l'email personnel du formulaire)
        // L'email personnel (p.email) reste stocké dans hr_personnel.email pour information
        const _baseName = (p.prenom || p.name).charAt(0).toLowerCase() + '.' +
          (p.postnom || p.name).toLowerCase().replace(/\s+/g,'').replace(/[^a-z0-9.]/g, '');
        let _candidate = _baseName + '@paide.cd';
        let _sfx = 1;
        while (db.prepare("SELECT id FROM users WHERE email = ?").get(_candidate)) {
          _candidate = _baseName + _sfx + '@paide.cd';
          _sfx++;
        }
        generatedEmail = _candidate;
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
    // Auto-approve uniquement si SuperAdmin (bootstrap)
    // Secrétaires créent -> approbation par Responsable N°1 du niveau
    if (req.user.level === 'superadmin') {
      // SuperAdmin bootstrap = auto-approuvé
    } else {
      submitForApproval(db, 'personnel', result.personnelId, 'create', req.user, p);
    }
    
    const response = { 
      id: result.personnelId, 
      message: req.user.level === 'superadmin' ? 'Agent créé et approuvé' : 'Agent créé, en attente d\'approbation du Responsable' 
    };
    if (result.userId) {
      response.access = { 
        user_id: result.userId, 
        email: result.generatedEmail, 
        temporary_password: result.generatedPwd,
        message: 'Compte créé. Remettez ces identifiants à l\'agent.'
      };
    }
    res.status(201).json(response);
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
    res.json({ message: 'Modification en attente d\'approbation' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});

// ─── PAIE ───


// Génération automatique mensuelle depuis les contrats actifs

// Double signature — approbation Responsable puis Finance


// Rapport: budget vs masse salariale engagée

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
    res.status(201).json({ id: r.lastInsertRowid, message: 'Formation créée, en attente d\'approbation' });
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


// Endpoint: suggestion salaire depuis grille pour pré-remplissage frontend

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
    // L'organigramme doit montrer TOUTES les personnes de l'organisation:
    // 1. Les users créés par SuperAdmin (Responsables + Secrétaires)
    // 2. Les hr_personnel créés par les Secrétaires (agents)
    // Fusionnés et dédupliqués.

    const scope = hrScopeFilter(req.user);

    // A. Users de la table users (comptes de login)
    let userQuery = "SELECT id, name, postnom, prenom, post, level, province, sous_province, center_id, avatar_url, 'user' as source FROM users WHERE level != 'superadmin'";
    const params = [];
    if (scope.level) { userQuery += " AND level = ?"; params.push(scope.level); }
    if (scope.province) { userQuery += " AND province = ?"; params.push(scope.province); }
    // center_id non filtré pour organigramme (vision complète du niveau)
    const users = db.prepare(userQuery).all(...params);

    // B. hr_personnel (agents enregistrés par les Secrétaires)
    let hrQuery = "SELECT p.id, p.name, p.postnom, p.prenom, p.post, p.level, p.province, p.sous_province, p.center_id, p.photo_url as avatar_url, p.user_id, 'personnel' as source FROM hr_personnel p WHERE p.status = 'active'";
    const hrParams = [];
    if (scope.level) { hrQuery += " AND p.level = ?"; hrParams.push(scope.level); }
    if (scope.province) { hrQuery += " AND p.province = ?"; hrParams.push(scope.province); }
    // center_id non filtré pour organigramme
    const hrPersonnel = db.prepare(hrQuery).all(...hrParams);

    // C. Fusionner et dédupliquer (hr_personnel avec user_id = déjà dans users)
    const userIds = new Set(users.map(u => u.id));
    const merged = [...users];
    for (const hp of hrPersonnel) {
      if (hp.user_id && userIds.has(hp.user_id)) continue; // déjà dans users
      merged.push(hp);
    }

    // D. Hiérarchie des postes (du plus haut au plus bas)
    const postHierarchy = [
      'Ministre',
      'Secrétaire Général',
      'Directeur de Cabinet du Ministre',
      'Coordonateur',
      'Coordonateur Adjoint',
      'Finance',
      'Comptable ministère',
      'Comptable provincial',
      'Plan',
      'Formation',
      'Chef de Centre',
      'Chef de Centre Adjoint',
      'Secrétaire',
      'Chargé des Opérations',
      'Intendant',
      'Disciplinaire',
    ];

    // E. Grouper par poste
    const byPost = {};
    merged.forEach(p => {
      const key = p.post || 'Autre';
      if (!byPost[key]) byPost[key] = [];
      byPost[key].push({
        id: p.id,
        name: p.name,
        postnom: p.postnom || null,
        prenom: p.prenom || null,
        post: p.post,
        level: p.level,
        province: p.province,
        center_id: p.center_id,
        avatar_url: p.avatar_url,
        source: p.source,
      });
    });

    // F. Ajouter les postes non couverts dans l'ordre
    const orderedPosts = postHierarchy.filter(p => byPost[p]);
    // Ajouter les postes qui ne sont pas dans la hiérarchie connue
    Object.keys(byPost).forEach(p => {
      if (!orderedPosts.includes(p)) orderedPosts.push(p);
    });

    res.json({
      personnel: merged,
      byPost,
      order: orderedPosts,
      total: merged.length,
    });
  } catch (e) { console.error('organigram error:', e); res.status(500).json({ message: 'Erreur' }); }
});


// ═══ FINANCE ROUTES ═══
function financeScopeFilter(user) {
  if (user.level === 'superadmin') return {};
  // Chaque niveau voit UNIQUEMENT son propre niveau
  if (user.level === 'ministere') return { level: 'ministere' };
  // Finance national: vision consolidée pour les validations financières
  if (user.level === 'national' && user.post === 'Finance') return {};
  if (user.level === 'national') return { level: 'national' };
  if (user.level === 'provincial') return { province: user.province };
  if (user.level === 'sous_provincial') return { sous_province: user.sous_province };
  if (user.level === 'centre') return { level: 'centre' };
  return { _denied: true };
}

function financeCanManage(user) {
  // STRICT: seul Finance national + SuperAdmin peuvent valider la paie (2ème signature) ou modifier dépenses/budget
  return (user.level === 'national' && user.post === 'Finance') || user.level === 'superadmin';
}

// Grille salariale: politique ministère (Ministre + SG + Finance national + SuperAdmin)
function financeCanManageGrid(user) {
  const roles = ['Ministre', 'Secrétaire Général', 'Finance'];
  if (user.level === 'superadmin') return true;
  if (roles.includes(user.post) && (user.level === 'ministere' || user.level === 'national')) return true;
  return false;
}

// Comptable: lecture + rapport, aucun pouvoir d'approbation ni de modification budgétaire
function isComptable(user) {
  return user.post === 'Comptable ministère' || user.post === 'Comptable provincial';
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


// ═══ HR FILE UPLOADS ═══
app.post('/api/internal/hr/personnel/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Aucun fichier' });
    const fileUrl = '/uploads/' + req.file.filename;
    res.json({ url: fileUrl, filename: req.file.filename, size: req.file.size });
  } catch (e) { res.status(500).json({ message: 'Erreur upload' }); }
});

// Update personnel with document URLs
app.put('/api/internal/hr/personnel/:id/documents', authenticateToken, (req, res) => {
  try {
    if (!hrIsSecretaire(req.user)) return res.status(403).json({ message: 'Réservé aux Secrétaires' });
    const id = parseInt(req.params.id);
    const { photo_url, id_card_url, diploma1_url, diploma2_url, diploma3_url } = req.body;
    db.prepare("UPDATE hr_personnel SET photo_url=COALESCE(?,photo_url), id_card_url=COALESCE(?,id_card_url), diploma1_url=COALESCE(?,diploma1_url), diploma2_url=COALESCE(?,diploma2_url), diploma3_url=COALESCE(?,diploma3_url) WHERE id=?").run(
      photo_url || null, id_card_url || null, diploma1_url || null, diploma2_url || null, diploma3_url || null, id
    );
    res.json({ message: 'Documents mis à jour' });
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});


// ═══ SALARY GRID (Grille salariale officielle) ═══





// Endpoint: récupérer les postes que l'utilisateur peut créer
app.get('/api/internal/hr/creatable-posts', authenticateToken, (req, res) => {
  try {
    const posts = getCreatablePosts(req.user);
    res.json(posts);
  } catch (e) { res.status(500).json({ message: 'Erreur' }); }
});


// Queue des paies en attente de 2ème signature (spécifique Finance national)

// Dashboard Finance national consolidé


// ─── SELF-SERVICE AGENT: coordonnées bancaires ───


// ─── FINANCE NATIONAL: bordereau bancaire ───
// Pré-visualisation — quels agents seront exportés, lesquels manquent de coord

// Génération bordereau — par province ou toutes les provinces

// Liste des bordereaux

// Export CSV d'un bordereau + transition de statut

// Lire les détails d'un bordereau (sans exporter)


// ─── MÉCANISATION (Fonction Publique) ───
// Peut être déclenchée par: Finance national, Secrétaire Général, Ministre, SuperAdmin
function canManageMecanisation(user) {
  // SEUL le Secrétaire national génère la liste de mécanisation
  // (les autres Secrétaires enregistrent les agents, ils remontent automatiquement ici)
  if (user.level === 'superadmin') return true;
  if (user.level === 'national' && user.post === 'Secrétaire') return true;
  return false;
}

const PAIDE_LEVEL_LABELS = {"ministere":"Ministère","national":"National","provincial":"Provincial","sous_provincial":"Sous-Provincial","centre":"Centre"};

// Liste des agents non encore mécanisés (pending)
app.get('/api/internal/hr/mecanisation/pending', authenticateToken, (req, res) => {
  try {
    if (!canManageMecanisation(req.user)) return res.status(403).json({ message: 'Réservé au responsable Mécanisation' });
    const rows = db.prepare(`
      SELECT id, matricule, name, postnom, prenom, post, level, province, nationality,
             address_street, address_city, address_commune, address, hire_date
      FROM hr_personnel
      WHERE status = 'active' AND mecanisation_sent_at IS NULL
      ORDER BY level, province, name
    `).all();
    res.json(rows);
  } catch (e) { console.error('mecanisation pending:', e); res.status(500).json({ message: 'Erreur' }); }
});

// Historique des lots envoyés
app.get('/api/internal/hr/mecanisation/batches', authenticateToken, (req, res) => {
  try {
    if (!canManageMecanisation(req.user)) return res.status(403).json({ message: 'Réservé' });
    const rows = db.prepare(`
      SELECT b.*, u.name as generated_by_name
      FROM hr_mecanisation_batch b
      LEFT JOIN users u ON b.generated_by = u.id
      ORDER BY b.generated_at DESC
    `).all();
    res.json(rows);
  } catch (e) { console.error('mecanisation batches:', e); res.status(500).json({ message: 'Erreur' }); }
});

// Générer un lot (marque les agents comme envoyés ET crée le batch)
app.post('/api/internal/hr/mecanisation/generate', authenticateToken, (req, res) => {
  try {
    if (!canManageMecanisation(req.user)) return res.status(403).json({ message: 'Réservé' });
    const { notes, personnel_ids } = req.body || {};
    // Si personnel_ids fourni: export de ces agents uniquement. Sinon: tous les pending.
    let candidates;
    if (Array.isArray(personnel_ids) && personnel_ids.length > 0) {
      const placeholders = personnel_ids.map(() => '?').join(',');
      candidates = db.prepare(`SELECT * FROM hr_personnel WHERE id IN (${placeholders}) AND status='active' AND mecanisation_sent_at IS NULL`).all(...personnel_ids);
    } else {
      candidates = db.prepare("SELECT * FROM hr_personnel WHERE status='active' AND mecanisation_sent_at IS NULL").all();
    }
    if (candidates.length === 0) return res.status(400).json({ message: 'Aucun agent en attente de mécanisation' });

    const now = new Date();
    const batchNumber = 'PAIDE-MEC-' + now.getFullYear() + String(now.getMonth()+1).padStart(2,'0') + String(now.getDate()).padStart(2,'0') + '-' + String(now.getHours()).padStart(2,'0') + String(now.getMinutes()).padStart(2,'0');
    const nowISO = now.toISOString();

    const tx = db.transaction(() => {
      const r = db.prepare("INSERT INTO hr_mecanisation_batch (batch_number,agent_count,generated_at,generated_by,notes) VALUES (?,?,?,?,?)").run(
        batchNumber, candidates.length, nowISO, req.user.id, notes || null
      );
      const batchId = r.lastInsertRowid;
      const upd = db.prepare("UPDATE hr_personnel SET mecanisation_sent_at=?, mecanisation_batch_id=? WHERE id=?");
      for (const c of candidates) upd.run(nowISO, batchId, c.id);
      return batchId;
    });
    const batchId = tx();
    res.status(201).json({ id: batchId, batch_number: batchNumber, agent_count: candidates.length, message: candidates.length + ' agent(s) inclus dans le lot ' + batchNumber });
  } catch (e) { console.error('mecanisation generate:', e); res.status(500).json({ message: 'Erreur' }); }
});

// Détail d'un lot
app.get('/api/internal/hr/mecanisation/batches/:id', authenticateToken, (req, res) => {
  try {
    if (!canManageMecanisation(req.user)) return res.status(403).json({ message: 'Réservé' });
    const id = parseInt(req.params.id);
    const batch = db.prepare("SELECT * FROM hr_mecanisation_batch WHERE id=?").get(id);
    if (!batch) return res.status(404).json({ message: 'Lot introuvable' });
    const agents = db.prepare(`
      SELECT id, matricule, name, postnom, prenom, post, level, province, nationality,
             address_street, address_city, address_commune, address
      FROM hr_personnel WHERE mecanisation_batch_id = ?
      ORDER BY level, province, name
    `).all(id);
    res.json({ ...batch, agents });
  } catch (e) { console.error('mecanisation batch detail:', e); res.status(500).json({ message: 'Erreur' }); }
});

// Export CSV d'un lot (pour envoi à la Fonction Publique)
app.get('/api/internal/hr/mecanisation/batches/:id/export', authenticateToken, (req, res) => {
  try {
    if (!canManageMecanisation(req.user)) return res.status(403).json({ message: 'Réservé' });
    const id = parseInt(req.params.id);
    const batch = db.prepare("SELECT * FROM hr_mecanisation_batch WHERE id=?").get(id);
    if (!batch) return res.status(404).json({ message: 'Lot introuvable' });
    const rows = db.prepare(`
      SELECT matricule, name, postnom, prenom, post, level, province, nationality,
             address_street, address_city, address_commune, address
      FROM hr_personnel WHERE mecanisation_batch_id = ?
      ORDER BY level, province, name
    `).all(id);

    const headers = ['Matricule','Nom','Postnom','Prénom','Poste','Niveau','Province','Nationalité','Adresse'];
    const escape = (v) => {
      if (v === null || v === undefined) return '';
      const s = String(v).replace(/"/g, '""');
      return /[",;\n\r]/.test(s) ? '"' + s + '"' : s;
    };
    const composeAddress = (r) => {
      const parts = [r.address_street, r.address_commune, r.address_city].filter(Boolean);
      if (parts.length > 0) return parts.join(', ');
      return r.address || '';
    };
    const levelLabel = (lvl) => PAIDE_LEVEL_LABELS[lvl] || lvl || '';

    const lines = [headers.join(',')];
    for (const r of rows) {
      lines.push([
        r.matricule, r.name, r.postnom, r.prenom, r.post, levelLabel(r.level), r.province, r.nationality, composeAddress(r)
      ].map(escape).join(','));
    }
    const csv = '\ufeff' + lines.join('\r\n') + '\r\n';
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + batch.batch_number + '.csv"');
    res.send(csv);
  } catch (e) { console.error('mecanisation export:', e); res.status(500).json({ message: 'Erreur' }); }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Serveur PAIDE démarré sur le port ${PORT}`);
  console.log('🔐 COMPTES HIÉRARCHIE PAIDE:');
  console.log('SUPER ADMIN: admin@paide.cd / SuperAdmin2024!');
  console.log('MINISTRE: ministre@paide.cd / minister123');
  console.log('SECRÉTAIRE MINISTRE: secretaire.ministre@paide.cd / secmin123');
  console.log('COORD NATIONAL: coord.national@paide.cd / coordnat123');
  console.log('SECRÉTAIRE NATIONAL: secretaire.national@paide.cd / secnat123');
  console.log('COORD PROVINCIAL: coord.kinshasa@paide.cd / provkin123');
  console.log('SECRÉTAIRE PROVINCIAL: secretaire.kinshasa@paide.cd / seckin123');
});