import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const moduleLabels: Record<string,string> = {
  personnel: 'Personnel', leave: 'Congés',
  training: 'Formation', evaluation: 'Évaluation',
  disciplinary: 'Disciplinaire'
};

export default function HRApprovals() {
  const { token } = useAuth();
  const [data, setData] = useState<any>({ pending: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState<any>(null);
  const [comment, setComment] = useState('');

  const load = async () => {
    const res = await fetch('/api/internal/hr/approvals', { headers: { Authorization: 'Bearer ' + token } });
    if (res.ok) { setData(await res.json()); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const decide = async (status: string) => {
    if (!decision) return;
    const res = await fetch('/api/internal/hr/approvals/' + decision.id, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
      body: JSON.stringify({ status, comment })
    });
    const d = await res.json();
    if (res.ok) { toast.success(d.message); setDecision(null); setComment(''); load(); }
    else toast.error(d.message);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-orange-500" />Approbations RH</h1>
        <p className="text-sm text-gray-500">Valider les demandes soumises par les Secrétaires</p>
      </div>

      <Card>
        <CardHeader><CardTitle>En attente ({data.pending.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Action</TableHead><TableHead>Demandeur</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={5} className="text-center">Chargement...</TableCell></TableRow> :
               data.pending.length === 0 ? <TableRow><TableCell colSpan={5} className="text-center text-gray-400">Aucune demande en attente</TableCell></TableRow> :
               data.pending.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell><Badge className="bg-blue-100 text-blue-800">{moduleLabels[a.module] || a.module}</Badge></TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell>{a.requester_name}</TableCell>
                  <TableCell>{new Date(a.created_at).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell><Button size="sm" onClick={() => setDecision(a)}>Traiter</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Historique ({data.history.length})</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Module</TableHead><TableHead>Demandeur</TableHead><TableHead>Statut</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
            <TableBody>
              {data.history.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center text-gray-400">Aucun historique</TableCell></TableRow> :
               data.history.map((a: any) => (
                <TableRow key={a.id}>
                  <TableCell><Badge className="bg-gray-100 text-gray-800">{moduleLabels[a.module] || a.module}</Badge></TableCell>
                  <TableCell>{a.requester_name}</TableCell>
                  <TableCell><Badge className={a.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>{a.status === 'approved' ? 'Approuvé' : 'Rejeté'}</Badge></TableCell>
                  <TableCell>{a.approved_date ? new Date(a.approved_date).toLocaleDateString('fr-FR') : '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={!!decision} onOpenChange={() => setDecision(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Traiter la demande</DialogTitle></DialogHeader>
          {decision && (
            <div className="space-y-3">
              <p><strong>Module :</strong> {moduleLabels[decision.module] || decision.module}</p>
              <p><strong>Action :</strong> {decision.action}</p>
              <p><strong>Demandeur :</strong> {decision.requester_name}</p>
              <p><strong>Détails :</strong></p>
              <pre className="text-xs bg-gray-50 p-2 rounded max-h-40 overflow-auto">{decision.payload}</pre>
              <textarea className="w-full p-2 border rounded" rows={3} placeholder="Commentaire (facultatif)" value={comment} onChange={e => setComment(e.target.value)} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => decide('rejected')} className="border-red-300 text-red-700"><X className="h-4 w-4 mr-2" />Rejeter</Button>
            <Button onClick={() => decide('approved')} className="bg-green-600"><Check className="h-4 w-4 mr-2" />Approuver</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
