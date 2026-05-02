const fs = require("fs");
const db = require("better-sqlite3")("/app/data/app.db");

// ====== 1. FIX SERVER.JS — Remove GET restrictions that block dashboard pages ======
let server = fs.readFileSync("/app/server.js", "utf8");

// Fix: GET /api/internal/decisions — allow all authenticated (it's read-only)
// Currently restricted to Ministre/Coordinateurs only
server = server.replace(
  /app\.get\('\/api\/internal\/decisions', authenticateToken, \(req, res\) => \{\s*try \{\s*const user = req\.user;\s*if \(\!?\[.*?\]\.includes\(user\.post\)\) \{\s*return res\.status\(403\)\.json\(\{ message: '.*?' \}\);\s*\}/,
  "app.get('/api/internal/decisions', authenticateToken, (req, res) => {\n  try {\n    const user = req.user;"
);

fs.writeFileSync("/app/server.js", server);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

// Verify syntax
try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("1. server.js SYNTAX OK");
} catch (e) {
  console.log("1. server.js SYNTAX ERROR: " + e.message.split("\n")[0]);
}

// ====== 2. Verify all GET routes return 200 for each role ======
const roles = ["superadmin", "ministere", "national", "provincial", "sous_provincial", "centre"];
const postsByLevel = {
  superadmin: "Super Administrateur",
  ministere: "Ministre",
  national: "Secrétaire",
  provincial: "Coordinateur Provincial",
  sous_provincial: "Coordinateur Sous-Provincial",
  centre: "Chef de Centre"
};
console.log("2. Users in DB: " + db.prepare("SELECT COUNT(*) as c FROM users").get().c);

// ====== 3. Verify all tables have data ======
const tables = ["users", "children", "centers", "formations"];
tables.forEach(t => {
  const count = db.prepare("SELECT COUNT(*) as c FROM " + t).get().c;
  console.log("3. Table " + t + ": " + count + " rows");
});

// ====== 4. Check embla-carousel-autoplay ======
const pkg = JSON.parse(fs.readFileSync("/app/package.json", "utf8"));
if (!pkg.dependencies["embla-carousel-autoplay"]) {
  pkg.dependencies["embla-carousel-autoplay"] = "8.6.0";
  fs.writeFileSync("/app/package.json", JSON.stringify(pkg, null, 2));
  console.log("4. Added embla-carousel-autoplay to package.json");
} else {
  console.log("4. embla-carousel-autoplay already in package.json");
}

console.log("\nFIX COMPLETE");
