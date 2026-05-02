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

interface Formation {
  id: string;
  nom: string;
  filiere: string;
  centre: string;
  centreId: string;
  formateur: string;
  inscrits: number;
  dateDebut: string;
  dateFin: string;
  statut: "en cours" | "terminée" | "planifiée" | "annulée";
}

interface Centre {
  id: string;
  nom: string;
}

interface PaginatedResponse {
  data: Formation[];
  total: number;
  page: number;
  pageSize: number;
}

type FormationFormData = Omit<Formation, "id">;

const EMPTY_FORM: FormationFormData = {
  nom: "",
  filiere: "",
  centre: "",
  centreId: "",
  formateur: "",
  inscrits: 0,
  dateDebut: "",
  dateFin: "",
  statut: "planifiée",
};

const PAGE_SIZE = 20;

const FILIERES = [
  "Coupe et Couture",
  "Mécanique",
  "Menuiserie",
  "Informatique",
  "Agriculture",
];

const STATUTS: Formation["statut"][] = ["en cours", "terminée", "planifiée", "annulée"];

const statutBadgeVariant = (s: Formation["statut"]): "default" | "secondary" | "destructive" | "outline" => {
  switch (s) {
    case "en cours":
      return "default";
    case "terminée":
      return "secondary";
    case "annulée":
      return "destructive";
    case "planifiée":
      return "outline";
    default:
      return "outline";
  }
};

const formatDate = (iso: string) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function FormationsInternalPage() {
  const { user, token } = useAuth();

  // Data
  const [formations, setFormations] = useState<Formation[]>([]);
  const [centres, setCentres] = useState<Centre[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [filterFiliere, setFilterFiliere] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [filterCentre, setFilterCentre] = useState("all");
  const [page, setPage] = useState(1);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Formation | null>(null);
  const [form, setForm] = useState<FormationFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Formation | null>(null);
  const [deleting, setDeleting] = useState(false);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // --- fetch centres ---
  useEffect(() => {
    if (!token) return;
    fetch("/api/internal/centers", { headers: headers() })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => setCentres(Array.isArray(data) ? data : data.data ?? []))
      .catch(() => toast.error("Impossible de charger les centres"));
  }, [token, headers]);

  // --- fetch formations ---
  const fetchFormations = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (filterFiliere && filterFiliere !== "all") params.set("filiere", filterFiliere);
      if (filterStatut && filterStatut !== "all") params.set("statut", filterStatut);
      if (filterCentre && filterCentre !== "all") params.set("centreId", filterCentre);
      if (user?.level) params.set("level", user.level);
      if (user?.centreId) params.set("userCentreId", user.centreId);

      const res = await fetch(`/api/internal/formations?${params}`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error();
      const json: PaginatedResponse = await res.json();
      setFormations(json.data);
      setTotal(json.total);
    } catch {
      toast.error("Erreur lors du chargement des formations");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, filterFiliere, filterStatut, filterCentre, user, headers]);

  useEffect(() => {
    fetchFormations();
  }, [fetchFormations]);

  useEffect(() => {
    setPage(1);
  }, [search, filterFiliere, filterStatut, filterCentre]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // --- dialog ---
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (formation: Formation) => {
    setEditing(formation);
    setForm({
      nom: formation.nom,
      filiere: formation.filiere,
      centre: formation.centre,
      centreId: formation.centreId,
      formateur: formation.formateur,
      inscrits: formation.inscrits,
      dateDebut: formation.dateDebut,
      dateFin: formation.dateFin,
      statut: formation.statut,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) {
      toast.error("Le nom est obligatoire");
      return;
    }
    if (!form.filiere) {
      toast.error("La filière est obligatoire");
      return;
    }
    setSaving(true);
    try {
      const url = editing
        ? `/api/internal/formations/${editing.id}`
        : "/api/internal/formations";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(
        editing ? "Formation modifiée avec succès" : "Formation ajoutée avec succès"
      );
      setDialogOpen(false);
      fetchFormations();
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
      const res = await fetch(`/api/internal/formations/${deleteTarget.id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error();
      toast.success("Formation supprimée avec succès");
      setDeleteTarget(null);
      fetchFormations();
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
          <CardTitle>Gestion des Formations</CardTitle>
          <Button onClick={openAdd}>
            <Plus className="mr-2 h-4 w-4" /> Ajouter
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <Label>Rechercher</Label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Nom de la formation…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label>Filière</Label>
              <Select value={filterFiliere} onValueChange={setFilterFiliere}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les filières</SelectItem>
                  {FILIERES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-48">
              <Label>Centre</Label>
              <Select value={filterCentre} onValueChange={setFilterCentre}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
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
                  <SelectValue placeholder="Tous" />
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
                  <TableHead>Filière</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead>Formateur</TableHead>
                  <TableHead className="text-right">Inscrits</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      Chargement…
                    </TableCell>
                  </TableRow>
                ) : formations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10">
                      Aucune formation trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  formations.map((f) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.nom}</TableCell>
                      <TableCell>{f.filiere}</TableCell>
                      <TableCell>{f.centre}</TableCell>
                      <TableCell>{f.formateur}</TableCell>
                      <TableCell className="text-right">{f.inscrits}</TableCell>
                      <TableCell>{formatDate(f.dateDebut)}</TableCell>
                      <TableCell>{formatDate(f.dateFin)}</TableCell>
                      <TableCell>
                        <Badge variant={statutBadgeVariant(f.statut)}>
                          {f.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(f)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(f)}
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
            <DialogTitle>
              {editing ? "Modifier la formation" : "Ajouter une formation"}
            </DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifiez les informations de la formation ci-dessous."
                : "Remplissez le formulaire pour créer une nouvelle formation."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nom">Nom de la formation</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Filière</Label>
                <Select
                  value={form.filiere}
                  onValueChange={(v) => setForm({ ...form, filiere: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {FILIERES.map((f) => (
                      <SelectItem key={f} value={f}>
                        {f}
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

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="formateur">Formateur</Label>
                <Input
                  id="formateur"
                  value={form.formateur}
                  onChange={(e) => setForm({ ...form, formateur: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="inscrits">Inscrits</Label>
                <Input
                  id="inscrits"
                  type="number"
                  min={0}
                  value={form.inscrits}
                  onChange={(e) => setForm({ ...form, inscrits: Number(e.target.value) })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="dateDebut">Date de début</Label>
                <Input
                  id="dateDebut"
                  type="date"
                  value={form.dateDebut}
                  onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="dateFin">Date de fin</Label>
                <Input
                  id="dateFin"
                  type="date"
                  value={form.dateFin}
                  onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select
                value={form.statut}
                onValueChange={(v) =>
                  setForm({ ...form, statut: v as Formation["statut"] })
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
              Voulez-vous vraiment supprimer la formation{" "}
              <strong>{deleteTarget?.nom}</strong> ? Cette action est irréversible.
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
