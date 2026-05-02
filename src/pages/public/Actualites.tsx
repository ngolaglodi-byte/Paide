import { useState, useEffect } from 'react';
import { Calendar, User, Tag, RefreshCw, Search, Filter, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  published: boolean;
  image_url: string;
  created_at: string;
}

export default function Actualites() {
  const { getTitle, getText } = usePageContent('actualites');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Toutes');
  const [displayCount, setDisplayCount] = useState(6);

  const categories = ['Toutes', 'Centres', 'Formation', 'Partenariat', 'Événements'];

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(apiUrl('/api/public/news'));
      if (!response.ok) throw new Error('Erreur lors du chargement des actualités');
      
      const data = await response.json();
      setNews(data);
    } catch (error) {
      console.error('Erreur:', error);
      setError('Impossible de charger les actualités. Veuillez réessayer.');
      toast.error('Erreur lors du chargement des actualités');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredNews = news.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Toutes' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const displayedNews = filteredNews.slice(0, displayCount);
  const hasMoreNews = filteredNews.length > displayCount;

  const categoryStats = categories.slice(1).map(category => ({
    category,
    count: news.filter(n => n.category === category).length
  }));

  if (error && !isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <section className="hero-section">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Actualités PAIDE</h1>
            <p className="text-xl text-blue-100">Une erreur s'est produite</p>
          </div>
        </section>
        
        <section className="py-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="bg-red-50 border border-red-200 rounded-lg p-8">
              <h3 className="text-lg font-semibold text-red-800 mb-4">Erreur de chargement</h3>
              <p className="text-red-600 mb-6">{error}</p>
              <Button onClick={fetchNews} className="btn-primary-official">
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
            <Calendar className="w-16 h-16 text-secondary mx-auto mb-6" />
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
              {getTitle('hero', 'Actualités PAIDE')}
            </h1>
            <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
              {getText('hero', 'Suivez nos dernières activités, événements et réalisations. Restez informé de l\'évolution de nos programmes et de leur impact sur le terrain.')}
            </p>
            
            {!isLoading && news.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {categoryStats.map(({ category, count }) => (
                  <div key={category} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-secondary">{count}</div>
                    <div className="text-sm text-blue-200">{category}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Filtres et Recherche */}
      <section className="py-8 bg-gray-50 border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <Input
                  type="text"
                  placeholder="Rechercher des actualités..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Filter className="w-5 h-5 text-gray-500" />
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Catégorie" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category}
                      {category !== 'Toutes' && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({news.filter(n => n.category === category).length})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {(searchTerm || selectedCategory !== 'Toutes') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-600">
                {filteredNews.length} résultat{filteredNews.length > 1 ? 's' : ''} trouvé{filteredNews.length > 1 ? 's' : ''}
              </span>
              {searchTerm && (
                <Badge variant="secondary">
                  "{searchTerm}"
                </Badge>
              )}
              {selectedCategory !== 'Toutes' && (
                <Badge variant="secondary">
                  {selectedCategory}
                </Badge>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('Toutes');
                }}
              >
                Effacer les filtres
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Liste des Actualités */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="card-official">
                  <Skeleton className="h-48 w-full" />
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {filteredNews.length === 0 ? (
                <div className="text-center py-16">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    Aucune actualité trouvée
                  </h3>
                  <p className="text-gray-500">
                    {searchTerm || selectedCategory !== 'Toutes' 
                      ? 'Essayez de modifier vos critères de recherche.' 
                      : 'Aucune actualité n\'est actuellement disponible.'
                    }
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayedNews.map((item) => (
                      <Card key={item.id} className="card-official overflow-hidden group">
                        <div className="relative">
                          <img
                            src={item.image_url || `https://picsum.photos/seed/news${item.id}/400/250`}
                            alt={item.title}
                            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 left-4">
                            <Badge 
                              className={`badge-primary-official ${
                                item.category === 'Centres' ? 'bg-blue-100 text-blue-800' :
                                item.category === 'Formation' ? 'bg-green-100 text-green-800' :
                                item.category === 'Partenariat' ? 'bg-purple-100 text-purple-800' :
                                'bg-orange-100 text-orange-800'
                              }`}
                            >
                              <Tag className="w-3 h-3 mr-1" />
                              {item.category}
                            </Badge>
                          </div>
                        </div>
                        
                        <CardHeader>
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center text-sm text-gray-500">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(item.created_at).toLocaleDateString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                          
                          <CardTitle className="text-lg group-hover:text-primary transition-colors">
                            {item.title}
                          </CardTitle>
                          
                          <CardDescription>
                            {item.content.length > 150 
                              ? `${item.content.substring(0, 150)}...` 
                              : item.content
                            }
                          </CardDescription>
                        </CardHeader>
                        
                        <CardContent className="pt-0">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="w-4 h-4 mr-1" />
                              Par {item.author}
                            </div>
                            
                            <Button variant="ghost" size="sm" className="text-primary hover:text-primary-600">
                              Lire plus
                              <ArrowRight className="w-4 h-4 ml-1" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                  
                  {/* Bouton Voir Plus */}
                  {hasMoreNews && (
                    <div className="text-center mt-12">
                      <Button
                        onClick={() => setDisplayCount(prev => prev + 6)}
                        className="btn-primary-official text-lg px-8 py-3"
                      >
                        Voir plus d'actualités
                        <ArrowRight className="w-5 h-5 ml-2" />
                      </Button>
                      <p className="text-sm text-gray-500 mt-2">
                        {displayCount} sur {filteredNews.length} actualités affichées
                      </p>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </section>

      {/* Section Newsletter */}
      <section className="py-16 bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Calendar className="w-16 h-16 text-secondary mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">{getTitle('newsletter', 'Restez Informé')}</h2>
          <p className="text-xl text-blue-100 mb-8">
            {getText('newsletter', 'Ne manquez aucune de nos actualités. Recevez nos dernières nouvelles directement dans votre boîte email.')}
          </p>
          
          <div className="max-w-md mx-auto">
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="Votre adresse email"
                className="flex-1 bg-white/10 border-white/20 text-white placeholder-blue-200"
              />
              <Button className="btn-secondary-official px-6">
                S'abonner
              </Button>
            </div>
            <p className="text-sm text-blue-200 mt-3">
              Nous respectons votre vie privée et ne partageons jamais vos données.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}