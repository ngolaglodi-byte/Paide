import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Monitor, Check, XCircle, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface Device {
  id: number;
  user_id: number;
  fingerprint: string;
  device_name: string;
  browser: string;
  os: string;
  authorized: number;
  last_used: string;
  created_at: string;
  user_name: string;
  user_email: string;
  user_post: string;
  user_level?: string;
}

export default function DevicesPanel() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/admin/devices', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setDevices(await res.json());
    } catch { toast.error('Erreur chargement appareils'); }
    finally { setLoading(false); }
  };

  const authorize = async (id: number) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/devices/${id}/authorize`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Appareil autorisé');
        loadDevices();
      }
    } catch { toast.error('Erreur'); }
  };

  const revoke = async (id: number) => {
    if (!confirm('Révoquer cet appareil ?')) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/admin/devices/${id}/revoke`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        toast.success('Appareil révoqué');
        loadDevices();
      }
    } catch { toast.error('Erreur'); }
  };

  const pending = devices.filter(d => d.authorized === 0);
  const authorized = devices.filter(d => d.authorized === 1);

  return (
    <div className="space-y-6">
      {/* Demandes en attente */}
      {pending.length > 0 && (
        <Card className="border-orange-300">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-700">
              <Shield className="h-5 w-5 mr-2" />
              Demandes d'accès en attente ({pending.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pending.map(d => (
                <div key={d.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <div>
                    <p className="font-medium">{d.user_name} <span className="text-gray-500">({d.user_email})</span></p>
                    <p className="text-sm text-gray-500">{d.user_post} — {d.device_name}</p>
                    <p className="text-xs text-gray-400">{d.browser} · {d.os} · {new Date(d.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => authorize(d.id)} className="bg-green-600 hover:bg-green-700">
                      <Check className="h-4 w-4 mr-1" /> Autoriser
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => revoke(d.id)}>
                      <XCircle className="h-4 w-4 mr-1" /> Refuser
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tous les appareils */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Appareils enregistrés ({devices.length})
            </CardTitle>
            <Button variant="outline" size="sm" onClick={loadDevices}>
              <RefreshCw className="h-4 w-4 mr-1" /> Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-center py-8 text-gray-500">Chargement...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Appareil</TableHead>
                    <TableHead>Navigateur</TableHead>
                    <TableHead>Dernière utilisation</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                        Aucun appareil enregistré
                      </TableCell>
                    </TableRow>
                  ) : devices.map(d => (
                    <TableRow key={d.id}>
                      <TableCell>
                        <p className="font-medium">{d.user_name}</p>
                        <p className="text-xs text-gray-500">{d.user_email}</p>
                      </TableCell>
                      <TableCell>{d.device_name}</TableCell>
                      <TableCell className="text-sm">{d.browser || '-'}</TableCell>
                      <TableCell className="text-sm">{d.last_used ? new Date(d.last_used).toLocaleDateString('fr-FR') : '-'}</TableCell>
                      <TableCell>
                        {d.authorized === 1 ? (
                          <Badge className="bg-green-100 text-green-800">Autorisé</Badge>
                        ) : (
                          <Badge className="bg-orange-100 text-orange-800">En attente</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {d.authorized === 0 ? (
                          <Button size="sm" onClick={() => authorize(d.id)} className="bg-green-600 hover:bg-green-700 mr-2">
                            <Check className="h-3 w-3" />
                          </Button>
                        ) : null}
                        <Button size="sm" variant="destructive" onClick={() => revoke(d.id)}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
