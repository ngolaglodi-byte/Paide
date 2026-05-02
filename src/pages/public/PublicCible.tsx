import { Heart, Shield, Users, HomeIcon, BookOpen, Briefcase } from 'lucide-react';
import { usePageContent } from '@/hooks/usePageContent';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

export default function PublicCible() {
  const { getTitle, getText } = usePageContent('public-cible');

  const targetGroups = [
    {
      title: 'Enfants non scolarisés',
      description: 'Enfants âgés de 6 à 17 ans qui n\'ont jamais été à l\'école ou ont abandonné leurs études',
      icon: BookOpen,
      color: 'bg-blue-500',
      stats: {
        number: '8,500',
        percentage: 35,
        trend: '+12% cette année'
      },
      challenges: [
        'Manque d\'accès à l\'éducation formelle',
        'Travail des enfants',
        'Pauvreté familiale',
        'Distance des écoles'
      ],
      support: [
        'Alphabétisation et rattrapage scolaire',
        'Formation aux compétences de base',
        'Accompagnement psychosocial',
        'Sensibilisation des familles'
      ]
    },
    {
      title: 'Enfants de la rue',
      description: 'Enfants vivant ou travaillant dans la rue, sans protection familiale adéquate',
      icon: HomeIcon,
      color: 'bg-red-500',
      stats: {
        number: '3,200',
        percentage: 20,
        trend: '+5% cette année'
      },
      challenges: [
        'Absence de structure familiale',
        'Exposition aux dangers de la rue',
        'Consommation de substances',
        'Stigmatisation sociale'
      ],
      support: [
        'Hébergement et protection',
        'Réinsertion familiale',
        'Formation professionnelle accélérée',
        'Suivi psychosocial intensif'
      ]
    },
    {
      title: 'Victimes de violences',
      description: 'Enfants ayant subi des violences physiques, sexuelles ou psychologiques',
      icon: Shield,
      color: 'bg-purple-500',
      stats: {
        number: '2,800',
        percentage: 18,
        trend: 'Stable'
      },
      challenges: [
        'Traumatismes psychologiques',
        'Méfiance envers les adultes',
        'Difficultés d\'apprentissage',
        'Stigmatisation communautaire'
      ],
      support: [
        'Thérapie et accompagnement psychologique',
        'Environnement sécurisé',
        'Réhabilitation progressive',
        'Sensibilisation communautaire'
      ]
    },
    {
      title: 'Jeunes sans qualification',
      description: 'Adolescents et jeunes adultes (15-25 ans) sans formation professionnelle',
      icon: Briefcase,
      color: 'bg-green-500',
      stats: {
        number: '4,100',
        percentage: 27,
        trend: '+8% cette année'
      },
      challenges: [
        'Chômage et désœuvrement',
        'Manque de compétences techniques',
        'Absence d\'opportunités',
        'Délinquance juvénile'
      ],
      support: [
        'Formation professionnelle intensive',
        'Stage et insertion en entreprise',
        'Accompagnement entrepreneurial',
        'Suivi post-formation'
      ]
    }
  ];

  const filieresCibles = [
    {
      title: 'Filles vulnérables',
      description: 'Programme spécialisé pour l\'autonomisation des filles en situation difficile',
      participants: '2,400',
      focus: [
        'Formation en coupe et couture',
        'Éducation sexuelle et reproductive',
        'Leadership féminin',
        'Entrepreneuriat féminin'
      ]
    },
    {
      title: 'Enfants déplacés',
      description: 'Prise en charge des enfants déplacés par les conflits ou catastrophes naturelles',
      participants: '1,900',
      focus: [
        'Soutien psychosocial d\'urgence',
        'Éducation de rattrapage',
        'Réunification familiale',
        'Intégration communautaire'
      ]
    }
  ];

  const approche = [
    {
      phase: 'Identification',
      description: 'Recherche active et identification des enfants en situation difficile',
      duration: '1-2 semaines'
    },
    {
      phase: 'Évaluation',
      description: 'Évaluation des besoins individuels et orientation appropriée',
      duration: '1 semaine'
    },
    {
      phase: 'Prise en charge',
      description: 'Mise en œuvre du plan d\'accompagnement personnalisé',
      duration: '6-24 mois'
    },
    {
      phase: 'Suivi',
      description: 'Suivi post-formation et accompagnement à l\'insertion',
      duration: '12 mois'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Heart className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {getTitle('hero', 'Notre Public Cible')}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-4xl mx-auto">
              {getText('hero', 'Le PAIDE s\'engage auprès des enfants et jeunes congolais les plus vulnérables, leur offrant une seconde chance et les moyens de construire un avenir meilleur.')}
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-secondary">19,600</div>
                <div className="text-sm text-blue-200">Enfants accompagnés</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-secondary">4</div>
                <div className="text-sm text-blue-200">Catégories principales</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-secondary">85%</div>
                <div className="text-sm text-blue-200">Taux de réinsertion</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-secondary">26</div>
                <div className="text-sm text-blue-200">Provinces d'origine</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Catégories de Public Cible */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('beneficiaires', 'Nos Bénéficiaires')}</h2>
            <p className="text-gray-600 text-lg">
              {getText('beneficiaires', 'Quatre catégories principales d\'enfants et jeunes en situation difficile')}
            </p>
          </div>

          <div className="space-y-12">
            {targetGroups.map((targetItem, index) => (
              <Card key={index} className="card-official">
                <CardHeader>
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center space-x-4">
                      <div className={`w-16 h-16 ${targetItem.color} rounded-full flex items-center justify-center`}>
                        <targetItem.icon className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{targetItem.title}</CardTitle>
                        <CardDescription className="text-base mt-1">
                          {targetItem.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className="badge-primary-official">
                      {targetItem.stats.number} enfants
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{targetItem.stats.number}</div>
                      <div className="text-sm text-gray-600">Bénéficiaires actifs</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-2xl font-bold text-primary mb-1">{targetItem.stats.percentage}%</div>
                      <div className="text-sm text-gray-600">Du total des bénéficiaires</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 text-center">
                      <div className="text-sm font-medium text-green-600 mb-1">Évolution</div>
                      <div className="text-sm text-gray-600">{targetItem.stats.trend}</div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <h4 className="font-semibold text-dark mb-4 flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                        Défis rencontrés
                      </h4>
                      <ul className="space-y-2">
                        {targetItem.challenges.map((challenge, i) => (
                          <li key={i} className="flex items-start space-x-3">
                            <span className="w-1.5 h-1.5 bg-red-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-gray-600 text-sm">{challenge}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-dark mb-4 flex items-center">
                        <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                        Notre accompagnement
                      </h4>
                      <ul className="space-y-2">
                        {targetItem.support.map((support, i) => (
                          <li key={i} className="flex items-start space-x-3">
                            <span className="w-1.5 h-1.5 bg-green-400 rounded-full mt-2 flex-shrink-0"></span>
                            <span className="text-gray-600 text-sm">{support}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Taux de réussite pour cette catégorie</span>
                      <span className="text-sm font-medium text-primary">{85 + Math.floor(Math.random() * 10)}%</span>
                    </div>
                    <Progress value={85 + Math.floor(Math.random() * 10)} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Programmes Spécialisés */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('programmes', 'Programmes Spécialisés')}</h2>
            <p className="text-gray-600 text-lg">
              {getText('programmes', 'Des approches adaptées pour répondre aux besoins spécifiques')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filieresCibles.map((filiere, index) => (
              <Card key={index} className="card-official h-full">
                <CardHeader>
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-xl">{filiere.title}</CardTitle>
                    <Badge variant="secondary">{filiere.participants} participants</Badge>
                  </div>
                  <CardDescription className="text-base">
                    {filiere.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <h4 className="font-semibold text-dark mb-3">Axes d'intervention :</h4>
                  <ul className="space-y-2">
                    {filiere.focus.map((focus, i) => (
                      <li key={i} className="flex items-center space-x-3">
                        <Users className="w-4 h-4 text-primary flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{focus}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Approche d'Intervention */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('approche', "Notre Approche d'Intervention")}</h2>
            <p className="text-gray-600 text-lg">
              {getText('approche', 'Un processus en 4 phases pour garantir un accompagnement optimal')}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {approche.map((phase, index) => (
              <div key={index} className="text-center relative">
                {index < approche.length - 1 && (
                  <div className="hidden md:block absolute top-8 left-1/2 w-full h-0.5 bg-gray-300 z-0">
                    <div className="h-full bg-primary" style={{width: '80%'}}></div>
                  </div>
                )}
                
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4 text-white text-xl font-bold">
                    {index + 1}
                  </div>
                  <h3 className="font-semibold text-dark mb-2">{phase.phase}</h3>
                  <p className="text-gray-600 text-sm mb-2">{phase.description}</p>
                  <Badge variant="outline" className="text-xs">{phase.duration}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Critères d'Admission */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('criteres', "Critères d'Admission")}</h2>
            <p className="text-gray-600 text-lg">
              {getText('criteres', 'Conditions générales pour bénéficier de nos programmes')}
            </p>
          </div>
          
          <Card className="card-official">
            <CardHeader>
              <CardTitle className="text-center">Qui peut bénéficier du PAIDE ?</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h4 className="font-semibold text-dark mb-4 flex items-center text-green-600">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                    Critères d'inclusion
                  </h4>
                  <ul className="space-y-2">
                    {[
                      'Âge entre 6 et 25 ans',
                      'Situation de vulnérabilité avérée',
                      'Résidence en RDC',
                      'Motivation pour le changement',
                      'Consentement parental (si mineur)'
                    ].map((critere, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-600 text-sm">{critere}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-dark mb-4">
                    Processus d'admission
                  </h4>
                  <ul className="space-y-3">
                    {[
                      'Signalement par la communauté ou auto-présentation',
                      'Entretien d\'évaluation sociale',
                      'Examen médical de base',
                      'Élaboration du plan d\'accompagnement',
                      'Intégration dans le programme approprié'
                    ].map((etape, i) => (
                      <li key={i} className="flex items-start space-x-3">
                        <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-xs font-bold">{i + 1}</span>
                        </div>
                        <span className="text-gray-600 text-sm">{etape}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-16 h-16 text-secondary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">{getTitle('cta', 'Signaler un Enfant en Détresse')}</h2>
          <p className="text-xl text-blue-100 mb-8">
            {getText('cta', 'Vous connaissez un enfant qui pourrait bénéficier de nos programmes ? N\'hésitez pas à nous contacter. Ensemble, nous pouvons changer des vies.')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Ligne d'urgence</h3>
              <p className="text-blue-200 text-sm">
                +243 81 PAIDE (72433)
                Disponible 24h/24
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Email</h3>
              <p className="text-blue-200 text-sm">
                urgence@paide.cd
                Réponse sous 2h
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Centre le plus proche</h3>
              <p className="text-blue-200 text-sm">
                45 centres ouverts
                Accueil sans rendez-vous
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-secondary-official text-lg px-8 py-4">
              Signaler un cas
            </Button>
            <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
              Trouver un centre
            </Button>
          </div>
          
          <p className="text-blue-200 mt-6 text-sm">
            Toutes nos interventions respectent la confidentialité et la dignité de l'enfant
          </p>
        </div>
      </section>
    </div>
  );
}