import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Child {
  id: string;
  nom: string;
  age: number;
  genre: "M" | "F";
  situation: "orphelin" | "rue" | "déplacé" | "autre";
  centre: string;
  centreId: string;
  formation: string;
  statut: "actif" | "inactif" | "diplômé" | "abandonné";
}

interface Centre {
  id: string;
  nom: string;
}

interface PaginatedResponse {
  data: Child[];
  total: number;
  page: number;
  pageSize: number;
}

type ChildFormData = Omit<Child, "id">;

const EMPTY_FORM: ChildFormData = {
  nom: "",
  age: 0,
  genre: "M",
  situation: "orphelin",
  centre: "",
  centreId: "",
  formation: "",
  statut: "actif",
};

const PAGE_SIZE = 20;

const SITUATIONS: Child["situation"][] = ["orphelin", "rue", "déplacé", "autre"];
const STATUTS: Child["statut"][] = ["actif", "inactif", "diplômé", "abandonné"];

const statutBadgeVariant = (s: Child["statut"]): "default" | "secondary" | "destructive" | "outline" => {
  switch (s) {
    case "actif":
      return "default";
    case "diplômé":
      return "secondary";
    case "abandonné":
      return "destructive";
    default:
      return "outline";
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function ChildrenPage() {
  const { user, token } = useAuth();

  // Data
  const [children, setChildren] = useState<Child[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [filterCentre, setFilterCentre] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [page, setPage] = useState(1);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Child | null>(null);
  const [form, setForm] = useState<ChildFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Child | null>(null);
  const [deleting, setDeleting] = useState(false);

  // --- helpers ---
  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // --- fetch centres (for filter + form) ---
  useEffect(() => {
    if (!token) return;
    fetch("/api/internal/centers", { headers: headers() })
      .then((r) => {
        if (!r.ok) throw new Error("Erreur chargement centres");
        return r.json();
      })
      .then((data) => setCentres(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => toast.error("Impossible de charger les centres"));
  }, [token, headers]);

  // --- fetch children ---
  const fetchChildren = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (filterCentre && filterCentre !== "all") params.set("centreId", filterCentre);
      if (filterStatut && filterStatut !== "all") params.set("statut", filterStatut);
      if (user?.level) params.set("level", user.level);
      if (user?.centreId) params.set("userCentreId", user.centreId);

      const res = await fetch(`/api/internal/children?${params}`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error();
      const json: PaginatedResponse = await res.json();
      setChildren(json.data);
      setTotal(json.total);
    } catch {
      toast.error("Erreur lors du chargement des enfants");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, filterCentre, filterStatut, user, headers]);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterCentre, filterStatut]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // --- dialog helpers ---
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (child: Child) => {
    setEditing(child);
    setForm({
      nom: child.nom,
      age: child.age,
      genre: child.genre,
      situation: child.situation,
      centre: child.centre,
      centreId: child.centreId,
      formation: child.formation,
      statut: child.statut,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/internal/children/${editing.id}`
        : "/api/internal/children";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Enfant modifié avec succès" : "Enfant ajouté avec succès");
      setDialogOpen(false);
      fetchChildren();
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/internal/children/${deleteTarget.id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error();
      toast.success("Enfant supprimé avec succès");
      setDeleteTarget(null);
      fetchChildren();
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleting(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Gestion des Enfants</CardTitle>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label>Rechercher par nom</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom de l'enfant…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label>Centre</Label>
              <Select value={filterCentre} onValueChange={setFilterCentre}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les centres" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les centres</SelectItem>
                  {centres.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-44">
              <Label>Statut</Label>
              <Select value={filterStatut} onValueChange={setFilterStatut}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Âge</TableHead>
                  <TableHead>Genre</TableHead>
                  <TableHead>Situation</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>Formation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Chargement…
                    </TableCell>
                  </TableRow>
                ) : children.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Aucun enfant trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  children.map((child) => (
                    <TableRow key={child.id}>
                      <TableCell className="font-medium">{child.nom}</TableCell>
                      <TableCell>{child.age}</TableCell>
                      <TableCell>{child.genre}</TableCell>
                      <TableCell className="capitalize">{child.situation}</TableCell>
                      <TableCell>{child.centre}</TableCell>
                      <TableCell>{child.formation}</TableCell>
                      <TableCell>
                        <Badge variant={statutBadgeVariant(child.statut)}>
                          {child.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(child)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(child)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table></div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {total} résultat{total !== 1 ? "s" : ""} — Page {page} / {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4 mr-1" /> Précédent
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ---- Add / Edit Dialog ---- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Modifier l'enfant" : "Ajouter un enfant"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifiez les informations de l'enfant ci-dessous."
                : "Remplissez le formulaire pour inscrire un nouvel enfant."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nom">Nom complet</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="age">Âge</Label>
                <Input
                  id="age"
                  type="number"
                  min={0}
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label>Genre</Label>
                <Select
                  value={form.genre}
                  onValueChange={(v) => setForm({ ...form, genre: v as "M" | "F" })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="M">Masculin</SelectItem>
                    <SelectItem value="F">Féminin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Situation</Label>
                <Select
                  value={form.situation}
                  onValueChange={(v) =>
                    setForm({ ...form, situation: v as Child["situation"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SITUATIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Centre</Label>
                <Select
                  value={form.centreId}
                  onValueChange={(v) => {
                    const c = centres.find((x) => x.id === v);
                    setForm({ ...form, centreId: v, centre: c?.nom ?? "" });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {centres.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="formation">Formation</Label>
              <Input
                id="formation"
                value={form.formation}
                onChange={(e) => setForm({ ...form, formation: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select
                value={form.statut}
                onValueChange={(v) =>
                  setForm({ ...form, statut: v as Child["statut"] })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUTS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Enregistrement…" : editing ? "Modifier" : "Ajouter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Delete Confirmation ---- */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Voulez-vous vraiment supprimer <strong>{deleteTarget?.nom}</strong> ? Cette action
              est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
