const db = require("better-sqlite3")("/app/data/app.db");

const content = [
  // HOME
  { page: 'home', section: 'hero', title: 'PAIDE', content: "Programme d'Appui aux Initiatives de Développement de l'Enfant en République Démocratique du Congo", order_index: 1 },
  { page: 'home', section: 'intro', title: 'Notre Mission', content: "Le PAIDE accompagne les enfants vulnérables à travers des formations professionnelles, un encadrement social et un suivi personnalisé dans nos centres à travers le pays.", order_index: 2 },
  { page: 'home', section: 'stats', title: 'PAIDE en Chiffres', content: "Des milliers d'enfants accompagnés dans leurs parcours de formation et d'insertion professionnelle.", order_index: 3 },
  
  // MISSION
  { page: 'mission', section: 'vision', title: 'Notre Vision', content: "Un Congo où chaque enfant vulnérable a accès à une formation de qualité et à un avenir prometteur.", order_index: 1 },
  { page: 'mission', section: 'objectifs', title: 'Nos Objectifs', content: "Former les enfants aux métiers porteurs (informatique, couture, menuiserie, agriculture), assurer leur suivi psychosocial et faciliter leur insertion professionnelle.", order_index: 2 },
  { page: 'mission', section: 'valeurs', title: 'Nos Valeurs', content: "Dignité, Excellence, Solidarité, Transparence, Innovation — au service de l'enfance vulnérable.", order_index: 3 },
  
  // FORMATIONS
  { page: 'formations', section: 'intro', title: 'Nos Formations', content: "Le PAIDE offre des formations professionnelles adaptées aux réalités du marché congolais.", order_index: 1 },
  { page: 'formations', section: 'informatique', title: 'Informatique', content: "Initiation à l'informatique, bureautique, maintenance, développement web. Durée: 6-12 mois.", order_index: 2 },
  { page: 'formations', section: 'couture', title: 'Couture & Mode', content: "Coupe, couture, stylisme, modélisme. Formation pratique avec machines professionnelles.", order_index: 3 },
  { page: 'formations', section: 'menuiserie', title: 'Menuiserie', content: "Travail du bois, fabrication de meubles, ébénisterie. Ateliers équipés.", order_index: 4 },
  { page: 'formations', section: 'agriculture', title: 'Agriculture', content: "Techniques agricoles modernes, maraîchage, élevage. Parcelles de pratique.", order_index: 5 },
  
  // CENTRES
  { page: 'centres', section: 'intro', title: 'Nos Centres', content: "Le PAIDE dispose de centres d'accueil et de formation à travers les principales provinces de la RDC.", order_index: 1 },
  
  // PUBLIC CIBLE
  { page: 'public-cible', section: 'intro', title: 'Public Cible', content: "Le PAIDE s'adresse aux enfants et jeunes vulnérables âgés de 10 à 18 ans.", order_index: 1 },
  { page: 'public-cible', section: 'criteres', title: "Critères d'Admission", content: "Enfants en situation de rue, orphelins, enfants déscolarisés, enfants issus de familles extrêmement pauvres, enfants victimes de conflits armés.", order_index: 2 },
  
  // PARTENAIRES
  { page: 'partenaires', section: 'intro', title: 'Nos Partenaires', content: "Le PAIDE collabore avec des organisations nationales et internationales pour maximiser son impact.", order_index: 1 },
  
  // ACTUALITES
  { page: 'actualites', section: 'intro', title: 'Actualités', content: "Suivez les dernières nouvelles du programme PAIDE.", order_index: 1 },
  
  // CONTACT
  { page: 'contact', section: 'info', title: 'Nous Contacter', content: "Ministère des Affaires Sociales — Programme PAIDE\nKinshasa, République Démocratique du Congo", order_index: 1 },
  { page: 'contact', section: 'horaires', title: 'Horaires', content: "Lundi - Vendredi : 8h00 - 16h00\nSamedi : 8h00 - 12h00", order_index: 2 },
];

const stmt = db.prepare('INSERT INTO content (page, section, title, content, order_index) VALUES (?, ?, ?, ?, ?)');
content.forEach(c => {
  stmt.run(c.page, c.section, c.title, c.content, c.order_index);
});

console.log("Created " + content.length + " content items");

// Also seed some news
db.prepare("INSERT INTO news (title, content, image_url) VALUES (?, ?, ?)").run(
  "Lancement du programme PAIDE",
  "Le Ministère des Affaires Sociales lance officiellement le Programme d'Appui aux Initiatives de Développement de l'Enfant.",
  null
);
console.log("Created 1 news");

// Seed partners
const partners = [
  ["UNICEF", "Fonds des Nations Unies pour l'Enfance"],
  ["Ministère des Affaires Sociales", "République Démocratique du Congo"],
  ["Banque Mondiale", "Appui au développement"],
];
const pStmt = db.prepare("INSERT INTO partners (name, description) VALUES (?, ?)");
partners.forEach(p => pStmt.run(p[0], p[1]));
console.log("Created " + partners.length + " partners");

// Verify
console.log("\nFinal counts:");
console.log("content: " + db.prepare("SELECT COUNT(*) as c FROM content").get().c);
console.log("news: " + db.prepare("SELECT COUNT(*) as c FROM news").get().c);
console.log("partners: " + db.prepare("SELECT COUNT(*) as c FROM partners").get().c);
