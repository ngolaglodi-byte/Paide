import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Users, Building, MapPin, Target, BookOpen, Heart, Shield, Briefcase, Sprout } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import Autoplay from 'embla-carousel-autoplay';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { usePageContent } from '@/hooks/usePageContent';
import { apiUrl } from '@/lib/api';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  author: string;
  category: string;
  image_url: string;
  created_at: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { getTitle, getText, getImage } = usePageContent('home');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch(apiUrl('/api/public/news'));
      if (!response.ok) throw new Error('Erreur lors du chargement des actualités');

      const data = await response.json();
      setNews(data.slice(0, 3));
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Impossible de charger les actualités');
    } finally {
      setIsLoading(false);
    }
  };

  const carouselImages = [
    {
      src: getImage('hero', 'https://picsum.photos/seed/paide1/1200/600'),
      title: 'Former pour transformer',
      subtitle: 'Le PAIDE accompagne les enfants congolais vers un avenir meilleur'
    },
    {
      src: getImage('slide2', 'https://picsum.photos/seed/paide2/1200/600'),
      title: 'Centres de formation',
      subtitle: 'Des infrastructures modernes dans toute la RDC'
    },
    {
      src: getImage('slide3', 'https://picsum.photos/seed/paide3/1200/600'),
      title: 'Partenariats internationaux',
      subtitle: 'En collaboration avec UNICEF, UNESCO et nos partenaires'
    }
  ];

  const stats = [
    { number: '19,600', label: 'Enfants pris en charge', icon: Users },
    { number: '45', label: 'Centres actifs', icon: Building },
    { number: '26', label: 'Provinces couvertes', icon: MapPin },
    { number: '95%', label: 'Taux de réussite', icon: Target }
  ];

  const axes = [
    {
      title: 'Compétences de base',
      description: 'Alphabétisation, calcul et compétences de vie courante',
      icon: BookOpen,
      color: 'bg-blue-500'
    },
    {
      title: 'Formation professionnelle',
      description: 'Apprentissage de métiers porteurs et rémunérateurs',
      icon: Briefcase,
      color: 'bg-green-500'
    },
    {
      title: 'Protection sociale',
      description: 'Accompagnement psychosocial et suivi médical',
      icon: Shield,
      color: 'bg-purple-500'
    },
    {
      title: 'Initiatives locales',
      description: 'Soutien aux projets communautaires et entrepreneuriat',
      icon: Sprout,
      color: 'bg-orange-500'
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section avec Carousel */}
      <section className="hero-section relative overflow-hidden">
        <div className="absolute inset-0 hero-overlay"></div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Contenu textuel */}
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start mb-6">
                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mr-4">
                  <span className="text-primary font-bold text-2xl">P</span>
                </div>
                <div>
                  <h1 className="text-white font-bold text-3xl">PAIDE</h1>
                  <p className="text-blue-200">Ministère Formation Professionnelle</p>
                </div>
              </div>

              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6">
                {getTitle('hero', 'Former pour')}
                <span className="text-secondary block">transformer</span>
              </h2>

              <p className="text-xl text-blue-100 mb-8 leading-relaxed">
                {getText('hero', "Le Programme d'Appui aux Initiatives de Développement de l'Enfant accompagne les enfants congolais vers un avenir meilleur à travers la formation, la protection et l'autonomisation.")}
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link to="/formations">
                  <Button className="btn-secondary-official text-lg px-8 py-4">
                    Nos Formations
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link to="/centres">
                  <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
                    Nos Centres
                  </Button>
                </Link>
              </div>
            </div>

            {/* Carousel — images modifiables par SuperAdmin */}
            <div className="carousel-paide">
              <Carousel className="w-full" plugins={[Autoplay({ delay: 4000, stopOnInteraction: false })]} opts={{ loop: true }}>
                <CarouselContent>
                  {carouselImages.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative">
                        <img
                          src={image.src}
                          alt={image.title}
                          className="w-full h-96 object-cover rounded-lg"
                        />
                        <div className="carousel-caption-custom">
                          <h3 className="text-white font-bold text-xl mb-2">{image.title}</h3>
                          <p className="text-blue-200">{image.subtitle}</p>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-4" />
                <CarouselNext className="right-4" />
              </Carousel>
            </div>
          </div>
        </div>
      </section>

      {/* Section Statistiques */}
      <section className="section-stats">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('stats', 'Notre Impact en Chiffres')}</h2>
            <p className="text-gray-600 text-lg">{getText('stats', "Des résultats concrets pour l'avenir des enfants congolais")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card animate-fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="flex items-center justify-center mb-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="stat-number">{stat.number}</div>
                <div className="stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Section 4 Axes Stratégiques */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">Nos 4 Axes Stratégiques</h2>
            <p className="text-gray-600 text-lg">Une approche holistique pour le développement de l'enfant</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {axes.map((axe, index) => (
              <Card key={index} className="card-official h-full">
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${axe.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <axe.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-lg">{axe.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {axe.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/mission">
              <Button className="btn-primary-official text-lg px-8 py-3">
                {getText('mission', 'En savoir plus sur notre mission')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section Actualités */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">Dernières Actualités</h2>
            <p className="text-gray-600 text-lg">Suivez nos activités et nos succès</p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="card-official">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {news.map((item) => (
                <Card key={item.id} className="card-official overflow-hidden">
                  <img
                    src={item.image_url || 'https://picsum.photos/seed/news/400/250'}
                    alt={item.title}
                    className="w-full h-48 object-cover"
                  />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="badge-primary-official">{item.category}</Badge>
                      <span className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>
                      {item.content.length > 100
                        ? `${item.content.substring(0, 100)}...`
                        : item.content
                      }
                    </CardDescription>
                  </CardHeader>
                  <div className="px-6 pb-6">
                    <p className="text-sm text-gray-500">Par {item.author}</p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          <div className="text-center mt-8">
            <Link to="/actualites">
              <Button className="btn-primary-official text-lg px-8 py-3">
                Voir toutes les actualités
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Section CTA Final */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Heart className="w-16 h-16 text-secondary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">Rejoignez-nous dans notre mission</h2>
          <p className="text-xl text-blue-100 mb-8">
            Ensemble, construisons un avenir meilleur pour les enfants de la République Démocratique du Congo
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button className="btn-secondary-official text-lg px-8 py-4">
                Nous contacter
              </Button>
            </Link>
            <Link to="/partenaires">
              <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
                Devenir partenaire
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
