import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Equipement {
  id: string;
  nom: string;
  categorie: string;
  quantite: number;
  etat: string;
  centre: string;
}

const CATEGORIES = ["informatique", "mobilier", "pédagogique", "sport"];
const ETATS = ["neuf", "bon", "usagé", "hors-service"];

const FORM_VIDE = {
  nom: "",
  categorie: CATEGORIES[0],
  quantite: 1,
  etat: ETATS[0],
  centre: "",
};

export default function Equipement() {
  const { user } = useAuth();
  const [equipements, setEquipements] = useState<Equipement[]>([]);
  const [chargement, setChargement] = useState(true);
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [edition, setEdition] = useState<Equipement | null>(null);
  const [formulaire, setFormulaire] = useState(FORM_VIDE);

  useEffect(() => {
    chargerEquipements();
  }, []);

  async function chargerEquipements() {
    setChargement(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/internal/equipement", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setEquipements(data);
    } catch (err) {
      toast.error("Impossible de charger l'inventaire");
    } finally {
      setChargement(false);
    }
  }

  function ouvrirAjout() {
    setEdition(null);
    setFormulaire(FORM_VIDE);
    setDialogOuvert(true);
  }

  function ouvrirEdition(eq: Equipement) {
    setEdition(eq);
    setFormulaire({
      nom: eq.nom,
      categorie: eq.categorie,
      quantite: eq.quantite,
      etat: eq.etat,
      centre: eq.centre,
    });
    setDialogOuvert(true);
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const token = localStorage.getItem("token");
      const estEdition = edition !== null;
      const url = estEdition
        ? `/api/internal/equipement/${edition.id}`
        : "/api/internal/equipement";
      const method = estEdition ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formulaire),
      });
      if (!res.ok) throw new Error("Erreur lors de l'enregistrement");
      const resultat = await res.json();

      if (estEdition) {
        setEquipements((prev) =>
          prev.map((eq) => (eq.id === edition.id ? resultat : eq))
        );
        toast.success("Équipement modifié avec succès");
      } else {
        setEquipements((prev) => [...prev, resultat]);
        toast.success("Équipement ajouté avec succès");
      }

      setDialogOuvert(false);
      setEdition(null);
      setFormulaire(FORM_VIDE);
    } catch (err) {
      toast.error("Impossible d'enregistrer l'équipement");
    } finally {
      setEnvoi(false);
    }
  }

  function badgeEtat(etat: string) {
    switch (etat) {
      case "neuf":
        return "default";
      case "bon":
        return "secondary";
      case "usagé":
        return "outline";
      case "hors-service":
        return "destructive";
      default:
        return "outline";
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Inventaire des Équipements</CardTitle>
            <CardDescription>
              Intendant : {user?.nom ?? "—"}
            </CardDescription>
          </div>
          <Button onClick={ouvrirAjout}>Ajouter un équipement</Button>
        </CardHeader>
        <CardContent>
          {chargement ? (
            <p className="text-muted-foreground py-8 text-center">
              Chargement en cours...
            </p>
          ) : equipements.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Aucun équipement enregistré.
            </p>
          ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Catégorie</TableHead>
                  <TableHead>Quantité</TableHead>
                  <TableHead>État</TableHead>
                  <TableHead>Centre</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipements.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell className="font-medium">{eq.nom}</TableCell>
                    <TableCell>
                      {eq.categorie.charAt(0).toUpperCase() +
                        eq.categorie.slice(1)}
                    </TableCell>
                    <TableCell>{eq.quantite}</TableCell>
                    <TableCell>
                      <Badge variant={badgeEtat(eq.etat)}>{eq.etat}</Badge>
                    </TableCell>
                    <TableCell>{eq.centre}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => ouvrirEdition(eq)}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOuvert} onOpenChange={setDialogOuvert}>
        <DialogContent>
          <form onSubmit={soumettre}>
            <DialogHeader>
              <DialogTitle>
                {edition ? "Modifier l'équipement" : "Ajouter un équipement"}
              </DialogTitle>
              <DialogDescription>
                {edition
                  ? "Modifiez les informations de l'équipement."
                  : "Remplissez les informations du nouvel équipement."}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="nom">Nom</Label>
                <Input
                  id="nom"
                  required
                  placeholder="Nom de l'équipement"
                  value={formulaire.nom}
                  onChange={(e) =>
                    setFormulaire({ ...formulaire, nom: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categorie">Catégorie</Label>
                <select
                  id="categorie"
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={formulaire.categorie}
                  onChange={(e) =>
                    setFormulaire({ ...formulaire, categorie: e.target.value })
                  }
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c.charAt(0).toUpperCase() + c.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantite">Quantité</Label>
                <Input
                  id="quantite"
                  type="number"
                  min={0}
                  required
                  value={formulaire.quantite}
                  onChange={(e) =>
                    setFormulaire({
                      ...formulaire,
                      quantite: parseInt(e.target.value, 10) || 0,
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="etat">État</Label>
                <select
                  id="etat"
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={formulaire.etat}
                  onChange={(e) =>
                    setFormulaire({ ...formulaire, etat: e.target.value })
                  }
                >
                  {ETATS.map((et) => (
                    <option key={et} value={et}>
                      {et.charAt(0).toUpperCase() + et.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="centre">Centre</Label>
                <Input
                  id="centre"
                  required
                  placeholder="Nom du centre"
                  value={formulaire.centre}
                  onChange={(e) =>
                    setFormulaire({ ...formulaire, centre: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="submit" disabled={envoi}>
                {envoi ? "Enregistrement..." : "Enregistrer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
