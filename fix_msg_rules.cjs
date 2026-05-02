const fs = require("fs");
let server = fs.readFileSync("/app/server.js", "utf8");

// Replace the contacts route with proper hierarchy rules
const oldRoute = server.match(/\/\/ Contacts pour la messagerie[\s\S]*?app\.get\('\/api\/internal\/messages\/contacts'[\s\S]*?\}\);\s*\n/);
if (!oldRoute) { console.log("Route not found, searching..."); process.exit(1); }

const newRoute = `// Contacts pour la messagerie — règles hiérarchiques strictes
app.get('/api/internal/messages/contacts', authenticateToken, (req, res) => {
  try {
    const me = req.user;
    const levels = ['ministere', 'national', 'provincial', 'sous_provincial', 'centre'];
    const myIndex = levels.indexOf(me.level);
    
    // Postes de responsable à chaque niveau
    const responsablePosts = [
      'Ministre', 'Coordinateur National', 'Coordinateur Provincial',
      'Coordinateur Sous-Provincial', 'Chef de Centre', 'Super Administrateur'
    ];
    const isResponsable = responsablePosts.includes(me.post) || me.level === 'superadmin';
    
    const allUsers = db.prepare(
      "SELECT id, name, postnom, email, level, post, province, sous_province, center_id FROM users WHERE id != ? AND status = 'active' ORDER BY level, post, name"
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

`;

server = server.replace(oldRoute[0], newRoute);

fs.writeFileSync("/app/server.js", server);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("SYNTAX OK");
} catch (e) {
  const m = e.stderr.match(/server\.cjs:(\d+)/);
  if (m) {
    const lines = server.split('\n');
    console.log("ERROR line " + m[1] + ": " + lines[parseInt(m[1])-1]);
  } else {
    console.log("ERROR: " + e.stderr.split('\n')[0]);
  }
}
