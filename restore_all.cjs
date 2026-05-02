const db = require("better-sqlite3")("/app/data/app.db");
const bcrypt = require("bcryptjs");
const pwd = bcrypt.hashSync("PAIDE-2024!", 10);

// ═══ 1. RESTORE USERS (12 + admin) ═══
const users = [
  { name:"Jean", postnom:"Mutombo", email:"j.mutombo@paide.cd", level:"ministere", post:"Ministre", province:null },
  { name:"Sophie", postnom:"Kalanga", email:"s.kalanga@paide.cd", level:"ministere", post:"Secrétaire", province:null },
  { name:"Pierre", postnom:"Mwamba", email:"p.mwamba@paide.cd", level:"national", post:"Coordinateur National", province:null },
  { name:"glody", postnom:"ngola", email:"g.ngola@paide.cd", level:"national", post:"Secrétaire", province:null },
  { name:"Marie", postnom:"Kabongo", email:"g.kabongo@paide.cd", level:"national", post:"Chargé de Plan", province:null },
  { name:"Marie", postnom:"Lukusa", email:"m.lukusa@paide.cd", level:"national", post:"Chargé de Formation", province:null },
  { name:"Paul", postnom:"Tshimanga", email:"p.tshimanga@paide.cd", level:"national", post:"Chargé de Suivi", province:null },
  { name:"Joseph", postnom:"Kabila", email:"j.kabila@paide.cd", level:"provincial", post:"Coordinateur Provincial", province:"Kinshasa" },
  { name:"Anne", postnom:"Mutinga", email:"a.mutinga@paide.cd", level:"provincial", post:"Secrétaire", province:"Kinshasa" },
  { name:"David", postnom:"Ilunga", email:"d.ilunga@paide.cd", level:"provincial", post:"Coordinateur Provincial", province:"Haut-Katanga" },
  { name:"Samuel", postnom:"Kasongo", email:"s.kasongo@paide.cd", level:"sous_provincial", post:"Coordinateur Sous-Provincial", province:"Kinshasa", sous_province:"Lukunga" },
  { name:"Alice", postnom:"Banza", email:"a.banza@paide.cd", level:"centre", post:"Chef de Centre", province:"Kinshasa", center_id:1 },
];

const uStmt = db.prepare("INSERT OR IGNORE INTO users (name,postnom,email,password,level,post,province,sous_province,center_id,status,must_change_password) VALUES (?,?,?,?,?,?,?,?,?,?,?)");
users.forEach(u => {
  uStmt.run(u.name, u.postnom, u.email, pwd, u.level, u.post, u.province||null, u.sous_province||null, u.center_id||null, "active", 0);
});
// Reset admin password too
db.prepare("UPDATE users SET password=?, must_change_password=0 WHERE email='admin@paide.cd'").run(bcrypt.hashSync("SuperAdmin2024!", 10));
console.log("Users: " + db.prepare("SELECT COUNT(*) as c FROM users").get().c);

// ═══ 2. RESTORE CENTERS ═══
const centers = [
  { name:"Centre PAIDE Kinshasa", province:"Kinshasa", address:"Avenue de la Libération, Kinshasa", capacity:200 },
  { name:"Centre PAIDE Kananga", province:"Kasai", address:"Quartier Katoka, Kananga", capacity:150 },
  { name:"Centre PAIDE Goma", province:"Nord-Kivu", address:"Avenue du Lac, Goma", capacity:180 },
  { name:"Centre PAIDE Lubumbashi", province:"Haut-Katanga", address:"Avenue Mobutu, Lubumbashi", capacity:220 },
  { name:"Centre PAIDE Bukavu", province:"Sud-Kivu", address:"Avenue Patrice Lumumba, Bukavu", capacity:160 },
];
const cStmt = db.prepare("INSERT OR IGNORE INTO centers (name,province,address,capacity,status) VALUES (?,?,?,?,?)");
centers.forEach(c => cStmt.run(c.name, c.province, c.address, c.capacity, "active"));
console.log("Centers: " + db.prepare("SELECT COUNT(*) as c FROM centers").get().c);

// ═══ 3. RESTORE FORMATIONS ═══
const formations = [
  { name:"Informatique Kinshasa", filiere:"Informatique", center_id:1, trainer:"Prof. Mukendi", enrolled_count:25 },
  { name:"Couture Kinshasa", filiere:"Couture", center_id:1, trainer:"Mme Ngalula", enrolled_count:30 },
  { name:"Menuiserie Kananga", filiere:"Menuiserie", center_id:2, trainer:"M. Tshilanda", enrolled_count:20 },
  { name:"Agriculture Goma", filiere:"Agriculture", center_id:3, trainer:"M. Bahati", enrolled_count:18 },
  { name:"Mécanique Lubumbashi", filiere:"Mécanique", center_id:4, trainer:"M. Katanga", enrolled_count:22 },
  { name:"Informatique Bukavu", filiere:"Informatique", center_id:5, trainer:"Prof. Amani", enrolled_count:15 },
  { name:"Couture Goma", filiere:"Couture", center_id:3, trainer:"Mme Furaha", enrolled_count:28 },
  { name:"Agriculture Kananga", filiere:"Agriculture", center_id:2, trainer:"M. Kabuya", enrolled_count:16 },
];
const fStmt = db.prepare("INSERT OR IGNORE INTO formations (name,filiere,center_id,trainer,enrolled_count,status) VALUES (?,?,?,?,?,?)");
formations.forEach(f => fStmt.run(f.name, f.filiere, f.center_id, f.trainer, f.enrolled_count, "active"));
console.log("Formations: " + db.prepare("SELECT COUNT(*) as c FROM formations").get().c);

