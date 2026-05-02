import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface FormationStats {
  filiere: string;
  total_inscrits: number;
  total_formations: number;
  taux_reussite: number;
}

interface CentreStats {
  center_name: string;
  province: string;
  total_enfants: number;
  total_formations: number;
  capacite: number;
}

export default function Statistiques() {
  const { user } = useAuth();
  const [filiereStats, setFiliereStats] = useState<FormationStats[]>([]);
  const [centreStats, setCentreStats] = useState<CentreStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/statistiques', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setFiliereStats(data.filieres || []);
        setCentreStats(data.centres || []);
      }
    } catch (error) {
      toast.error('Erreur de chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  const totalInscrits = filiereStats.reduce((sum, f) => sum + f.total_inscrits, 0);
  const totalFormations = filiereStats.reduce((sum, f) => sum + f.total_formations, 0);
  const avgReussite = filiereStats.length > 0 ? Math.round(filiereStats.reduce((sum, f) => sum + f.taux_reussite, 0) / filiereStats.length) : 0;

  if (loading) return <div className="flex justify-center items-center h-64"><p className="text-gray-500">Chargement...</p></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dark">Statistiques des Formations</h1>
        <p className="text-gray-500">Taux de réussite par formation et par centre</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{totalInscrits}</p>
            <p className="text-sm text-gray-500">Inscrits total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BookOpen className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{totalFormations}</p>
            <p className="text-sm text-gray-500">Formations</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{avgReussite}%</p>
            <p className="text-sm text-gray-500">Taux de réussite moyen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <BarChart3 className="w-8 h-8 text-orange-500 mx-auto mb-2" />
            <p className="text-3xl font-bold">{centreStats.length}</p>
            <p className="text-sm text-gray-500">Centres actifs</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Par Filière</CardTitle>
        </CardHeader>
        <CardContent>
          {filiereStats.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-4">
              {filiereStats.map((f, i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{f.filiere}</p>
                    <p className="text-sm text-gray-500">{f.total_inscrits} inscrits · {f.total_formations} formations</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-3">
                      <div className="bg-blue-500 h-3 rounded-full" style={{ width: `${f.taux_reussite}%` }} />
                    </div>
                    <Badge className={f.taux_reussite >= 80 ? 'bg-green-100 text-green-800' : f.taux_reussite >= 60 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'}>
                      {f.taux_reussite}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Par Centre</CardTitle>
        </CardHeader>
        <CardContent>
          {centreStats.length === 0 ? (
            <p className="text-center py-8 text-gray-500">Aucune donnée disponible</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {centreStats.map((c, i) => (
                <div key={i} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <p className="font-medium">{c.center_name}</p>
                    <Badge variant="outline">{c.province}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div><p className="text-gray-500">Enfants</p><p className="font-bold">{c.total_enfants}</p></div>
                    <div><p className="text-gray-500">Formations</p><p className="font-bold">{c.total_formations}</p></div>
                    <div><p className="text-gray-500">Capacit��</p><p className="font-bold">{c.capacite}</p></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
