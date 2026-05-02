const fs = require("fs");
let code = fs.readFileSync("/app/server.js", "utf8");

const oldPut = `app.put('/api/superadmin/content/:id', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { page, section, title, content, image_url, order_index } = req.body;
    console.log(\`PUT /api/superadmin/content/\${id} appelé\`);

    const updateContent = db.prepare(\`
      UPDATE content
      SET page = ?, section = ?, title = ?, content = ?, image_url = ?, order_index = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    \`);

    const result = updateContent.run(page, section, title, content, image_url, order_index || 0, id);`;

const newPut = `app.put('/api/superadmin/content/:id', authenticateToken, requireSuperAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { page, section, title, content, image_url, order_index } = req.body;
    console.log(\`PUT /api/superadmin/content/\${id} appelé\`);

    // Only update fields that are provided (COALESCE keeps existing values)
    const updateContent = db.prepare(\`
      UPDATE content
      SET page = COALESCE(?, page),
          section = COALESCE(?, section),
          title = COALESCE(?, title),
          content = COALESCE(?, content),
          image_url = COALESCE(?, image_url),
          order_index = COALESCE(?, order_index),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    \`);

    const result = updateContent.run(
      page || null, section || null, title || null, content || null,
      image_url !== undefined ? image_url : null,
      order_index || null, id
    );`;

code = code.replace(oldPut, newPut);
fs.writeFileSync("/app/server.js", code);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("SYNTAX OK");
} catch (e) {
  const m = e.stderr.match(/server\.cjs:(\d+)/);
  if (m) console.log("ERROR line " + m[1]);
  else console.log("ERROR: " + e.stderr.split("\n")[0]);
}
