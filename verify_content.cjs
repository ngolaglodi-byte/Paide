const fs = require("fs");
const db = require("better-sqlite3")("/app/data/app.db");

const pageMap = {
  'Home': 'home', 'Mission': 'mission', 'Formations': 'formations',
  'Centres': 'centres', 'PublicCible': 'public-cible', 'Partenaires': 'partenaires',
  'Actualites': 'actualites', 'Contact': 'contact'
};

Object.entries(pageMap).forEach(([tsx, dbPage]) => {
  const file = fs.readFileSync("/app/src/pages/public/" + tsx + ".tsx", "utf8");
  
  // Extract all section names from getText/getTitle/getImage calls
  const sections = new Set();
  const regex = /get(?:Text|Title|Image)\('([^']+)'/g;
  let m;
  while ((m = regex.exec(file)) !== null) {
    if (!m[1].includes('${')) sections.add(m[1]);
  }
  
  // Get DB sections
  const dbSections = new Set(
    db.prepare("SELECT section FROM content WHERE page=?").all(dbPage).map(r => r.section)
  );
  
  const missing = [...sections].filter(s => !dbSections.has(s));
  const extra = [...dbSections].filter(s => !sections.has(s));
  
  if (missing.length === 0) {
    console.log("OK " + tsx + " (" + sections.size + " sections)");
  } else {
    console.log("MISSING " + tsx + ": " + missing.join(", "));
  }
});
