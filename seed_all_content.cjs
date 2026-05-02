const db = require("better-sqlite3")("/app/data/app.db");

// Clear existing content
db.prepare("DELETE FROM content").run();

const items = [
  // ═══ HOME ═══
  { page:'home', section:'hero', title:'PAIDE — Pour un avenir meilleur', content:"Programme d'Appui aux Initiatives de Développement de l'Enfant en République Démocratique du Congo" },
  { page:'home', section:'mission', title:'Notre Mission', content:"Le PAIDE accompagne les enfants vulnérables à travers des formations professionnelles, un encadrement social et un suivi personnalisé." },
  { page:'home', section:'stats', title:'PAIDE en Chiffres', content:"Des milliers d'enfants accompagnés dans leurs parcours de formation et d'insertion professionnelle à travers la RDC." },
  { page:'home', section:'slide2', title:'Centres de formation', content:"Des infrastructures modernes dans toute la RDC" },
  { page:'home', section:'slide3', title:'Partenariats internationaux', content:"En collaboration avec UNICEF, UNESCO et nos partenaires" },

  // ═══ MISSION ═══
  { page:'mission', section:'intro', title:'Notre Vision', content:"Un Congo où chaque enfant vulnérable a accès à une formation de qualité et à un avenir prometteur." },
  { page:'mission', section:'values', title:'Nos Valeurs', content:"Dignité, Excellence, Solidarité, Transparence, Innovation — au service de l'enfance vulnérable." },
  { page:'mission', section:'axe1', title:'Formation professionnelle', content:"Offrir des formations adaptées au marché congolais dans des filières porteuses." },
  { page:'mission', section:'axe2', title:'Encadrement social', content:"Accompagner chaque enfant dans son parcours avec un suivi psychosocial personnalisé." },
  { page:'mission', section:'axe3', title:'Insertion professionnelle', content:"Faciliter l'accès à l'emploi et l'entrepreneuriat pour les diplôm��s." },

  // ��══ FORMATIONS ═══
  { page:'formations', section:'hero', title:'Nos Formations', content:"Le PAIDE offre des formations professionnelles adaptées aux réalités du marché congolais." },
  { page:'formations', section:'catalogue', title:'Catalogue de Formations', content:"Découvrez nos filières de formation professionnelle dispensées dans nos centres." },
  { page:'formations', section:'processus', title:"Processus d'Inscription", content:"1. Contact avec un centre PAIDE\n2. Évaluation du profil\n3. Inscription et orientation\n4. Début de la formation" },
  { page:'formations', section:'temoignages', title:'Témoignages', content:"Découvrez les parcours inspirants de nos anciens apprenants." },
  { page:'formations', section:'cta', title:'Rejoignez-nous', content:"Inscrivez-vous dans l'un de nos centres et commencez votre formation dès aujourd'hui." },
  { page:'formations', section:'img_informatique', title:'Informatique', content:"Formation en informatique, bureautique et développement web. Durée: 6-12 mois." },
  { page:'formations', section:'img_couture', title:'Couture & Mode', content:"Coupe, couture, stylisme, modélisme. Formation pratique avec machines professionnelles." },
  { page:'formations', section:'img_menuiserie', title:'Menuiserie', content:"Travail du bois, fabrication de meubles, ébénisterie. Ateliers équipés." },
  { page:'formations', section:'img_agriculture', title:'Agriculture', content:"Techniques agricoles modernes, maraîchage, élevage. Parcelles de pratique." },
  { page:'formations', section:'img_mecanique', title:'Mécanique', content:"Mécanique automobile et industrielle. Ateliers avec équipements modernes." },
  { page:'formations', section:'img_jean', title:'Jean — Diplômé Informatique', content:"Grâce au PAIDE, j'ai appris la programmation et je travaille maintenant comme développeur web." },
  { page:'formations', section:'img_marie', title:'Marie — Diplômée Couture', content:"Ma formation en couture m'a permis d'ouvrir mon propre atelier de mode." },
  { page:'formations', section:'img_grace', title:'Grace — Diplômée Agriculture', content:"Je gère aujourd'hui une coopérative agricole qui emploie 10 personnes." },

  // ═══ CENTRES ═══
  { page:'centres', section:'hero', title:'Nos Centres', content:"Le PAIDE dispose de centres d'accueil et de formation à travers les principales provinces de la RDC." },
  { page:'centres', section:'intro', title:'Réseau de Centres', content:"Nos centres offrent un cadre d'apprentissage moderne et sécurisé pour les enfants vulnérables." },
  { page:'centres', section:'contact', title:'Contacter un Centre', content:"Pour inscrire un enfant ou en savoir plus, contactez le centre le plus proche de chez vous." },

  // ═══ PUBLIC CIBLE ═══
  { page:'public-cible', section:'hero', title:'Public Cible', content:"Le PAIDE s'adresse aux enfants et jeunes vulnérables âgés de 10 à 18 ans." },
  { page:'public-cible', section:'beneficiaires', title:'Bénéficiaires', content:"Enfants en situation de rue, orphelins, enfants déscolarisés, enfants issus de familles pauvres." },
  { page:'public-cible', section:'criteres', title:"Critères d'Admission", content:"Être âgé de 10 à 18 ans, être en situation de vulnérabilité, résider dans une zone couverte par un centre PAIDE." },
  { page:'public-cible', section:'approche', title:'Notre Approche', content:"Un accompagnement global : formation professionnelle + suivi social + insertion économique." },
  { page:'public-cible', section:'programmes', title:'Nos Programmes', content:"Formations courtes (3 mois), formations longues (12 mois), programmes de réinsertion, suivi post-formation." },
  { page:'public-cible', section:'cta', title:'Comment Aider', content:"Devenez partenaire, bénévole ou donateur pour soutenir les enfants vulnérables du Congo." },

  // ���══ PARTENAIRES ═══
  { page:'partenaires', section:'hero', title:'Nos Partenaires', content:"Le PAIDE collabore avec des organisations nationales et internationales." },
  { page:'partenaires', section:'intro', title:'Partenariats Stratégiques', content:"Nos partenaires contribuent au financement, à l'expertise technique et au renforcement de nos capacités." },
  { page:'partenaires', section:'impact', title:'Impact Collectif', content:"Ensemble, nous avons formé des milliers d'enfants et ouvert des centres dans 5 provinces." },
  { page:'partenaires', section:'cta', title:'Devenir Partenaire', content:"Rejoignez notre réseau de partenaires et contribuez à l'avenir des enfants congolais." },

  // ═══ ACTUALITES ═══
  { page:'actualites', section:'hero', title:'Actualités', content:"Suivez les dernières nouvelles du programme PAIDE." },
  { page:'actualites', section:'newsletter', title:'Newsletter', content:"Abonnez-vous pour recevoir les actualités du PAIDE directement dans votre boîte mail." },

  // ═══ CONTACT ═══
  { page:'contact', section:'hero', title:'Nous Contacter', content:"N'hésitez pas à nous contacter pour toute question concernant le programme PAIDE." },
  { page:'contact', section:'coordonnees', title:'Coordonnées', content:"Ministère des Affaires Sociales — Programme PAIDE\nKinshasa, République Démocratique du Congo\nTél: +243 XX XXX XXXX" },
  { page:'contact', section:'formulaire', title:'Formulaire de Contact', content:"Remplissez le formulaire ci-dessous et nous vous répondrons dans les plus brefs délais." },
  { page:'contact', section:'bureaux', title:'Nos Bureaux', content:"Bureau National: Kinshasa, Avenue de la Libération\nBureaux Provinciaux: Lubumbashi, Goma, Kananga, Bukavu" },
  { page:'contact', section:'urgences', title:'Urgences', content:"Pour les situations urgentes concernant un enfant en danger, contactez notre ligne d'urgence: +243 XX XXX XXXX" },
];

const stmt = db.prepare("INSERT INTO content (page, section, title, content, order_index) VALUES (?,?,?,?,?)");
items.forEach((item, i) => {
  stmt.run(item.page, item.section, item.title, item.content, i + 1);
});

console.log("Created " + items.length + " content items\n");

// Count per page
const pages = db.prepare("SELECT page, COUNT(*) as c FROM content GROUP BY page ORDER BY page").all();
pages.forEach(p => console.log(p.page + ": " + p.c + " sections"));
