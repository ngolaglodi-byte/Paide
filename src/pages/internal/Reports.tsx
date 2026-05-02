import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Send, CheckCircle, XCircle, Clock, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Report {
  id: number;
  title: string;
  content: string;
  type: string;
  from_user: string;
  to_level: string;
  status: string;
  comments: string;
  period: string;
  created_at: string;
}

export default function Reports() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [receivedReports, setReceivedReports] = useState<Report[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);

  const [newReport, setNewReport] = useState({
    title: '',
    content: '',
    type: 'mensuel',
    to_level: '',
    period: ''
  });

  const reportTypes = [
    { value: 'mensuel', label: 'Rapport mensuel' },
    { value: 'trimestriel', label: 'Rapport trimestriel' },
    { value: 'formation', label: 'Bilan formation' },
    { value: 'incident', label: 'Rapport d\'incident' },
    { value: 'mission', label: 'Rapport de mission' }
  ];

  const getLevels = () => {
    switch (user?.level) {
      case 'centre':
        return ['sous_provincial', 'provincial'];
      case 'sous_provincial':
        return ['provincial'];
      case 'provincial':
        return ['national'];
      case 'national':
        return ['ministere'];
      default:
        return ['national'];
    }
  };

  const canValidate = user?.level === 'national' || user?.level === 'ministere' || 
                      user?.post?.includes('Coordonateur') || user?.post === 'Ministre';

  useEffect(() => {
    fetchReports();
    if (canValidate) {
      fetchReceivedReports();
    }
  }, []);

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      } else {
        toast.error('Erreur lors du chargement des rapports');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  const fetchReceivedReports = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filtrer les rapports en attente destinés à mon niveau
        const received = data.filter((report: Report) => 
          report.to_level === user?.level && report.status === 'pending'
        );
        setReceivedReports(received);
      } else {
        toast.error('Erreur lors du chargement des rapports reçus');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReport.title || !newReport.content || !newReport.to_level) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newReport)
      });

      if (response.ok) {
        toast.success('Rapport soumis avec succès');
        setNewReport({
          title: '',
          content: '',
          type: 'mensuel',
          to_level: '',
          period: ''
        });
        setIsCreating(false);
        fetchReports();
      } else {
        toast.error('Erreur lors de la soumission');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const handleValidateReport = async (reportId: number, action: 'approve' | 'reject', comments = '') => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/internal/decisions/${reportId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ action, comments })
      });

      if (response.ok) {
        setReceivedReports(prev =>
          prev.map(report =>
            report.id === reportId
              ? { ...report, status: action === 'approve' ? 'approved' : 'rejected', comments }
              : report
          )
        );
        
        toast.success(`Rapport ${action === 'approve' ? 'validé' : 'rejeté'} avec succès`);
      } else {
        toast.error('Erreur lors de la validation');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la validation');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">En attente</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Validé</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Mes Rapports</h1>
          <p className="text-gray-600">Créez, soumettez et suivez vos rapports</p>
        </div>

        <Tabs defaultValue="mes-rapports" className="space-y-6">
          <TabsList>
            <TabsTrigger value="mes-rapports">Mes Rapports ({reports.length})</TabsTrigger>
            {canValidate && (
              <TabsTrigger value="validation">
                À Valider ({receivedReports.filter(r => r.status === 'pending').length})
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="mes-rapports">
            <Card className="card-official">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    Mes Rapports Soumis
                  </CardTitle>
                  
                  <Dialog open={isCreating} onOpenChange={setIsCreating}>
                    <DialogTrigger asChild>
                      <Button className="btn-primary-official">
                        <Plus className="h-4 w-4 mr-2" />
                        Nouveau rapport
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Créer un Rapport</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handleSubmitReport} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label>Type de rapport</Label>
                            <Select value={newReport.type} onValueChange={(value) => 
                              setNewReport(prev => ({...prev, type: value}))
                            }>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {reportTypes.map(type => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Destinataire</Label>
                            <Select value={newReport.to_level} onValueChange={(value) => 
                              setNewReport(prev => ({...prev, to_level: value}))
                            }>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner le niveau" />
                              </SelectTrigger>
                              <SelectContent>
                                {getLevels().map(level => (
                                  <SelectItem key={level} value={level}>
                                    {level.replace('_', ' ').charAt(0).toUpperCase() + level.slice(1)}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label>Titre du rapport</Label>
                          <Input 
                            value={newReport.title}
                            onChange={(e) => setNewReport(prev => ({...prev, title: e.target.value}))}
                            placeholder="Ex: Rapport mensuel Novembre 2024"
                          />
                        </div>

                        <div>
                          <Label>Période</Label>
                          <Input 
                            value={newReport.period}
                            onChange={(e) => setNewReport(prev => ({...prev, period: e.target.value}))}
                            placeholder="Ex: 2024-11 ou 2024-Q4"
                          />
                        </div>

                        <div>
                          <Label>Contenu du rapport</Label>
                          <Textarea 
                            value={newReport.content}
                            onChange={(e) => setNewReport(prev => ({...prev, content: e.target.value}))}
                            rows={8}
                            placeholder="Détaillez le contenu de votre rapport..."
                          />
                        </div>

                        <div className="flex justify-end space-x-2">
                          <Button type="button" variant="outline" onClick={() => setIsCreating(false)}>
                            Annuler
                          </Button>
                          <Button type="submit">
                            <Send className="h-4 w-4 mr-2" />
                            Soumettre
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="overflow-x-auto"><Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titre</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Destinataire</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Date soumission</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {reports.map((report) => (
                      <TableRow key={report.id}>
                        <TableCell className="font-medium">{report.title}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {reportTypes.find(t => t.value === report.type)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="capitalize">{report.to_level.replace('_', ' ')}</TableCell>
                        <TableCell>{report.period}</TableCell>
                        <TableCell className="text-sm text-gray-500">
                          {new Date(report.created_at).toLocaleDateString('fr-FR')}
                        </TableCell>
                        <TableCell>{getStatusBadge(report.status)}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            <Eye className="h-3 w-3 mr-1" />
                            Voir
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table></div>

                {reports.length === 0 && (
                  <div className="text-center py-8">
                    <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun rapport soumis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {canValidate && (
            <TabsContent value="validation">
              <Card className="card-official">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Rapports à Valider
                  </CardTitle>
                  <CardDescription>
                    Rapports soumis par votre équipe nécessitant votre validation
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    {receivedReports.map((report) => (
                      <Card key={report.id} className="border border-gray-200">
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">{report.title}</CardTitle>
                              <CardDescription className="flex items-center mt-2">
                                <Clock className="h-4 w-4 mr-1" />
                                Soumis le {new Date(report.created_at).toLocaleDateString('fr-FR')} par {report.from_user}
                              </CardDescription>
                            </div>
                            {getStatusBadge(report.status)}
                          </div>
                        </CardHeader>
                        
                        <CardContent>
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-2">
                              <strong>Type:</strong> {reportTypes.find(t => t.value === report.type)?.label}
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
                          
                          {report.status === 'pending' && (
                            <div className="flex justify-end space-x-3">
                              <Button
                                variant="outline"
                                onClick={() => handleValidateReport(report.id, 'reject')}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeter
                              </Button>
                              <Button
                                onClick={() => handleValidateReport(report.id, 'approve')}
                                className="btn-primary-official"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Valider
                              </Button>
                            </div>
                          )}

                          {report.comments && (
                            <div className="mt-4 p-3 bg-blue-50 rounded">
                              <p className="text-sm font-medium text-blue-800 mb-1">Commentaires:</p>
                              <p className="text-sm text-blue-700">{report.comments}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}

                    {receivedReports.length === 0 && (
                      <div className="text-center py-8">
                        <CheckCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucun rapport en attente de validation</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
}
