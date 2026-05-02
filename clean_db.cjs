const db = require("better-sqlite3")("/app/data/app.db");
const bcrypt = require("bcryptjs");

db.pragma("foreign_keys = OFF");

const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name != 'sqlite_sequence'").all();
console.log("Tables:", tables.map(t => t.name).join(", "));

// Clear all tables except users and decision_types
tables.forEach(t => {
  if (t.name === "users" || t.name === "decision_types") return;
  try {
    const r = db.prepare("DELETE FROM " + t.name).run();
    if (r.changes > 0) console.log("Cleared " + t.name + ": " + r.changes);
  } catch(e) {}
});

// Delete all users except admin
const d = db.prepare("DELETE FROM users WHERE email != 'admin@paide.cd'").run();
console.log("Users deleted:", d.changes);

db.pragma("foreign_keys = ON");

// Reset admin password
db.prepare("UPDATE users SET password=?, must_change_password=0 WHERE email='admin@paide.cd'").run(
  bcrypt.hashSync("SuperAdmin2024!", 10)
);

// Verify clean state
console.log("\n=== CLEAN STATE ===");
tables.forEach(t => {
  try {
    const c = db.prepare("SELECT COUNT(*) as c FROM " + t.name).get().c;
    console.log(t.name + ": " + c);
  } catch {}
});
