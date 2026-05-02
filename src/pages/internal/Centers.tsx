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

interface Centre {
  id: string;
  nom: string;
  province: string;
  sousProvince: string;
  capacite: number;
  inscrits: number;
  chef: string;
  statut: "actif" | "inactif" | "en construction";
}

interface PaginatedResponse {
  data: Centre[];
  total: number;
  page: number;
  pageSize: number;
}

type CentreFormData = Omit<Centre, "id">;

const EMPTY_FORM: CentreFormData = {
  nom: "",
  province: "",
  sousProvince: "",
  capacite: 0,
  inscrits: 0,
  chef: "",
  statut: "actif",
};

const PAGE_SIZE = 20;

const STATUTS: Centre["statut"][] = ["actif", "inactif", "en construction"];

const PROVINCES = [
  "Kinshasa",
  "Kongo-Central",
  "Kwango",
  "Kwilu",
  "Mai-Ndombe",
  "Équateur",
  "Mongala",
  "Nord-Ubangi",
  "Sud-Ubangi",
  "Tshuapa",
  "Tshopo",
  "Bas-Uélé",
  "Haut-Uélé",
  "Ituri",
  "Nord-Kivu",
  "Sud-Kivu",
  "Maniema",
  "Haut-Katanga",
  "Haut-Lomami",
  "Lualaba",
  "Tanganyika",
  "Lomami",
  "Kasaï",
  "Kasaï-Central",
  "Kasaï-Oriental",
  "Sankuru",
];

const statutBadgeVariant = (s: Centre["statut"]): "default" | "secondary" | "destructive" | "outline" => {
  switch (s) {
    case "actif":
      return "default";
    case "en construction":
      return "secondary";
    case "inactif":
      return "destructive";
    default:
      return "outline";
  }
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function CentersInternalPage() {
  const { user, token } = useAuth();

  // Data
  const [centres, setCentres] = useState<Centre[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // Filters & pagination
  const [search, setSearch] = useState("");
  const [filterProvince, setFilterProvince] = useState("all");
  const [filterStatut, setFilterStatut] = useState("all");
  const [page, setPage] = useState(1);

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Centre | null>(null);
  const [form, setForm] = useState<CentreFormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Centre | null>(null);
  const [deleting, setDeleting] = useState(false);

  const headers = useCallback(
    () => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    }),
    [token]
  );

  // --- fetch ---
  const fetchCentres = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(PAGE_SIZE),
      });
      if (search) params.set("search", search);
      if (filterProvince && filterProvince !== "all") params.set("province", filterProvince);
      if (filterStatut && filterStatut !== "all") params.set("statut", filterStatut);
      if (user?.level) params.set("level", user.level);
      if (user?.centreId) params.set("userCentreId", user.centreId);

      const res = await fetch(`/api/internal/centers?${params}`, {
        headers: headers(),
      });
      if (!res.ok) throw new Error();
      const json: PaginatedResponse = await res.json();
      setCentres(json.data);
      setTotal(json.total);
    } catch {
      toast.error("Erreur lors du chargement des centres");
    } finally {
      setLoading(false);
    }
  }, [token, page, search, filterProvince, filterStatut, user, headers]);

  useEffect(() => {
    fetchCentres();
  }, [fetchCentres]);

  useEffect(() => {
    setPage(1);
  }, [search, filterProvince, filterStatut]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // --- dialog ---
  const openAdd = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (centre: Centre) => {
    setEditing(centre);
    setForm({
      nom: centre.nom,
      province: centre.province,
      sousProvince: centre.sousProvince,
      capacite: centre.capacite,
      inscrits: centre.inscrits,
      chef: centre.chef,
      statut: centre.statut,
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
        ? `/api/internal/centers/${editing.id}`
        : "/api/internal/centers";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: headers(),
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      toast.success(editing ? "Centre modifié avec succès" : "Centre ajouté avec succès");
      setDialogOpen(false);
      fetchCentres();
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
      const res = await fetch(`/api/internal/centers/${deleteTarget.id}`, {
        method: "DELETE",
        headers: headers(),
      });
      if (!res.ok) throw new Error();
      toast.success("Centre supprimé avec succès");
      setDeleteTarget(null);
      fetchCentres();
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
          <CardTitle>Gestion des Centres</CardTitle>
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
                  placeholder="Nom du centre…"
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Label>Province</Label>
              <Select value={filterProvince} onValueChange={setFilterProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Toutes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les provinces</SelectItem>
                  {PROVINCES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
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
                  <TableHead>Province</TableHead>
                  <TableHead>Sous-province</TableHead>
                  <TableHead className="text-right">Capacité</TableHead>
                  <TableHead className="text-right">Inscrits</TableHead>
                  <TableHead>Chef</TableHead>
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
                ) : centres.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10">
                      Aucun centre trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  centres.map((centre) => (
                    <TableRow key={centre.id}>
                      <TableCell className="font-medium">{centre.nom}</TableCell>
                      <TableCell>{centre.province}</TableCell>
                      <TableCell>{centre.sousProvince}</TableCell>
                      <TableCell className="text-right">{centre.capacite}</TableCell>
                      <TableCell className="text-right">{centre.inscrits}</TableCell>
                      <TableCell>{centre.chef}</TableCell>
                      <TableCell>
                        <Badge variant={statutBadgeVariant(centre.statut)}>
                          {centre.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(centre)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteTarget(centre)}
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
            <DialogTitle>{editing ? "Modifier le centre" : "Ajouter un centre"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Modifiez les informations du centre ci-dessous."
                : "Remplissez le formulaire pour créer un nouveau centre."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="nom">Nom du centre</Label>
              <Input
                id="nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Province</Label>
                <Select
                  value={form.province}
                  onValueChange={(v) => setForm({ ...form, province: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVINCES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="sousProvince">Sous-province</Label>
                <Input
                  id="sousProvince"
                  value={form.sousProvince}
                  onChange={(e) => setForm({ ...form, sousProvince: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="capacite">Capacité</Label>
                <Input
                  id="capacite"
                  type="number"
                  min={0}
                  value={form.capacite}
                  onChange={(e) => setForm({ ...form, capacite: Number(e.target.value) })}
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

            <div className="grid gap-2">
              <Label htmlFor="chef">Chef de centre</Label>
              <Input
                id="chef"
                value={form.chef}
                onChange={(e) => setForm({ ...form, chef: e.target.value })}
              />
            </div>

            <div className="grid gap-2">
              <Label>Statut</Label>
              <Select
                value={form.statut}
                onValueChange={(v) =>
                  setForm({ ...form, statut: v as Centre["statut"] })
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
              Voulez-vous vraiment supprimer le centre <strong>{deleteTarget?.nom}</strong> ?
              Cette action est irréversible.
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
