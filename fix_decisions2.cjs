const fs = require("fs");
let code = fs.readFileSync("/app/server.js", "utf8");

// The issue: db.prepare('SELECT ... WHERE status = 'active'') 
// Single quotes inside single-quoted string breaks JS
// Solution: use escaped single quotes or backtick template literals

// Fix pattern: db.prepare('...WHERE status = 'active'...')  →  db.prepare(`...WHERE status = 'active'...`)
// Find all db.prepare('...') that contain unescaped single quotes from our earlier replacement
const lines = code.split('\n');
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  // Find lines with db.prepare('...') where inner single quotes break the string
  if (line.includes("db.prepare('") && (line.match(/'/g) || []).length > 4) {
    // Count quotes - if there are nested single quotes, switch to backticks
    const prepareMatch = line.match(/db\.prepare\('(.*?)'\)/);
    if (prepareMatch && prepareMatch[1].includes("'")) {
      lines[i] = line.replace(/db\.prepare\('(.*?)'\)/, (match, sql) => {
        return 'db.prepare(`' + sql + '`)';
      });
    }
  }
}
code = lines.join('\n');

fs.writeFileSync("/app/server.js", code);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("SYNTAX OK");
} catch (e) {
  const errLine = e.stderr.match(/server\.cjs:(\d+)/);
  if (errLine) {
    console.log("SYNTAX ERROR at line " + errLine[1]);
    const l = parseInt(errLine[1]);
    console.log(lines.slice(l-2, l+2).join('\n'));
  } else {
    console.log("SYNTAX ERROR: " + e.stderr.split('\n').slice(0,3).join(' '));
  }
}
