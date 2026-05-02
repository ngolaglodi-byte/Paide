const db = require("better-sqlite3")("/app/data/app.db");
const bcrypt = require("bcryptjs");

const users = [
  // Ministère
  { name:"Jean", postnom:"Mutombo", email:"j.mutombo@paide.cd", level:"ministere", post:"Ministre", province:null, parent_id:null },
  { name:"Sophie", postnom:"Kalanga", email:"s.kalanga@paide.cd", level:"ministere", post:"Secrétaire", province:null, parent_id:null },
  // National
  { name:"Pierre", postnom:"Mwamba", email:"p.mwamba@paide.cd", level:"national", post:"Coordinateur National", province:null, parent_id:null },
  { name:"Marie", postnom:"Lukusa", email:"m.lukusa@paide.cd", level:"national", post:"Chargé de Formation", province:null, parent_id:null },
  { name:"Paul", postnom:"Tshimanga", email:"p.tshimanga@paide.cd", level:"national", post:"Chargé de Suivi", province:null, parent_id:null },
  // Provincial Kinshasa
  { name:"Joseph", postnom:"Kabila", email:"j.kabila@paide.cd", level:"provincial", post:"Coordinateur Provincial", province:"Kinshasa", parent_id:null },
  { name:"Anne", postnom:"Mutinga", email:"a.mutinga@paide.cd", level:"provincial", post:"Secrétaire", province:"Kinshasa", parent_id:null },
  // Provincial Katanga
  { name:"David", postnom:"Ilunga", email:"d.ilunga@paide.cd", level:"provincial", post:"Coordinateur Provincial", province:"Haut-Katanga", parent_id:null },
  // Sous-Provincial
  { name:"Samuel", postnom:"Kasongo", email:"s.kasongo@paide.cd", level:"sous_provincial", post:"Coordinateur Sous-Provincial", province:"Kinshasa", sous_province:"Lukunga", parent_id:null },
  // Centre
  { name:"Alice", postnom:"Banza", email:"a.banza@paide.cd", level:"centre", post:"Chef de Centre", province:"Kinshasa", center_id:1, parent_id:null },
];

const pwd = bcrypt.hashSync("PAIDE-2024!", 10);

users.forEach(u => {
  const existing = db.prepare("SELECT id FROM users WHERE email=?").get(u.email);
  if (!existing) {
    db.prepare("INSERT INTO users (name, postnom, email, password, level, post, province, sous_province, center_id, parent_id, status, must_change_password) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)").run(
      u.name, u.postnom, u.email, pwd, u.level, u.post, u.province || null, u.sous_province || null, u.center_id || null, u.parent_id, "active", 0
    );
    console.log("CREATED: " + u.email + " (" + u.post + " - " + u.level + ")");
  } else {
    // Just reset password
    db.prepare("UPDATE users SET password=?, must_change_password=0 WHERE email=?").run(pwd, u.email);
    console.log("EXISTS: " + u.email + " (password reset)");
  }
});

// Also reset existing users passwords
["admin@paide.cd","g.ngola@paide.cd","g.kabongo@paide.cd"].forEach(e => {
  db.prepare("UPDATE users SET password=?, must_change_password=0 WHERE email=?").run(pwd, e);
});

console.log("\nAll accounts password: PAIDE-2024!");
console.log("Total users: " + db.prepare("SELECT COUNT(*) as c FROM users").get().c);
