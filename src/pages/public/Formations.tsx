import { BookOpen, Clock, Users, Award, ChevronRight, CheckCircle } from 'lucide-react';
import { usePageContent } from '@/hooks/usePageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function Formations() {
  const { getTitle, getText, getImage } = usePageContent('formations');

  const formations = [
    {
      id: 1,
      title: 'Coupe et Couture',
      description: 'Formation complète en confection textile moderne, design de mode et entrepreneuriat dans le secteur textile.',
      duration: '12 mois',
      level: 'Débutant à Avancé',
      capacity: 25,
      modules: [
        'Techniques de coupe traditionnelle et moderne',
        'Couture à la main et à la machine',
        'Design et création de patrons',
        'Gestion d\'atelier de couture',
        'Marketing et vente de produits textiles'
      ],
      requirements: [
        'Savoir lire et écrire (niveau de base)',
        'Âge minimum 14 ans',
        'Motivation et engagement'
      ],
      opportunities: [
        'Création d\'atelier personnel',
        'Emploi dans industries textiles',
        'Création de coopératives',
        'Formation d\'autres jeunes'
      ],
      image: getImage('img_couture', 'https://picsum.photos/seed/couture/400/250')
    },
    {
      id: 2,
      title: 'Mécanique Automobile',
      description: 'Apprentissage de la réparation et maintenance de véhicules, moteurs et équipements mécaniques.',
      duration: '18 mois',
      level: 'Débutant à Professionnel',
      capacity: 20,
      modules: [
        'Diagnostic et réparation moteurs',
        'Systèmes électriques automobiles',
        'Maintenance préventive',
        'Utilisation d\'outils spécialisés',
        'Gestion d\'atelier mécanique'
      ],
      requirements: [
        'Niveau d\'études primaires',
        'Aptitudes physiques adaptées',
        'Intérêt pour la mécanique'
      ],
      opportunities: [
        'Ouverture de garage personnel',
        'Emploi dans concessionnaires',
        'Maintenance flottes d\'entreprises',
        'Formation technique avancée'
      ],
      image: getImage('img_mecanique', 'https://picsum.photos/seed/mecanique/400/250')
    },
    {
      id: 3,
      title: 'Menuiserie et Ébénisterie',
      description: 'Formation en travail du bois, fabrication de meubles et construction de structures en bois.',
      duration: '15 mois',
      level: 'Débutant à Artisan',
      capacity: 18,
      modules: [
        'Techniques de travail du bois',
        'Design et création de meubles',
        'Utilisation d\'outils manuels et électriques',
        'Finition et décoration',
        'Gestion d\'atelier de menuiserie'
      ],
      requirements: [
        'Niveau d\'études de base',
        'Créativité et sens artistique',
        'Capacité physique adaptée'
      ],
      opportunities: [
        'Atelier de menuiserie personnelle',
        'Emploi dans entreprises de construction',
        'Fabrication de meubles sur commande',
        'Enseignement professionnel'
      ],
      image: getImage('img_menuiserie', 'https://picsum.photos/seed/menuiserie/400/250')
    },
    {
      id: 4,
      title: 'Informatique et Bureautique',
      description: 'Initiation aux technologies de l\'information, bureautique et maintenance informatique de base.',
      duration: '10 mois',
      level: 'Débutant à Intermédiaire',
      capacity: 30,
      modules: [
        'Initiation à l\'informatique',
        'Bureautique (Word, Excel, PowerPoint)',
        'Internet et communication digitale',
        'Maintenance informatique de base',
        'Création de sites web simples'
      ],
      requirements: [
        'Savoir lire et écrire couramment',
        'Niveau d\'études secondaires préférable',
        'Motivation pour les nouvelles technologies'
      ],
      opportunities: [
        'Emploi dans bureaux et administrations',
        'Création de cybercafés',
        'Services de saisie et secrétariat',
        'Formation continue en informatique'
      ],
      image: getImage('img_informatique', 'https://picsum.photos/seed/informatique/400/250')
    },
    {
      id: 5,
      title: 'Agriculture et Élevage',
      description: 'Formation en techniques agricoles modernes, élevage et entrepreneuriat agro-pastoral.',
      duration: '20 mois',
      level: 'Débutant à Expert',
      capacity: 35,
      modules: [
        'Techniques agricoles modernes',
        'Élevage et santé animale',
        'Gestion des cultures et des terres',
        'Transformation des produits agricoles',
        'Marketing agricole et coopératives'
      ],
      requirements: [
        'Intérêt pour l\'agriculture',
        'Disponibilité pour travail pratique',
        'Engagement communautaire'
      ],
      opportunities: [
        'Création d\'exploitations agricoles',
        'Développement de coopératives',
        'Emploi dans agro-industries',
        'Conseil agricole aux communautés'
      ],
      image: getImage('img_agriculture', 'https://picsum.photos/seed/agriculture/400/250')
    }
  ];

  const processus = [
    {
      step: '1',
      title: 'Inscription',
      description: 'Dépôt de candidature dans le centre le plus proche'
    },
    {
      step: '2',
      title: 'Évaluation',
      description: 'Entretien et test d\'aptitude selon la filière choisie'
    },
    {
      step: '3',
      title: 'Formation',
      description: 'Cours théoriques et pratiques avec accompagnement personnalisé'
    },
    {
      step: '4',
      title: 'Certification',
      description: 'Obtention du certificat reconnu par l\'État'
    },
    {
      step: '5',
      title: 'Insertion',
      description: 'Accompagnement vers l\'emploi ou la création d\'activité'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <BookOpen className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {getTitle('hero', 'Nos Formations')}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-4xl mx-auto">
              {getText('hero', 'Découvrez nos programmes de formation professionnelle conçus pour donner aux enfants et jeunes congolais les compétences nécessaires pour construire leur avenir.')}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">5</div>
                <div className="text-blue-200">Filières disponibles</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">95%</div>
                <div className="text-blue-200">Taux de réussite</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">128</div>
                <div className="text-blue-200">Places disponibles</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catalogue des Formations */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('catalogue', 'Catalogue de Formations')}</h2>
            <p className="text-gray-600 text-lg">
              {getText('catalogue', 'Des programmes adaptés aux besoins du marché du travail congolais')}
            </p>
          </div>

          <div className="space-y-12">
            {formations.map((formation, index) => (
              <div key={formation.id} className={`flex flex-col lg:flex-row gap-8 items-start ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="lg:w-2/3">
                  <Card className="card-official h-full">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <CardTitle className="text-2xl mb-2">{formation.title}</CardTitle>
                          <CardDescription className="text-base">
                            {formation.description}
                          </CardDescription>
                        </div>
                        <Badge className="badge-primary-official">
                          Filière #{formation.id}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">Durée</p>
                            <p className="text-gray-600 text-sm">{formation.duration}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Award className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">Niveau</p>
                            <p className="text-gray-600 text-sm">{formation.level}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Users className="w-5 h-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm">Places</p>
                            <p className="text-gray-600 text-sm">{formation.capacity} par session</p>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-6">
                      <div>
                        <h4 className="font-semibold text-dark mb-3">Modules de formation :</h4>
                        <ul className="space-y-2">
                          {formation.modules.map((module, i) => (
                            <li key={i} className="flex items-start space-x-3">
                              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span className="text-gray-600 text-sm">{module}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-dark mb-3">Conditions d'accès :</h4>
                          <ul className="space-y-1">
                            {formation.requirements.map((req, i) => (
                              <li key={i} className="flex items-start space-x-2">
                                <span className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-gray-600 text-sm">{req}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-semibold text-dark mb-3">Débouchés :</h4>
                          <ul className="space-y-1">
                            {formation.opportunities.map((opp, i) => (
                              <li key={i} className="flex items-start space-x-2">
                                <span className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></span>
                                <span className="text-gray-600 text-sm">{opp}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Button className="btn-primary-official w-full md:w-auto">
                          S'inscrire à cette formation
                          <ChevronRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:w-1/3">
                  <img
                    src={formation.image}
                    alt={formation.title}
                    className="rounded-lg shadow-lg w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Processus d'Inscription */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('processus', "Processus d'Inscription")}</h2>
            <p className="text-gray-600 text-lg">
              {getText('processus', '5 étapes simples pour commencer votre parcours de formation')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {processus.map((step, index) => (
              <div key={index} className="text-center relative">
                {index < processus.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-300 z-0">
                    <div className="h-full bg-primary" style={{width: '80%'}}></div>
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                    {step.step}
                  </div>
                  <h3 className="font-semibold text-dark mb-2">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <Button className="btn-primary-official text-lg px-8 py-4">
              Commencer mon inscription
            </Button>
            <p className="text-gray-600 mt-4">
              Les inscriptions sont ouvertes toute l'année
            </p>
          </div>
        </div>
      </section>

      {/* Section Témoignages */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('temoignages', "Témoignages d'Anciens")}</h2>
            <p className="text-gray-600 text-lg">
              {getText('temoignages', 'Découvrez les parcours inspirants de nos diplômés')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Marie Kabongo',
                formation: 'Coupe et Couture',
                year: '2022',
                story: 'Grâce à la formation, j\'ai ouvert mon propre atelier et j\'emploie maintenant 5 personnes.',
                image: getImage('img_marie', 'https://picsum.photos/seed/marie/150/150')
              },
              {
                name: 'Jean Mukendi',
                formation: 'Mécanique Auto',
                year: '2021',
                story: 'Je travaille maintenant dans un grand garage de Kinshasa et je forme d\'autres jeunes.',
                image: getImage('img_jean', 'https://picsum.photos/seed/jean/150/150')
              },
              {
                name: 'Grace Ndala',
                formation: 'Informatique',
                year: '2023',
                story: 'J\'ai créé une entreprise de services informatiques qui aide les PME locales.',
                image: getImage('img_grace', 'https://picsum.photos/seed/grace/150/150')
              }
            ].map((testimonial, index) => (
              <Card key={index} className="card-official text-center">
                <CardHeader>
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-20 h-20 rounded-full mx-auto mb-4 object-cover"
                  />
                  <CardTitle className="text-lg">{testimonial.name}</CardTitle>
                  <CardDescription>
                    Diplômée {testimonial.formation} - Promotion {testimonial.year}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 italic">"{testimonial.story}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <BookOpen className="w-16 h-16 text-secondary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">{getTitle('cta', 'Prêt à Commencer ?')}</h2>
          <p className="text-xl text-blue-100 mb-8">
            {getText('cta', 'Rejoignez des milliers de jeunes qui ont transformé leur vie grâce à nos formations. Votre avenir commence aujourd\'hui !')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-secondary-official text-lg px-8 py-4">
              S'inscrire maintenant
            </Button>
            <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
              Visiter un centre
            </Button>
          </div>
          
          <p className="text-blue-200 mt-6">
            Formation gratuite • Accompagnement personnalisé • Certification reconnue
          </p>
        </div>
      </section>
    </div>
  );
}