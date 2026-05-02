'use client';

import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Trash2, UserPlus, RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface User {
  id: string;
  nom: string;
  postnom: string;
  prenom?: string;
  email: string;
  poste: string;
  niveau: string;
  province?: string;
  sous_province?: string;
  centre?: string;
  statut?: string;
}

interface CreatedUser extends User {
  password: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

// Bootstrap SuperAdmin: créer le Responsable N°1 + le Secrétaire de chaque niveau
// Les autres postes sont créés ensuite par les Secrétaires via la page "Personnel"
const POSTES_PAR_NIVEAU: Record<string, string[]> = {
  ministere: ['Ministre', 'Secrétaire'],
  national: ['Coordonateur', 'Secrétaire'],
  provincial: ['Coordonateur', 'Secrétaire'],
  sous_provincial: ['Coordonateur', 'Secrétaire'],
  centre: ['Chef de Centre', 'Secrétaire'],
};

const NIVEAUX = [
  { value: 'ministere', label: 'Ministère' },
  { value: 'national', label: 'National' },
  { value: 'provincial', label: 'Provincial' },
  { value: 'sous_provincial', label: 'Sous-Provincial' },
  { value: 'centre', label: 'Centre' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getPosteOptions(niveau: string): string[] {
  return POSTES_PAR_NIVEAU[niveau] || [];
}

function statutBadge(statut?: string) {
  if (statut === 'actif') {
    return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Actif</Badge>;
  }
  if (statut === 'inactif') {
    return <Badge variant="secondary">Inactif</Badge>;
  }
  return <Badge variant="outline">{statut ?? '—'}</Badge>;
}

function downloadCredentials(user: CreatedUser) {
  const lines = [
    '=== PAIDE — Identifiants Utilisateur ===',
    '',
    `Nom       : ${user.nom}`,
    `Postnom   : ${user.postnom}`,
    `Prénom    : ${user.prenom ?? '—'}`,
    `Poste     : ${user.poste}`,
    `Niveau    : ${user.niveau}`,
    '',
    `Email     : ${user.email}`,
    `Mot de passe : ${user.password}`,
    '',
    'Ce mot de passe devra être changé lors de la première connexion.',
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `identifiants-${user.nom}-${user.postnom}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Users() {
  const { user: currentUser, token } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Create dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form state
  const [form, setForm] = useState({
    nom: '',
    postnom: '',
    prenom: '',
    poste: '',
    niveau: '',
    province: '',
    sous_province: '',
    centre: '',
  });

  // Post-creation credentials card
  const [createdUser, setCreatedUser] = useState<CreatedUser | null>(null);

  // Deleting
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.level === 'superadmin';

  // -----------------------------------------------------------------------
  // Fetch users
  // -----------------------------------------------------------------------

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/internal/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
      const data = await res.json();
      setUsers(Array.isArray(data) ? data : data.users ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // -----------------------------------------------------------------------
  // Filtered list
  // -----------------------------------------------------------------------

  const filteredUsers = useMemo(() => {
    if (!searchQuery.trim()) return users;
    const q = searchQuery.toLowerCase();
    return users.filter(
      (u) =>
        u.nom?.toLowerCase().includes(q) ||
        u.postnom?.toLowerCase().includes(q) ||
        u.prenom?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [users, searchQuery]);

  // -----------------------------------------------------------------------
  // Create user
  // -----------------------------------------------------------------------

  const resetForm = () =>
    setForm({ nom: '', postnom: '', prenom: '', poste: '', niveau: '', province: '', sous_province: '', centre: '' });

  const handleCreate = async () => {
    if (!form.nom.trim() || !form.postnom.trim() || !form.poste) {
      toast.error('Veuillez remplir tous les champs obligatoires (Nom, Postnom, Poste)');
      return;
    }

    try {
      setCreating(true);
      const body: Record<string, string> = {
        nom: form.nom.trim(),
        postnom: form.postnom.trim(),
        prenom: form.prenom.trim(),
        poste: form.poste,
      };

      if (isSuperAdmin) {
        if (form.niveau) body.niveau = form.niveau;
        if (form.province) body.province = form.province;
        if (form.sous_province) body.sous_province = form.sous_province;
        if (form.centre) body.centre = form.centre;
      }

      const res = await fetch('/api/internal/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.message ?? 'Erreur lors de la création du compte');
      }

      const data: CreatedUser = await res.json();
      toast.success('Compte créé avec succès');
      setCreatedUser(data);
      setDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  // -----------------------------------------------------------------------
  // Delete user
  // -----------------------------------------------------------------------

  const handleResetPassword = async (id: string, userName: string) => {
    if (!confirm(`Réinitialiser le mot de passe de ${userName} ?`)) return;
    try {
      const res = await fetch(`/api/internal/users/${id}/reset-password`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Mot de passe réinitialisé');
        setCreatedUser(data); // Show printable sheet with new password
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch { toast.error('Erreur de connexion'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) return;

    try {
      setDeletingId(id);
      const res = await fetch(`/api/internal/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Erreur lors de la suppression');
      toast.success('Utilisateur supprimé');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erreur inconnue';
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  // -----------------------------------------------------------------------
  // Poste options based on current user or selected niveau
  // -----------------------------------------------------------------------

  const effectiveNiveau = isSuperAdmin ? form.niveau : (currentUser?.level ?? '');
  const posteOptions = getPosteOptions(effectiveNiveau);

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="space-y-6">
      {/* ---- Header ---- */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} utilisateur{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Créer un compte
            </Button>
          </DialogTrigger>

          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Nouveau compte utilisateur
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-5 pt-2">
              {/* Name row */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={form.nom}
                    onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))}
                    placeholder="Nom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postnom">Postnom *</Label>
                  <Input
                    id="postnom"
                    value={form.postnom}
                    onChange={(e) => setForm((f) => ({ ...f, postnom: e.target.value }))}
                    placeholder="Postnom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input
                    id="prenom"
                    value={form.prenom}
                    onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))}
                    placeholder="Prénom"
                  />
                </div>
              </div>

