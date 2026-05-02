import { useState, useEffect } from 'react';
import { ExternalLink, Globe, RefreshCw, Heart, HandHeart, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { usePageContent } from '@/hooks/usePageContent';
import { apiUrl } from '@/lib/api';

interface Partner {
  id: number;
  name: string;
  type: string;
  logo_url: string;
  description: string;
  website: string;
}

export default function Partenaires() {
  const { getTitle, getText } = usePageContent('partenaires');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(apiUrl('/api/public/partners'));
      if (!response.ok) throw new Error('Erreur lors du chargement des partenaires');
      
      const data = await response.json();
      setPartners(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les partenaires. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des partenaires');
    } finally {
      setIsLoading(false);
    }
  };

  const partnerTypes = [
    { type: 'International', count: partners.filter(p => p.type === 'International').length, color: 'bg-blue-500' },
    { type: 'National', count: partners.filter(p => p.type === 'National').length, color: 'bg-green-500' },
    { type: 'ONG', count: partners.filter(p => p.type === 'ONG').length, color: 'bg-purple-500' },
    { type: 'Privé', count: partners.filter(p => p.type === 'Privé').length, color: 'bg-orange-500' }
  ];

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <section className="hero-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Nos Partenaires</h1>
            <p className="text-xl text-blue-100">Une erreur s'est produite</p>
          </div>
        </section>
        
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Erreur de chargement</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={fetchPartners} className="btn-primary-official">
                <RefreshCw className="w-4 h-4 mr-2" />
                Réessayer
              </Button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <HandHeart className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {getTitle('hero', 'Nos Partenaires')}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              {getText('hero', 'Ensemble, nous construisons un avenir meilleur pour les enfants congolais. Découvrez les organisations qui nous accompagnent dans cette noble mission.')}
            </p>
            
            {!isLoading && partners.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {partnerTypes.map(({ type, count, color }) => (
                  <div key={type} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary">{count}</div>
                    <div className="text-sm text-blue-200">{type}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Section Partenaires */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <>
              <div className="text-center mb-12">
                <Skeleton className="h-8 w-64 mx-auto mb-4" />
                <Skeleton className="h-4 w-96 mx-auto" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="card-official">
                    <CardHeader className="text-center">
                      <Skeleton className="w-20 h-20 rounded-full mx-auto mb-4" />
                      <Skeleton className="h-6 w-3/4 mx-auto" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                    </CardHeader>
                    <CardContent>
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-dark mb-4">
                  {partners.length} Partenaire{partners.length > 1 ? 's' : ''} de Confiance
                </h2>
                <p className="text-gray-600 text-lg">
                  {getText('intro', 'Des collaborations stratégiques pour maximiser notre impact')}
                </p>
              </div>

              {partners.length === 0 ? (
                <div className="text-center py-16">
                  <HandHeart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Aucun partenaire trouvé
                  </h3>
                  <p className="text-gray-500">
                    Les informations sur nos partenaires seront bientôt disponibles.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {partners.map((partner) => (
                    <Card key={partner.id} className="card-official h-full group">
                      <CardHeader className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center overflow-hidden">
                          {partner.logo_url ? (
                            <img
                              src={partner.logo_url}
                              alt={`Logo ${partner.name}`}
                              className="w-full h-full object-contain"
                            />
                          ) : (
                            <Globe className="w-10 h-10 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex justify-between items-center mb-2">
                          <Badge 
                            className={`badge-primary-official ${
                              partner.type === 'International' ? 'bg-blue-100 text-blue-800' :
                              partner.type === 'National' ? 'bg-green-100 text-green-800' :
                              partner.type === 'ONG' ? 'bg-purple-100 text-purple-800' :
                              'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {partner.type}
                          </Badge>
                        </div>
                        
                        <CardTitle className="text-lg group-hover:text-primary transition-colors">
                          {partner.name}
                        </CardTitle>
                        <CardDescription>
                          Partenaire {partner.type.toLowerCase()}
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="flex-1 flex flex-col">
                        <p className="text-gray-600 text-sm leading-relaxed mb-4 flex-1">
                          {partner.description}
                        </p>
                        
                        {partner.website && (
                          <div className="mt-auto">
                            <a
                              href={partner.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-primary hover:text-primary-600 text-sm font-medium transition-colors"
                            >
                              <ExternalLink className="w-4 h-4 mr-1" />
                              Visiter le site web
                            </a>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Section Impact des Partenariats */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-dark mb-4">{getTitle('impact', "L'Impact de nos Partenariats")}</h2>
            <p className="text-gray-600 text-lg">
              {getText('impact', 'Grâce à nos partenaires, nous pouvons offrir des programmes plus complets et durables')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">15,847</h3>
              <p className="text-gray-600">Enfants soutenus grâce aux partenariats</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">26</h3>
              <p className="text-gray-600">Provinces couvertes ensemble</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">850M</h3>
              <p className="text-gray-600">Dollars mobilisés (USD)</p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <HandHeart className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-dark mb-2">12</h3>
              <p className="text-gray-600">Années de collaboration</p>
            </div>
          </div>
        </div>
      </section>

      {/* Section Devenir Partenaire */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <HandHeart className="w-16 h-16 text-secondary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">{getTitle('cta', 'Devenez Notre Partenaire')}</h2>
          <p className="text-xl text-blue-100 mb-8">
            {getText('cta', 'Rejoignez-nous dans notre mission pour transformer la vie des enfants congolais. Ensemble, nous pouvons faire la différence.')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Partenariat Financier</h3>
              <p className="text-blue-200 text-sm">
                Soutenez nos programmes avec un financement direct
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Partenariat Technique</h3>
              <p className="text-blue-200 text-sm">
                Partagez votre expertise et vos connaissances
              </p>
            </div>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
              <h3 className="font-semibold text-lg mb-2">Partenariat Matériel</h3>
              <p className="text-blue-200 text-sm">
                Contribuez avec des équipements et ressources
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="btn-secondary-official text-lg px-8 py-4">
              Nous contacter
            </Button>
            <Button variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-primary text-lg px-8 py-4">
              Télécharger notre brochure
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}