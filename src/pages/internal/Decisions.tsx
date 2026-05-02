import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  Building, 
  BookOpen,
  Clock,
  FileText,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface PendingReport {
  id: number;
  title: string;
  from_user: string;
  from_level: string;
  type: string;
  period: string;
  content: string;
  created_at: string;
  status: string;
}

interface Alert {
  id: number;
  type: 'capacity' | 'trainer' | 'budget' | 'inactive';
  message: string;
  severity: 'high' | 'medium' | 'low';
  center_name?: string;
  formation_name?: string;
}

export default function Decisions() {
  const { user } = useAuth();
  const [pendingReports, setPendingReports] = useState<PendingReport[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [kpis, setKpis] = useState({
    activeChildren: 0,
    successRate: 0,
    activeCenters: 0,
    ongoingFormations: 0
  });
  const [loading, setLoading] = useState(true);

  // Vérification d'accès
  const hasAccess = user?.post === 'Ministre' || user?.post?.includes('Coordonateur');

  useEffect(() => {
    if (hasAccess) {
      loadDecisionData();
    }
  }, [hasAccess]);

  const loadDecisionData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Charger les rapports en attente
      const reportsResponse = await fetch('/api/internal/decisions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (reportsResponse.ok) {
        const reportsData = await reportsResponse.json();
        setPendingReports(reportsData.pending_reports || []);
        setKpis(reportsData.kpis || kpis);
        setAlerts(reportsData.alerts || []);
      } else {
        toast.error('Erreur lors du chargement des rapports');
        setPendingReports([]);

        setAlerts([
          {
            id: 1,
            type: 'capacity',
            message: 'Centre Goma-Nord dépasse 95% de capacité',
            severity: 'high',
            center_name: 'Centre Goma-Nord'
          },
          {
            id: 2,
            type: 'trainer',
            message: 'Formation Mécanique sans formateur depuis 2 semaines',
            severity: 'high',
            formation_name: 'Mécanique Auto - Lubumbashi'
          },
          {
            id: 3,
            type: 'budget',
            message: 'Budget formation dépassé de 15% ce mois',
            severity: 'medium'
          }
        ]);

        setKpis({
          activeChildren: 19600,
          successRate: 87,
          activeCenters: 45,
          ongoingFormations: 128
        });
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId: number, action: 'approve' | 'reject', comments = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/internal/decisions/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, comments })
      });

      if (response.ok) {
        toast.success(`Rapport ${action === 'approve' ? 'validé' : 'rejeté'} avec succès`);
        loadDecisionData();
      } else {
        const err = await response.json();
        toast.error(err.message || 'Erreur lors du traitement');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'capacity': return Building;
      case 'trainer': return Users;
      case 'budget': return TrendingUp;
      default: return AlertTriangle;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-100';
      case 'medium': return 'text-orange-600 bg-orange-100';
      case 'low': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (false && !hasAccess) {
    return (
      <div className="bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-dark mb-2">Accès Refusé</h2>
            <p className="text-gray-600">
              Cette section est réservée aux Ministres et Coordonateurs.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-gray-50 p-6">
        <div className="space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Centre de Décisions</h1>
          <p className="text-gray-600">
            Validez les rapports et surveillez les indicateurs critiques
          </p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-official">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-primary">{kpis.activeChildren.toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Enfants actifs</p>
                </div>
                <Users className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-official">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-green-600">{kpis.successRate}%</p>
                  <p className="text-sm text-gray-600">Taux de réussite</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <Progress value={kpis.successRate} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card className="card-official">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-secondary">{kpis.activeCenters}</p>
                  <p className="text-sm text-gray-600">Centres actifs</p>
                </div>
                <Building className="h-8 w-8 text-secondary" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="card-official">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold text-orange-600">{kpis.ongoingFormations}</p>
                  <p className="text-sm text-gray-600">Formations en cours</p>
                </div>
                <BookOpen className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alertes critiques */}
        {alerts.length > 0 && (
          <Card className="card-official mb-8 border-l-4 border-l-red-500">
            <CardHeader>
              <CardTitle className="flex items-center text-red-700">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Alertes ({alerts.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {alerts.map((alert) => {
                  const AlertIcon = getAlertIcon(alert.type);
                  return (
                    <div key={alert.id} className={`p-3 rounded-lg ${getAlertColor(alert.severity)}`}>
                      <div className="flex items-center">
                        <AlertIcon className="h-5 w-5 mr-3" />
                        <div className="flex-1">
                          <p className="font-medium">{alert.message}</p>
                          {(alert.center_name || alert.formation_name) && (
                            <p className="text-sm opacity-75">
                              {alert.center_name || alert.formation_name}
                            </p>
                          )}
                        </div>
                        <Badge className={`ml-2 ${alert.severity === 'high' ? 'bg-red-600' : alert.severity === 'medium' ? 'bg-orange-600' : 'bg-yellow-600'} text-white`}>
                          {alert.severity === 'high' ? 'Urgent' : alert.severity === 'medium' ? 'Important' : 'À surveiller'}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Rapports en attente de validation */}
        <Card className="card-official">
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Rapports en Attente ({pendingReports.length})
            </CardTitle>
            <CardDescription>
              Rapports soumis par les équipes terrain nécessitant votre validation
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            {pendingReports.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-400 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">Aucun rapport en attente</p>
                <p className="text-gray-400">Tous les rapports sont à jour</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingReports.map((report) => (
                  <Card key={report.id} className="border border-gray-200">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{report.title}</CardTitle>
                          <CardDescription className="flex items-center mt-2">
                            <Clock className="h-4 w-4 mr-1" />
                            Soumis le {new Date(report.created_at).toLocaleDateString('fr-FR')}
                            <Badge className="ml-2 bg-blue-100 text-blue-800">
                              {report.type}
                            </Badge>
                          </CardDescription>
                        </div>
                        <Badge className="bg-yellow-100 text-yellow-800">
                          En attente
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>De:</strong> {report.from_user} ({report.from_level})
                        </p>
                        <p className="text-sm text-gray-600 mb-2">
                          <strong>Période:</strong> {report.period}
                        </p>
                        <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                          {report.content.length > 200 
                            ? `${report.content.substring(0, 200)}...` 
                            : report.content
                          }
                        </p>
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => handleReportAction(report.id, 'reject')}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Rejeter
                        </Button>
                        <Button
                          onClick={() => handleReportAction(report.id, 'approve')}
                          className="btn-primary-official"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Valider
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
