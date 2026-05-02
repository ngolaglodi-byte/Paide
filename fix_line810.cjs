const fs = require("fs");
const lines = fs.readFileSync("/app/server.js", "utf8").split("\n");

// Fix any line that has db.prepare('...') with nested single quotes
for (let i = 0; i < lines.length; i++) {
  // Pattern: db.prepare('...status = 'active'...')
  if (lines[i].includes("db.prepare(") && lines[i].includes("= 'active'")) {
    // Replace the outer single quotes of db.prepare('...') with double quotes
    lines[i] = lines[i].replace(/db\.prepare\('([^']*)'\s*'([^']*)'\s*'?\)/g, (m) => {
      // Brute force: replace prepare(' with prepare(" and the last ') with ")
      return m;
    });
    // Just replace the whole prepare call to use double quotes
    // db.prepare('SELECT...WHERE status = 'active'').get()
    // → db.prepare("SELECT...WHERE status = 'active'").get()
    lines[i] = lines[i]
      .replace(/db\.prepare\('SELECT/, 'db.prepare("SELECT')
      .replace(/'active''\)/, "'active'\")");
    console.log("Fixed line " + (i+1) + ": " + lines[i].trim().substring(0, 80));
  }
  
  // Also fix: WHERE status='active' inside prepare('...')
  if (lines[i].includes("db.prepare(") && lines[i].includes("status='active'")) {
    lines[i] = lines[i]
      .replace(/db\.prepare\('(.*?)status='active'(.*?)'\)/, 'db.prepare("$1status=\'active\'$2")');
    console.log("Fixed line " + (i+1) + ": " + lines[i].trim().substring(0, 80));
  }
}

fs.writeFileSync("/app/server.js", lines.join("\n"));
fs.copyFileSync("/app/server.js", "/app/server.cjs");
try {
  require("child_process").execSync("node --check /app/server.cjs", {encoding:"utf8"});
  console.log("SYNTAX OK");
} catch(e) {
  const m = e.stderr.match(/server\.cjs:(\d+)/);
  if (m) {
    const l = parseInt(m[1]);
    console.log("ERROR at line " + l + ": " + lines[l-1].trim().substring(0,100));
  }
}
