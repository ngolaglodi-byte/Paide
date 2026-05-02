import { useState, useEffect } from 'react';
import { MapPin, Users, Phone, Mail, Building, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { usePageContent } from '@/hooks/usePageContent';
import { apiUrl } from '@/lib/api';

interface Center {
  id: number;
  name: string;
  province: string;
  address: string;
  capacity: number;
  manager_id: number;
  status: string;
}

export default function Centres() {
  const { getTitle, getText } = usePageContent('centres');
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string>('Toutes');

  const provinces = ['Toutes', 'Kinshasa', 'Kasai', 'Nord-Kivu', 'Sud-Kivu', 'Haut-Katanga'];

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(apiUrl('/api/public/centers'));
      if (!response.ok) throw new Error('Erreur lors du chargement des centres');
      
      const data = await response.json();
      setCenters(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les centres. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des centres');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredCenters = selectedProvince === 'Toutes' 
    ? centers 
    : centers.filter(center => center.province === selectedProvince);

  const centersByProvince = provinces.slice(1).map(province => ({
    province,
    centers: centers.filter(c => c.province === province),
    count: centers.filter(c => c.province === province).length
  }));

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <section className="hero-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Nos Centres PAIDE</h1>
            <p className="text-xl text-blue-100">Une erreur s'est produite</p>
          </div>
        </section>
        
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Erreur de chargement</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={fetchCenters} className="btn-primary-official">
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
            <Building className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {getTitle('hero', 'Nos Centres PAIDE')}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              {getText('hero', 'Découvrez nos centres de formation répartis dans toute la République Démocratique du Congo, offrant des programmes de qualité pour le développement des enfants.')}
            </p>
            
            {!isLoading && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-4xl mx-auto">
                {centersByProvince.map(({ province, count }) => (
                  <div key={province} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary">{count}</div>
                    <div className="text-sm text-blue-200">{province}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filtres par Province */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-3">
            {provinces.map(province => (
              <Button
                key={province}
                onClick={() => setSelectedProvince(province)}
                variant={selectedProvince === province ? 'default' : 'outline'}
                className={selectedProvince === province ? 'btn-primary-official' : ''}
              >
                {province}
                {province !== 'Toutes' && (
                  <Badge variant="secondary" className="ml-2">
                    {centers.filter(c => c.province === province).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>
      </section>

      {/* Liste des Centres */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <>
              <div className="text-center mb-12">
                <Skeleton className="h-8 w-64 mx-auto mb-4" />
                <Skeleton className="h-4 w-96 mx-auto" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Card key={i} className="card-official">
                    <CardHeader>
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                        <Skeleton className="h-4 w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </>
          ) : (
            <>
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-dark mb-4">
                  {selectedProvince === 'Toutes' 
                    ? `${filteredCenters.length} Centres au Total` 
                    : `${filteredCenters.length} Centre${filteredCenters.length > 1 ? 's' : ''} en ${selectedProvince}`
                  }
                </h2>
                <p className="text-gray-600 text-lg">
                  {getText('intro', 'Des infrastructures modernes pour accueillir et former nos bénéficiaires')}
                </p>
              </div>

              {filteredCenters.length === 0 ? (
                <div className="text-center py-16">
                  <Building className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Aucun centre trouvé
                  </h3>
                  <p className="text-gray-500">
                    {selectedProvince === 'Toutes' 
                      ? 'Aucun centre n\'est actuellement disponible.' 
                      : `Aucun centre n'est disponible en ${selectedProvince}.`
                    }
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCenters.map((center) => (
                    <Card key={center.id} className="card-official h-full">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          <Badge className="badge-primary-official">{center.province}</Badge>
                          <Badge variant="secondary" className={`${
                            center.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {center.status === 'active' ? 'Actif' : 'Inactif'}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{center.name}</CardTitle>
                        <CardDescription>
                          Centre de formation professionnelle et d'accompagnement
                        </CardDescription>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        <div className="flex items-start space-x-3">
                          <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-dark">Adresse</p>
                            <p className="text-gray-600 text-sm">
                              {center.address || `${center.province}, RDC`}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-dark">Capacité d'accueil</p>
                            <p className="text-gray-600 text-sm">
                              Jusqu'à {center.capacity} bénéficiaires
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start space-x-3">
                          <Phone className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-medium text-dark">Contact</p>
                            <p className="text-gray-600 text-sm">
                              +243 81 234 56{center.id.toString().padStart(2, '0')}
                            </p>
                          </div>
                        </div>

                        <div className="pt-4 border-t">
                          <h4 className="font-medium text-dark mb-2">Formations disponibles</h4>
                          <div className="flex flex-wrap gap-1">
                            <Badge variant="outline" className="text-xs">Coupe & Couture</Badge>
                            <Badge variant="outline" className="text-xs">Mécanique</Badge>
                            <Badge variant="outline" className="text-xs">Informatique</Badge>
                            {center.capacity > 150 && (
                              <>
                                <Badge variant="outline" className="text-xs">Menuiserie</Badge>
                                <Badge variant="outline" className="text-xs">Agriculture</Badge>
                              </>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* Section Contact Global */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-dark mb-6">{getTitle('contact', "Besoin d'informations ?")}</h2>
          <p className="text-gray-600 text-lg mb-8">
            {getText('contact', 'Contactez-nous pour obtenir plus de détails sur nos centres et nos programmes de formation.')}
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <Card className="card-official">
              <CardHeader className="text-center">
                <Phone className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle>Par téléphone</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-semibold text-dark">+243 81 234 5678</p>
                <p className="text-gray-600">Du lundi au vendredi, 8h - 17h</p>
              </CardContent>
            </Card>
            
            <Card className="card-official">
              <CardHeader className="text-center">
                <Mail className="w-8 h-8 text-primary mx-auto mb-2" />
                <CardTitle>Par email</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-lg font-semibold text-dark">centres@paide.cd</p>
                <p className="text-gray-600">Réponse sous 24h</p>
              </CardContent>
            </Card>
          </div>
          
          <Button className="btn-primary-official text-lg px-8 py-3">
            <Mail className="w-5 h-5 mr-2" />
            Nous contacter
          </Button>
        </div>
      </section>
    </div>
  );
}