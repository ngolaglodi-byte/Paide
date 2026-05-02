const fs = require("fs");
let code = fs.readFileSync("/app/server.js", "utf8");

// Fix all SQL with double-quoted strings → single quotes
// "active" → 'active', "pending" → 'pending', "en_attente" → 'en_attente', etc.
// In SQLite, double-quoted identifiers are columns, single-quoted are strings
code = code.replace(/WHERE status = "active"/g, "WHERE status = 'active'");
code = code.replace(/WHERE status = "pending"/g, "WHERE status = 'pending'");
code = code.replace(/WHERE status="active"/g, "WHERE status='active'");
code = code.replace(/WHERE status="en_attente"/g, "WHERE status='en_attente'");
code = code.replace(/WHERE status="graduated"/g, "WHERE status='graduated'");
code = code.replace(/AND status="active"/g, "AND status='active'");
code = code.replace(/AND status = "active"/g, "AND status = 'active'");

// Fix the decisions route — wrap reports query in try/catch (table may not exist)
code = code.replace(
  "const pendingReports = db.prepare('SELECT r.*, u.name as author_name FROM reports r JOIN users u ON r.from_user = u.id WHERE r.status = ? ORDER BY r.created_at DESC').all('pending');",
  "let pendingReports = []; try { pendingReports = db.prepare('SELECT r.*, u.name as author_name FROM reports r JOIN users u ON r.from_user = u.id WHERE r.status = ? ORDER BY r.created_at DESC').all('pending'); } catch {}"
);

// Fix hardcoded KPI values with real DB queries wrapped in try/catch
code = code.replace(
  /children_active: 18200,/,
  "children_active: (() => { try { return db.prepare(\"SELECT COUNT(*) as c FROM children WHERE status='active'\").get().c; } catch { return 0; } })(),"
);

fs.writeFileSync("/app/server.js", code);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("SYNTAX OK");
} catch (e) {
  console.log("SYNTAX ERROR: " + e.stderr.split("\n")[0]);
}
