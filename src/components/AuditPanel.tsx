import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Shield, AlertTriangle, CheckCircle, XCircle, UserPlus, Key, RefreshCw, Search } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  timestamp: string;
  action: string;
  details: Record<string, string>;
}

interface AuditData {
  logs: AuditLog[];
  files: string[];
  stats: {
    total: number;
    login_success: number;
    login_failed: number;
    login_blocked: number;
    user_created: number;
    password_reset: number;
  };
  date: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  LOGIN_SUCCESS: { label: 'Connexion réussie', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  LOGIN_FAILED: { label: 'Connexion échouée', color: 'bg-red-100 text-red-800', icon: XCircle },
  LOGIN_BLOCKED: { label: 'IP bloquée (brute force)', color: 'bg-red-200 text-red-900', icon: AlertTriangle },
  USER_CREATED: { label: 'Compte créé', color: 'bg-blue-100 text-blue-800', icon: UserPlus },
  PASSWORD_RESET: { label: 'Mot de passe réinitialisé', color: 'bg-yellow-100 text-yellow-800', icon: Key },
  DEVICE_BLOCKED: { label: 'Appareil bloqué', color: 'bg-orange-100 text-orange-800', icon: Shield },
};

export default function AuditPanel() {
  const [data, setData] = useState<AuditData | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  useEffect(() => { loadAudit(); }, [selectedDate, filterType]);

  const loadAudit = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (selectedDate) params.set('date', selectedDate);
      if (filterType !== 'all') params.set('type', filterType);
      const res = await fetch(`/api/admin/audit?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) setData(await res.json());
    } catch { toast.error('Erreur chargement audit'); }
    finally { setLoading(false); }
  };

  const filtered = data?.logs.filter(log => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      log.details.email?.toLowerCase().includes(s) ||
      log.details.ip?.toLowerCase().includes(s) ||
      log.details.targetEmail?.toLowerCase().includes(s) ||
      log.details.createdBy?.toLowerCase().includes(s)
    );
  }) || [];

  const formatTime = (ts: string) => {
    const d = new Date(ts);
    return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {data?.stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold">{data.stats.total}</p>
              <p className="text-xs text-gray-500">Total événements</p>
            </CardContent>
          </Card>
          <Card className="border-green-200">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-green-600">{data.stats.login_success}</p>
              <p className="text-xs text-gray-500">Connexions</p>
            </CardContent>
          </Card>
          <Card className="border-red-200">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-red-600">{data.stats.login_failed}</p>
              <p className="text-xs text-gray-500">Échecs</p>
            </CardContent>
          </Card>
          <Card className="border-red-300">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-red-700">{data.stats.login_blocked}</p>
              <p className="text-xs text-gray-500">Bloqués</p>
            </CardContent>
          </Card>
          <Card className="border-blue-200">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{data.stats.user_created}</p>
              <p className="text-xs text-gray-500">Comptes créés</p>
            </CardContent>
          </Card>
          <Card className="border-yellow-200">
            <CardContent className="pt-4 pb-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">{data.stats.password_reset}</p>
              <p className="text-xs text-gray-500">MDP réinitialisés</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input placeholder="Rechercher par email ou IP..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10" />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Type d'événement" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            <SelectItem value="LOGIN_SUCCESS">Connexions réussies</SelectItem>
            <SelectItem value="LOGIN_FAILED">Connexions échouées</SelectItem>
            <SelectItem value="LOGIN_BLOCKED">IP bloquées</SelectItem>
            <SelectItem value="USER_CREATED">Comptes créés</SelectItem>
            <SelectItem value="PASSWORD_RESET">MDP réinitialisés</SelectItem>
          </SelectContent>
        </Select>
        <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-[180px]" />
        <Button variant="outline" size="sm" onClick={loadAudit}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-base">
            <Shield className="h-5 w-5 mr-2" />
            Journal d'audit — {data?.date || 'Aujourd\'hui'} ({filtered.length} événements)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <p className="text-center py-8 text-gray-500">Chargement...</p> : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Heure</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>Détails</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-gray-500">Aucun événement</TableCell>
                    </TableRow>
                  ) : filtered.map((log, i) => {
                    const config = ACTION_CONFIG[log.action] || { label: log.action, color: 'bg-gray-100 text-gray-800', icon: Shield };
                    const Icon = config.icon;
                    return (
                      <TableRow key={i}>
                        <TableCell className="text-sm font-mono">{formatTime(log.timestamp)}</TableCell>
                        <TableCell>
                          <Badge className={config.color}>
                            <Icon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{log.details.email || log.details.targetEmail || '-'}</TableCell>
                        <TableCell className="text-sm font-mono">{log.details.ip || '-'}</TableCell>
                        <TableCell className="text-xs text-gray-500">
                          {log.details.level && <span>Niveau: {log.details.level} </span>}
                          {log.details.post && <span>Poste: {log.details.post} </span>}
                          {log.details.createdBy && <span>Par: {log.details.createdBy} </span>}
                          {log.details.resetBy && <span>Par: {log.details.resetBy} </span>}
                          {log.details.reason && <span className="text-red-600 font-medium">{log.details.reason}</span>}
                          {log.details.device && <span>Appareil: {log.details.device}</span>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
