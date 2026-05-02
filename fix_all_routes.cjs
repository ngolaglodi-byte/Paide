const fs = require("fs");
let code = fs.readFileSync("/app/server.js", "utf8");
const lines = code.split("\n");

// Helper: wrap a simple res.json(array) into paginated { data, total }
// Find GET routes that return arrays and make them paginated
function paginateRoute(routePath) {
  const routeRegex = new RegExp("app\\.get\\('" + routePath.replace(/\//g, '\\/') + "'");
  let startLine = -1;
  for (let i = 0; i < lines.length; i++) {
    if (routeRegex.test(lines[i])) { startLine = i; break; }
  }
  if (startLine === -1) { console.log("NOT FOUND: " + routePath); return; }
  
  // Find the res.json() call in this route
  let endLine = startLine;
  let braceCount = 0;
  let foundResJson = -1;
  for (let i = startLine; i < Math.min(startLine + 30, lines.length); i++) {
    if (lines[i].includes('{')) braceCount += (lines[i].match(/{/g) || []).length;
    if (lines[i].includes('}')) braceCount -= (lines[i].match(/}/g) || []).length;
    if (lines[i].match(/res\.json\(/) && !lines[i].includes('500') && !lines[i].includes('message') && foundResJson === -1) {
      foundResJson = i;
    }
    if (braceCount <= 0 && i > startLine) { endLine = i; break; }
  }
  
  if (foundResJson === -1) { console.log("NO res.json found for " + routePath); return; }
  
  // Check if already paginated
  if (lines[foundResJson].includes('.data') || lines[foundResJson].includes('total')) {
    console.log("ALREADY PAGINATED: " + routePath);
    return;
  }
  
  // Replace res.json(array) with paginated version
  const oldLine = lines[foundResJson];
  // Extract the variable name: res.json(something) -> something
  const match = oldLine.match(/res\.json\((.+?)\);/);
  if (match) {
    const varName = match[1].trim();
    lines[foundResJson] = oldLine.replace(
      /res\.json\(.+?\);/,
      `{ const _all = ${varName}; const _p = parseInt(req.query.page) || 1; const _ps = parseInt(req.query.pageSize) || 50; res.json({ data: _all.slice((_p-1)*_ps, _p*_ps), total: _all.length, page: _p, pageSize: _ps }); }`
    );
    console.log("PAGINATED: " + routePath + " (line " + (foundResJson+1) + ")");
  } else {
    console.log("COULD NOT PARSE: " + routePath + " line: " + oldLine.trim());
  }
}

// Paginate routes that frontend expects as { data, total }
paginateRoute("/api/internal/centers");
paginateRoute("/api/internal/children");
paginateRoute("/api/internal/formations");

code = lines.join("\n");
fs.writeFileSync("/app/server.js", code);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("\nSYNTAX OK");
} catch (e) {
  const m = e.stderr.match(/server\.cjs:(\d+)/);
  if (m) console.log("ERROR at line " + m[1] + ": " + lines[parseInt(m[1])-1].trim());
  else console.log("ERROR: " + e.stderr.split("\n")[0]);
}
