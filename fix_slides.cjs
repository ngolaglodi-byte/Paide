const db = require("better-sqlite3")("/app/data/app.db");

// Add missing slide sections
const slides = [
  { section: 'slide2', title: 'Centres de formation', content: 'Des infrastructures modernes dans toute la RDC', order: 4 },
  { section: 'slide3', title: 'Partenariats internationaux', content: 'En collaboration avec UNICEF, UNESCO et nos partenaires', order: 5 },
];

slides.forEach(s => {
  const exists = db.prepare("SELECT id FROM content WHERE page='home' AND section=?").get(s.section);
  if (!exists) {
    db.prepare("INSERT INTO content (page, section, title, content, order_index) VALUES ('home',?,?,?,?)").run(s.section, s.title, s.content, s.order);
    console.log("Created: " + s.section);
  } else {
    console.log("Exists: " + s.section);
  }
});

// Show all home content
console.log("\nHome content:");
db.prepare("SELECT id, section, title, image_url FROM content WHERE page='home' ORDER BY order_index").all().forEach(i => {
  console.log("  " + i.section + " | " + i.title + " | img: " + (i.image_url || "none"));
});