              {/* SuperAdmin: niveau selector */}
              {isSuperAdmin && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Niveau</Label>
                    <Select
                      value={form.niveau}
                      onValueChange={(v) => setForm((f) => ({ ...f, niveau: v, poste: '' }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner un niveau" />
                      </SelectTrigger>
                      <SelectContent>
                        {NIVEAUX.map((n) => (
                          <SelectItem key={n.value} value={n.value}>
                            {n.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Province</Label>
                    <Input
                      value={form.province}
                      onChange={(e) => setForm((f) => ({ ...f, province: e.target.value }))}
                      placeholder="Province"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Sous-Province</Label>
                    <Input
                      value={form.sous_province}
                      onChange={(e) => setForm((f) => ({ ...f, sous_province: e.target.value }))}
                      placeholder="Sous-Province"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Centre</Label>
                    <Input
                      value={form.centre}
                      onChange={(e) => setForm((f) => ({ ...f, centre: e.target.value }))}
                      placeholder="Centre"
                    />
                  </div>
                </div>
              )}

              {/* Poste */}
              <div className="space-y-2">
                <Label>Poste *</Label>
                <Select
                  value={form.poste}
                  onValueChange={(v) => setForm((f) => ({ ...f, poste: v }))}
                  disabled={posteOptions.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={posteOptions.length === 0 ? 'Sélectionnez d\'abord un niveau' : 'Sélectionner un poste'} />
                  </SelectTrigger>
                  <SelectContent>
                    {posteOptions.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Info box */}
              <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                L&apos;email et le mot de passe seront générés automatiquement par le serveur.
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={creating}>
                  Annuler
                </Button>
                <Button onClick={handleCreate} disabled={creating}>
                  {creating ? 'Création…' : 'Créer le compte'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* ---- Credentials Card (post-creation) ---- */}
      {createdUser && (
        <Card className="border-green-300 bg-green-50 print:border print:shadow-none">
          <CardHeader>
            <CardTitle className="text-green-800">Compte créé avec succès</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
              <div>
                <span className="font-medium">Nom :</span> {createdUser.nom}
              </div>
              <div>
                <span className="font-medium">Postnom :</span> {createdUser.postnom}
              </div>
              <div>
                <span className="font-medium">Prénom :</span> {createdUser.prenom ?? '—'}
              </div>
              <div>
                <span className="font-medium">Poste :</span> {createdUser.poste}
              </div>
              <div>
                <span className="font-medium">Niveau :</span> {createdUser.niveau}
              </div>
            </div>

            <div className="rounded-md border border-green-300 bg-white p-4">
              <div className="space-y-2">
                <div className="text-lg">
                  <span className="font-semibold">Email :</span>{' '}
                  <span className="font-mono text-xl font-bold text-green-700">{createdUser.email}</span>
                </div>
                <div className="text-lg">
                  <span className="font-semibold">Mot de passe :</span>{' '}
                  <span className="font-mono text-xl font-bold text-green-700">{createdUser.password}</span>
                </div>
              </div>
            </div>

            <p className="text-sm font-medium text-amber-700">
              Ce mot de passe devra être changé lors de la première connexion.
            </p>

            <div className="flex flex-wrap gap-3 print:hidden">
              <Button onClick={() => window.print()}>Imprimer</Button>
              <Button variant="outline" onClick={() => downloadCredentials(createdUser)}>
                Télécharger
              </Button>
              <Button variant="ghost" onClick={() => setCreatedUser(null)}>
                Fermer
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ---- Search ---- */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Rechercher par nom…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* ---- Users Table ---- */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Chargement des utilisateurs…
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <UserPlus className="mb-2 h-8 w-8" />
              <p>{searchQuery ? 'Aucun résultat trouvé' : 'Aucun utilisateur enregistré'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Postnom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.nom}</TableCell>
                    <TableCell>{u.postnom}</TableCell>
                    <TableCell className="font-mono text-xs">{u.email}</TableCell>
                    <TableCell>{u.poste}</TableCell>
                    <TableCell className="capitalize">{u.niveau}</TableCell>
                    <TableCell>{statutBadge(u.statut)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Réinitialiser le mot de passe"
                        onClick={() => handleResetPassword(u.id, u.nom || u.name)}
                      >
                        <RotateCcw className="h-4 w-4 text-blue-500" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        title="Supprimer"
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
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
