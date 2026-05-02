import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { FileBadge, Download, Zap, Users, Clock, Send, History } from 'lucide-react';
import { toast } from 'sonner';

const LEVEL_FR: Record<string, string> = {
  ministere: 'Ministère', national: 'National',
  provincial: 'Provincial', sous_provincial: 'Sous-Provincial', centre: 'Centre'
};

export default function HRMecanisation() {
  const { token } = useAuth();
  const [pending, setPending] = useState<any[]>([]);
  const [batches, setBatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [notes, setNotes] = useState('');
  const [generating, setGenerating] = useState(false);

  const reload = async () => {
    setLoading(true);
    const [p, b] = await Promise.all([
      fetch('/api/internal/hr/mecanisation/pending', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : []),
      fetch('/api/internal/hr/mecanisation/batches', { headers: { Authorization: 'Bearer ' + token } }).then(r => r.ok ? r.json() : [])
    ]);
    setPending(p);
    setBatches(b);
    setLoading(false);
  };

  useEffect(() => { reload(); }, []);

  const generate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/internal/hr/mecanisation/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token },
        body: JSON.stringify({ notes })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        // Téléchargement immédiat du CSV généré
        setTimeout(() => downloadCsv(data.id, data.batch_number), 300);
        setDialogOpen(false);
        setNotes('');
        reload();
      } else toast.error(data.message || 'Erreur');
    } catch { toast.error('Erreur réseau'); }
    setGenerating(false);
  };

  const downloadPdf = (batchId: number, batchNumber: string) => {
    fetch('/api/internal/hr/mecanisation/batches/' + batchId, {
      headers: { Authorization: 'Bearer ' + token }
    }).then(async r => {
      if (!r.ok) { toast.error('Erreur chargement'); return; }
      const batch = await r.json();
      const agents = batch.agents || [];
      const now = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      const lvl: Record<string,string> = { ministere:'Ministère', national:'National', provincial:'Provincial', sous_provincial:'Sous-Provincial', centre:'Centre' };

      let rows = '';
      agents.forEach((a: any, i: number) => {
        const addr = [a.address_street, a.address_commune, a.address_city].filter(Boolean).join(', ') || a.address || '';
        rows += '<tr><td>' + (i+1) + '</td><td>' + (a.matricule||'') + '</td><td><strong>' + (a.name||'') + '</strong></td><td>' + (a.postnom||'') + '</td><td>' + (a.prenom||'') + '</td><td>' + (a.post||'') + '</td><td>' + (lvl[a.level]||a.level||'') + '</td><td>' + (a.province||'') + '</td><td>' + (a.nationality||'Congolaise') + '</td><td style="font-size:9px">' + addr + '</td></tr>';
      });

      const html = '<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"><title>Bordereau - ' + batch.batch_number + '</title>' +
        '<style>' +
        '@page{size:A4 landscape;margin:15mm}' +
        'body{font-family:Segoe UI,system-ui,sans-serif;color:#1a1a2e;font-size:11px}' +
        '.hdr{display:flex;justify-content:space-between;border-bottom:3px solid #1a3a6b;padding-bottom:12px;margin-bottom:15px}' +
        '.hdr h1{color:#1a3a6b;font-size:20px;margin:0}.hdr p{color:#555;font-size:10px;margin:2px 0}' +
        '.hdr-r{text-align:right;font-size:10px;color:#666}.hdr-r .bn{font-size:14px;font-weight:bold;color:#1a3a6b}' +
        '.info{display:flex;gap:30px;background:#f5f7fa;padding:8px 12px;border-radius:4px;margin-bottom:12px;font-size:10px}' +
        '.info strong{color:#1a3a6b}' +
        'table{width:100%;border-collapse:collapse;margin-top:8px}' +
        'th{background:#1a3a6b;color:#fff;padding:6px 8px;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.5px}' +
        'td{padding:5px 8px;border-bottom:1px solid #ddd;font-size:10px}' +
        'tr:nth-child(even){background:#f9fafb}' +
        '.sigs{margin-top:40px;display:flex;justify-content:space-between}' +
        '.sig{text-align:center;min-width:200px}.sig .ln{border-top:1px solid #333;margin-top:50px;padding-top:4px;font-size:10px}.sig .ti{font-size:9px;color:#666;margin-top:2px}' +
        '.ft{margin-top:20px;border-top:2px solid #1a3a6b;padding-top:10px;display:flex;justify-content:space-between;font-size:9px;color:#666}' +
        '@media print{body{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}}' +
        '</style></head><body>' +
        '<div class="hdr"><div><h1>PAIDE — République Démocratique du Congo</h1><p>Programme d\'Appui aux Initiatives de Développement de l\'Enfant</p><p>Ministère des Affaires Sociales</p></div>' +
        '<div class="hdr-r"><div class="bn">' + batch.batch_number + '</div><p>BORDEREAU DE MÉCANISATION</p><p>Généré le ' + now + '</p><p>' + agents.length + ' agent(s)</p></div></div>' +
        '<div class="info"><div><strong>Objet:</strong> Transmission à la Fonction Publique pour mécanisation</div><div><strong>Date:</strong> ' + now + '</div><div><strong>Agents:</strong> ' + agents.length + '</div></div>' +
        '<table><thead><tr><th style="width:4%">N°</th><th style="width:10%">Matricule</th><th style="width:12%">Nom</th><th style="width:10%">Postnom</th><th style="width:10%">Prénom</th><th style="width:12%">Poste</th><th style="width:10%">Niveau</th><th style="width:10%">Province</th><th style="width:8%">Nationalité</th><th style="width:14%">Adresse</th></tr></thead><tbody>' +
        rows + '</tbody></table>' +
        '<div class="sigs"><div class="sig"><div class="ln">Le Secrétaire National</div><div class="ti">Coordination Nationale PAIDE</div></div><div class="sig"><div class="ln">Le Coordonateur National</div><div class="ti">Visa hiérarchique</div></div><div class="sig"><div class="ln">Le Directeur Général</div><div class="ti">Fonction Publique RDC</div></div></div>' +
        '<div class="ft"><div>PAIDE — Programme d\'Appui aux Initiatives de Développement de l\'Enfant</div><div>Document officiel — ' + batch.batch_number + ' — ' + now + '</div><div>Prestige Technologie Company</div></div>' +
        '</body></html>';

      const w = window.open('', '_blank');
      if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
    });
  };

    const downloadCsv = (batchId: number, batchNumber: string) => {
    fetch('/api/internal/hr/mecanisation/batches/' + batchId + '/export', {
      headers: { Authorization: 'Bearer ' + token }
    }).then(async r => {
      if (!r.ok) { toast.error('Erreur téléchargement'); return; }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = batchNumber + '.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success('Fichier téléchargé — à transmettre à la Fonction Publique');
    });
  };

  // Agrégation par niveau
  const byLevel: Record<string, number> = {};
  for (const a of pending) {
    const lvl = a.level || 'autre';
    byLevel[lvl] = (byLevel[lvl] || 0) + 1;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileBadge className="h-7 w-7 text-indigo-600" />Mécanisation
          </h1>
          <p className="text-sm text-gray-500">Transmission trimestrielle des nouveaux agents à la Fonction Publique</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-5">
            <Clock className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">En attente de mécanisation</div>
            <div className="text-3xl font-bold mt-1">{pending.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
          <CardContent className="p-5">
            <Send className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">Lots envoyés</div>
            <div className="text-3xl font-bold mt-1">{batches.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-indigo-500 to-indigo-600 text-white">
          <CardContent className="p-5">
            <Users className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">Agents mécanisés (total)</div>
            <div className="text-3xl font-bold mt-1">{batches.reduce((s, b) => s + (b.agent_count || 0), 0)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Action bar */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">Générer un nouveau lot</p>
            <p className="text-xs text-gray-500">Inclut tous les agents actifs non encore mécanisés ({pending.length} en attente)</p>
            {Object.keys(byLevel).length > 0 && (
              <div className="flex gap-2 mt-2 flex-wrap">
                {Object.entries(byLevel).map(([lvl, n]) => (
                  <Badge key={lvl} variant="outline" className="text-xs">{LEVEL_FR[lvl] || lvl}: {n}</Badge>
                ))}
              </div>
            )}
          </div>
          <Button onClick={() => setDialogOpen(true)} disabled={pending.length === 0}>
            <Zap className="h-4 w-4 mr-2" />Générer le lot
          </Button>
        </CardContent>
      </Card>

      {/* Agents en attente (prévisualisation) */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />Agents en attente ({pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? <div className="py-6 text-center text-gray-400">Chargement…</div> :
           pending.length === 0 ? <div className="py-10 text-center text-gray-400">Tous les agents actifs sont mécanisés</div> :
          <div className="max-h-[400px] overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom complet</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Province</TableHead>
                  <TableHead>Nationalité</TableHead>
                  <TableHead>Adresse</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map(a => {
                  const full = [a.name, a.postnom, a.prenom].filter(Boolean).join(' ');
                  const addr = [a.address_street, a.address_commune, a.address_city].filter(Boolean).join(', ') || a.address || '—';
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="font-mono text-xs">{a.matricule}</TableCell>
                      <TableCell className="font-medium">{full}</TableCell>
                      <TableCell className="text-sm">{a.post}</TableCell>
                      <TableCell><Badge variant="outline">{LEVEL_FR[a.level] || a.level}</Badge></TableCell>
                      <TableCell className="text-sm">{a.province || '—'}</TableCell>
                      <TableCell className="text-sm">{a.nationality}</TableCell>
                      <TableCell className="text-xs text-gray-600">{addr}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>}
        </CardContent>
      </Card>

      {/* Historique des lots */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-600" />Historique des envois
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° du lot</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Agents</TableHead>
                <TableHead>Généré par</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? <TableRow><TableCell colSpan={6} className="text-center py-6">Chargement…</TableCell></TableRow> :
               batches.length === 0 ? <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-400">Aucun lot envoyé</TableCell></TableRow> :
               batches.map(b => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs font-semibold">{b.batch_number}</TableCell>
                  <TableCell className="text-sm">{b.generated_at ? new Date(b.generated_at).toLocaleString('fr-FR') : '—'}</TableCell>
                  <TableCell className="text-right font-mono">{b.agent_count}</TableCell>
                  <TableCell className="text-sm">{b.generated_by_name || '—'}</TableCell>
                  <TableCell className="text-xs text-gray-600 max-w-[200px] truncate">{b.notes || '—'}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1">
                    <Button size="sm" variant="outline" onClick={() => downloadPdf(b.id, b.batch_number)}>
                      <Download className="h-3.5 w-3.5 mr-1" />PDF
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => downloadCsv(b.id, b.batch_number)}>
                      <Download className="h-3.5 w-3.5 mr-1" />CSV
                    </Button></div></TableCell></TableRow>
               ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog confirmation génération */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-amber-500" />Génération du lot de mécanisation</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm text-amber-900">
              <strong>{pending.length}</strong> agent(s) seront inclus dans ce lot. Ils seront marqués comme "envoyés" et n'apparaîtront plus dans les prochains lots.
            </div>
            <div>
              <label className="text-xs text-gray-600 mb-1 block">Notes (optionnel)</label>
              <Input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Ex: Trimestre 2 2026, envoi par courriel à M. le Directeur Général" />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded p-3 text-xs text-blue-700">
              Le fichier CSV sera téléchargé automatiquement après la génération. Transmettez-le à la Fonction Publique par le canal habituel.
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
            <Button onClick={generate} disabled={generating || pending.length === 0}>
              <Zap className="h-4 w-4 mr-2" />{generating ? 'Génération…' : 'Générer et télécharger'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
