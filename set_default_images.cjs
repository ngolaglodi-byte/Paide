const db = require("better-sqlite3")("/app/data/app.db");

const images = {
  // Home carousel
  'home|hero': 'https://picsum.photos/seed/paide1/1200/600',
  'home|slide2': 'https://picsum.photos/seed/paide2/1200/600',
  'home|slide3': 'https://picsum.photos/seed/paide3/1200/600',
  
  // Mission
  'mission|intro': 'https://picsum.photos/seed/mission/800/400',
  'mission|axe1': 'https://picsum.photos/seed/formation1/400/300',
  'mission|axe2': 'https://picsum.photos/seed/social1/400/300',
  'mission|axe3': 'https://picsum.photos/seed/insertion1/400/300',
  
  // Formations
  'formations|hero': 'https://picsum.photos/seed/formations/1200/400',
  'formations|img_informatique': 'https://picsum.photos/seed/informatique/400/250',
  'formations|img_couture': 'https://picsum.photos/seed/couture/400/250',
  'formations|img_menuiserie': 'https://picsum.photos/seed/menuiserie/400/250',
  'formations|img_agriculture': 'https://picsum.photos/seed/agriculture/400/250',
  'formations|img_mecanique': 'https://picsum.photos/seed/mecanique/400/250',
  'formations|img_jean': 'https://picsum.photos/seed/temoignage1/200/200',
  'formations|img_marie': 'https://picsum.photos/seed/temoignage2/200/200',
  'formations|img_grace': 'https://picsum.photos/seed/temoignage3/200/200',
  
  // Centres
  'centres|hero': 'https://picsum.photos/seed/centres/1200/400',
  
  // Public Cible
  'public-cible|hero': 'https://picsum.photos/seed/enfants/1200/400',
  
  // Partenaires
  'partenaires|hero': 'https://picsum.photos/seed/partenaires/1200/400',
  
  // Actualites
  'actualites|hero': 'https://picsum.photos/seed/actualites/1200/400',
  
  // Contact
  'contact|hero': 'https://picsum.photos/seed/contact/1200/400',
};

const stmt = db.prepare("UPDATE content SET image_url=? WHERE page=? AND section=?");
let count = 0;

Object.entries(images).forEach(([key, url]) => {
  const [page, section] = key.split('|');
  const r = stmt.run(url, page, section);
  if (r.changes > 0) count++;
});

console.log("Set " + count + " default images");

// Verify
const withImages = db.prepare("SELECT COUNT(*) as c FROM content WHERE image_url IS NOT NULL AND image_url != ''").get().c;
const total = db.prepare("SELECT COUNT(*) as c FROM content").get().c;
console.log(withImages + "/" + total + " sections have images");
