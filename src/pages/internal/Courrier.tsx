import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Plus, ArrowUp, ArrowDown, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Courrier() {
  const { user } = useAuth();
  const [courriers, setCourriers] = useState([]);
  const [isAddingCourrier, setIsAddingCourrier] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [newCourrier, setNewCourrier] = useState({
    type: 'entrant',
    sender_name: '',
    receiver_name: '',
    subject: ''
  });

  const hasAccess = user?.post === 'Secrétaire';

  useEffect(() => {
    if (hasAccess) {
      const fetchCourrier = async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch('/api/internal/courrier', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (response.ok) {
            setCourriers(await response.json());
          }
        } catch (error) {
          console.error('Erreur chargement courrier:', error);
        } finally {
          setIsLoading(false);
        }
      };
      fetchCourrier();
    }
  }, [hasAccess]);

  const addCourrier = async () => {
    if (!newCourrier.sender_name || !newCourrier.receiver_name || !newCourrier.subject) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const reference = `PAIDE/${newCourrier.type.toUpperCase()}/${new Date().getFullYear()}/${String(Date.now()).slice(-3)}`;
      const response = await fetch('/api/internal/courrier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ ...newCourrier, reference })
      });
      if (response.ok) {
        toast.success('Courrier enregistré');
        setIsAddingCourrier(false);
        setNewCourrier({ type: 'entrant', sender_name: '', receiver_name: '', subject: '' });
        // Refresh
        const res = await fetch('/api/internal/courrier', { headers: { 'Authorization': `Bearer ${token}` } });
        if (res.ok) setCourriers(await res.json());
      } else {
        const err = await response.json();
        toast.error(err.message || 'Erreur');
      }
    } catch { toast.error('Erreur de connexion'); }
  };

  if (false && !hasAccess) {
    return (
      <div className="bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-dark mb-2">Accès Refusé</h2>
            <p className="text-gray-600">Cette section est réservée aux Secrétaires.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-dark mb-8">Registre du Courrier</h1>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-official">
            <CardContent className="p-4 text-center">
              <ArrowDown className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{courriers.filter(c => c.type === 'entrant').length}</div>
              <div className="text-sm text-gray-600">Entrants</div>
            </CardContent>
          </Card>
          <Card className="card-official">
            <CardContent className="p-4 text-center">
              <ArrowUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{courriers.filter(c => c.type === 'sortant').length}</div>
              <div className="text-sm text-gray-600">Sortants</div>
            </CardContent>
          </Card>
          <Card className="card-official">
            <CardContent className="p-4 text-center">
              <Mail className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold">{courriers.filter(c => c.status === 'en_attente').length}</div>
              <div className="text-sm text-gray-600">En attente</div>
            </CardContent>
          </Card>
          <Card className="card-official">
            <CardContent className="p-4 text-center">
              <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">{courriers.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-official">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Registre du Courrier
              </CardTitle>
              
              <Dialog open={isAddingCourrier} onOpenChange={setIsAddingCourrier}>
                <DialogTrigger asChild>
                  <Button className="btn-primary-official">
                    <Plus className="h-4 w-4 mr-2" />
                    Nouveau courrier
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Enregistrer un Courrier</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Type</Label>
                      <select 
                        value={newCourrier.type}
                        onChange={(e) => setNewCourrier(prev => ({...prev, type: e.target.value}))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="entrant">📩 Entrant</option>
                        <option value="sortant">📤 Sortant</option>
                      </select>
                    </div>
                    <div>
                      <Label>Expéditeur</Label>
                      <Input 
                        value={newCourrier.sender_name}
                        onChange={(e) => setNewCourrier(prev => ({...prev, sender_name: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Destinataire</Label>
                      <Input 
                        value={newCourrier.receiver_name}
                        onChange={(e) => setNewCourrier(prev => ({...prev, receiver_name: e.target.value}))}
                      />
                    </div>
                    <div>
                      <Label>Objet</Label>
                      <Input 
                        value={newCourrier.subject}
                        onChange={(e) => setNewCourrier(prev => ({...prev, subject: e.target.value}))}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setIsAddingCourrier(false)}>Annuler</Button>
                      <Button onClick={addCourrier}>Enregistrer</Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Référence</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Expéditeur</TableHead>
                  <TableHead>Destinataire</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courriers.map((courrier) => (
                  <TableRow key={courrier.id}>
                    <TableCell className="font-mono text-sm">{courrier.reference}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {courrier.type === 'entrant' ? 
                          <ArrowDown className="h-4 w-4 text-blue-600 mr-1" /> :
                          <ArrowUp className="h-4 w-4 text-green-600 mr-1" />
                        }
                        <span className="capitalize">{courrier.type}</span>
                      </div>
                    </TableCell>
                    <TableCell>{courrier.sender_name}</TableCell>
                    <TableCell>{courrier.receiver_name}</TableCell>
                    <TableCell>{courrier.subject}</TableCell>
                    <TableCell>
                      <Badge className={courrier.status === 'en_attente' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                        {courrier.status === 'en_attente' ? 'En attente' : 'Traité'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
