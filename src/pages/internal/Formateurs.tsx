import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Edit, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

interface Formateur {
  id: number;
  name: string;
  specialite: string;
  center_id: number;
  center_name?: string;
  filiere: string;
  phone: string;
  status: string;
  created_at: string;
}

export default function Formateurs() {
  const { user } = useAuth();
  const [formateurs, setFormateurs] = useState<Formateur[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newFormateur, setNewFormateur] = useState({ name: '', specialite: '', filiere: '', center_id: '', phone: '' });

  useEffect(() => {
    fetchFormateurs();
  }, []);

  const fetchFormateurs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/formateurs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setFormateurs(await response.json());
      }
    } catch (error) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  const createFormateur = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/formateurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(newFormateur)
      });
      if (response.ok) {
        toast.success('Formateur ajouté');
        setNewFormateur({ name: '', specialite: '', filiere: '', center_id: '', phone: '' });
        setIsCreating(false);
        fetchFormateurs();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Erreur');
      }
    } catch { toast.error('Erreur de connexion'); }
  };

  const filtered = formateurs.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.filiere.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filieres = ['Coupe et Couture', 'Mécanique', 'Menuiserie', 'Informatique', 'Agriculture'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-dark">Formateurs</h1>
          <p className="text-gray-500">Gestion des formateurs et affectations</p>
        </div>
        <Dialog open={isCreating} onOpenChange={setIsCreating}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Ajouter</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Nouveau Formateur</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div><Label>Nom complet</Label><Input value={newFormateur.name} onChange={e => setNewFormateur(p => ({...p, name: e.target.value}))} /></div>
              <div><Label>Spécialité</Label><Input value={newFormateur.specialite} onChange={e => setNewFormateur(p => ({...p, specialite: e.target.value}))} /></div>
              <div>
                <Label>Filière</Label>
                <Select value={newFormateur.filiere} onValueChange={v => setNewFormateur(p => ({...p, filiere: v}))}>
                  <SelectTrigger><SelectValue placeholder="Choisir" /></SelectTrigger>
                  <SelectContent>
                    {filieres.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Téléphone</Label><Input value={newFormateur.phone} onChange={e => setNewFormateur(p => ({...p, phone: e.target.value}))} /></div>
              <Button onClick={createFormateur} className="w-full">Créer</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher un formateur..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center"><UserCheck className="w-5 h-5 mr-2" /> {filtered.length} Formateur(s)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-center py-8 text-gray-500">Chargement...</p> : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-gray-500">Aucun formateur</TableCell></TableRow>
                ) : filtered.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.name}</TableCell>
                    <TableCell><Badge variant="outline">{f.filiere}</Badge></TableCell>
                    <TableCell>{f.specialite}</TableCell>
                    <TableCell>{f.phone || '-'}</TableCell>
                    <TableCell><Badge className={f.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100'}>{f.status || 'actif'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