// ═══ 4. RESTORE CHILDREN ═══
const children = [
  { name:"Jean Mutombo", age:14, gender:"M", situation:"Orphelin", center_id:1, formation_id:1 },
  { name:"Marie Kalanga", age:16, gender:"F", situation:"Déscolarisée", center_id:1, formation_id:2 },
  { name:"Paul Mwamba", age:15, gender:"M", situation:"Enfant de la rue", center_id:1, formation_id:1 },
  { name:"Grace Lukusa", age:13, gender:"F", situation:"Famille pauvre", center_id:2, formation_id:3 },
  { name:"David Ilunga", age:17, gender:"M", situation:"Orphelin", center_id:2, formation_id:8 },
  { name:"Sophie Tshimanga", age:14, gender:"F", situation:"Déscolarisée", center_id:3, formation_id:4 },
  { name:"Pierre Bahati", age:16, gender:"M", situation:"Enfant de la rue", center_id:3, formation_id:7 },
  { name:"Anne Furaha", age:15, gender:"F", situation:"Famille pauvre", center_id:3, formation_id:7 },
  { name:"Samuel Katanga", age:14, gender:"M", situation:"Orphelin", center_id:4, formation_id:5 },
  { name:"Alice Kabila", age:13, gender:"F", situation:"Déscolarisée", center_id:4, formation_id:5 },
  { name:"Joseph Amani", age:16, gender:"M", situation:"Enfant de la rue", center_id:5, formation_id:6 },
  { name:"Claire Banza", age:15, gender:"F", situation:"Famille pauvre", center_id:5, formation_id:6 },
  { name:"Emmanuel Kasongo", age:17, gender:"M", situation:"Orphelin", center_id:1, formation_id:2 },
  { name:"Diane Mutinga", age:14, gender:"F", situation:"Déscolarisée", center_id:2, formation_id:3 },
  { name:"Patrick Kabuya", age:16, gender:"M", situation:"Famille pauvre", center_id:4, formation_id:5 },
];
const chStmt = db.prepare("INSERT OR IGNORE INTO children (name,age,gender,situation,center_id,formation_id,status) VALUES (?,?,?,?,?,?,?)");
children.forEach(c => chStmt.run(c.name, c.age, c.gender, c.situation, c.center_id, c.formation_id, "active"));
console.log("Children: " + db.prepare("SELECT COUNT(*) as c FROM children").get().c);

// ═══ 5. RESTORE EQUIPMENT ═══
const equipment = [
  { name:"Ordinateur HP", category:"Informatique", center_id:1, quantity:10, status:"Bon état" },
  { name:"Machine à coudre Singer", category:"Couture", center_id:1, quantity:8, status:"Bon état" },
  { name:"Scie circulaire", category:"Menuiserie", center_id:2, quantity:3, status:"Bon état" },
  { name:"Houe", category:"Agriculture", center_id:3, quantity:20, status:"Bon état" },
  { name:"Clé à molette", category:"Mécanique", center_id:4, quantity:15, status:"Bon état" },
  { name:"Projecteur", category:"Informatique", center_id:5, quantity:2, status:"Bon état" },
  { name:"Tissu (mètres)", category:"Couture", center_id:3, quantity:50, status:"Neuf" },
  { name:"Raboteuse", category:"Menuiserie", center_id:2, quantity:2, status:"Bon état" },
  { name:"Semences", category:"Agriculture", center_id:3, quantity:100, status:"Neuf" },
  { name:"Imprimante", category:"Informatique", center_id:1, quantity:2, status:"Bon état" },
  { name:"Fer à repasser", category:"Couture", center_id:1, quantity:5, status:"Bon état" },
  { name:"Tournevis set", category:"Mécanique", center_id:4, quantity:10, status:"Bon état" },
];
try {
  const eStmt = db.prepare("INSERT INTO equipment (name,category,center_id,quantity,status) VALUES (?,?,?,?,?)");
  equipment.forEach(e => eStmt.run(e.name, e.category, e.center_id, e.quantity, e.status));
} catch(e) { console.log("Equipment table issue: " + e.message); }
try { console.log("Equipment: " + db.prepare("SELECT COUNT(*) as c FROM equipment").get().c); } catch {}

console.log("\n=== RESTORE COMPLETE ===");
console.log("Password for all accounts: PAIDE-2024!");
console.log("Admin: admin@paide.cd / SuperAdmin2024!");
