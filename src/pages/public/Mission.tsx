import { Target, Heart, Users, BookOpen, Shield, Briefcase, Sprout, Award, Globe, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { usePageContent } from '@/hooks/usePageContent';

export default function Mission() {
  const { getTitle, getText, getImage } = usePageContent('mission');
  const axes = [
    {
      title: 'Compétences de base',
      description: 'Alphabétisation, calcul et compétences de vie courante pour donner aux enfants les outils fondamentaux nécessaires à leur développement personnel et professionnel.',
      icon: BookOpen,
      color: 'bg-blue-500',
      objectives: [
        'Alphabétisation en français et langues locales',
        'Initiation aux mathématiques appliquées',
        'Développement des compétences de communication',
        'Formation aux compétences de vie courante'
      ],
      progress: 85
    },
    {
      title: 'Formation professionnelle',
      description: 'Apprentissage de métiers porteurs et rémunérateurs adaptés au marché du travail congolais et aux besoins économiques locaux.',
      icon: Briefcase,
      color: 'bg-green-500',
      objectives: [
        'Coupe et couture moderne',
        'Mécanique automobile et générale',
        'Menuiserie et ébénisterie',
        'Informatique et nouvelles technologies',
        'Agriculture et élevage durables'
      ],
      progress: 78
    },
    {
      title: 'Protection sociale',
      description: 'Accompagnement psychosocial et suivi médical pour assurer le bien-être global des enfants pris en charge par le programme.',
      icon: Shield,
      color: 'bg-purple-500',
      objectives: [
        'Accompagnement psychosocial personnalisé',
        'Suivi médical et nutritionnel',
        'Prévention et sensibilisation santé',
        'Réinsertion familiale et sociale'
      ],
      progress: 92
    },
    {
      title: 'Appui aux initiatives locales',
      description: 'Soutien aux projets communautaires et entrepreneuriat pour stimuler le développement économique local et l\'autonomisation.',
      icon: Sprout,
      color: 'bg-orange-500',
      objectives: [
        'Soutien à l\'entrepreneuriat jeune',
        'Développement de projets communautaires',
        'Formation en gestion et leadership',
        'Création de coopératives locales'
      ],
      progress: 65
    }
  ];

  const values = [
    {
      title: 'Excellence',
      description: 'Nous visons l\'excellence dans tous nos programmes et services.',
      icon: Award
    },
    {
      title: 'Inclusion',
      description: 'Nous accueillons tous les enfants sans discrimination aucune.',
      icon: Users
    },
    {
      title: 'Durabilité',
      description: 'Nous construisons des solutions durables pour l\'avenir.',
      icon: Globe
    },
    {
      title: 'Innovation',
      description: 'Nous adoptons les meilleures pratiques et innovations.',
      icon: TrendingUp
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <Target className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {getTitle('intro', 'Notre Mission')}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-4xl mx-auto">
              {getText('intro', "Le PAIDE a pour mission d'accompagner les enfants congolais les plus vulnérables vers un avenir meilleur à travers des programmes holistiques de formation, de protection et d'autonomisation.")}
            </p>
          </div>
        </div>
      </section>

      {/* Vision et Objectifs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-dark mb-6">{getTitle('values', 'Notre Vision')}</h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {getText('values', "Une République Démocratique du Congo où chaque enfant, indépendamment de sa situation, a accès à une éducation de qualité, à une formation professionnelle adaptée et à un accompagnement social qui lui permet de devenir un citoyen épanoui et contributeur au développement de son pays.")}
              </p>
              
              <h3 className="text-xl font-semibold text-dark mb-4">Nos Objectifs Principaux</h3>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </div>
                  <span className="text-gray-600">
                    Offrir une seconde chance à 50,000 enfants d'ici 2030
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </div>
                  <span className="text-gray-600">
                    Établir 100 centres de formation dans toute la RDC
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </div>
                  <span className="text-gray-600">
                    Atteindre un taux d'insertion professionnelle de 95%
                  </span>
                </li>
                <li className="flex items-start space-x-3">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="w-2 h-2 bg-white rounded-full"></span>
                  </div>
                  <span className="text-gray-600">
                    Créer 10,000 emplois directs et indirects
                  </span>
                </li>
              </ul>
            </div>
            
            <div className="relative">
              <img
                src={getImage('intro', 'https://picsum.photos/seed/mission/600/400')}
                alt="Vision PAIDE"
                className="rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-primary/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </section>

      {/* 4 Axes Stratégiques Détaillés */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">Nos 4 Axes Stratégiques</h2>
            <p className="text-gray-600 text-lg">
              Une approche holistique et intégrée pour le développement de l'enfant
            </p>
          </div>
          
          <div className="space-y-12">
            {axes.map((axe, index) => (
              <div key={index} className={`flex flex-col lg:flex-row gap-8 items-center ${index % 2 === 1 ? 'lg:flex-row-reverse' : ''}`}>
                <div className="lg:w-1/2">
                  <Card className="card-official h-full">
                    <CardHeader>
                      <div className="flex items-center space-x-4 mb-4">
                        <div className={`w-16 h-16 ${axe.color} rounded-full flex items-center justify-center`}>
                          <axe.icon className="w-8 h-8 text-white" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl">{axe.title}</CardTitle>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-sm text-gray-500">Progression:</span>
                            <Progress value={axe.progress} className="w-24" />
                            <span className="text-sm font-medium text-primary">{axe.progress}%</span>
                          </div>
                        </div>
                      </div>
                      <CardDescription className="text-base leading-relaxed">
                        {axe.description}
                      </CardDescription>
                    </CardHeader>
                    
                    <CardContent>
                      <h4 className="font-semibold text-dark mb-3">Objectifs spécifiques :</h4>
                      <ul className="space-y-2">
                        {axe.objectives.map((objective, i) => (
                          <li key={i} className="flex items-start space-x-3">
                            <div className={`w-4 h-4 ${axe.color} rounded-full flex items-center justify-center flex-shrink-0 mt-1`}>
                              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                            </div>
                            <span className="text-gray-600 text-sm">{objective}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="lg:w-1/2">
                  <img
                    src={getImage(`axe${index + 1}`, `https://picsum.photos/seed/axe${index + 1}/500/350`)}
                    alt={axe.title}
                    className="rounded-lg shadow-lg w-full"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Valeurs */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">Nos Valeurs</h2>
            <p className="text-gray-600 text-lg">
              Les principes qui guident chacune de nos actions
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => (
              <Card key={index} className="card-official text-center h-full">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <value.icon className="w-8 h-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Impact Attendu */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <Heart className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">Impact Attendu d'ici 2030</h2>
            <p className="text-xl text-blue-100">
              Des résultats concrets pour transformer des vies et des communautés
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">50,000</div>
              <div className="text-blue-200">Enfants formés et autonomisés</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">100</div>
              <div className="text-blue-200">Centres opérationnels</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">26/26</div>
              <div className="text-blue-200">Provinces couvertes</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-secondary mb-2">95%</div>
              <div className="text-blue-200">Taux d'insertion réussie</div>
            </div>
          </div>
          
          <div className="text-center mt-12">
            <p className="text-lg text-blue-100">
              Ensemble, construisons un avenir où chaque enfant congolais 
              peut réaliser son plein potentiel et contribuer au développement de son pays.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}