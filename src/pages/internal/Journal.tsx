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

interface Activite {
  id: string;
  date: string;
  description: string;
  responsable: string;
  type: string;
}

type OrdreDate = "asc" | "desc";

const TYPES_ACTIVITE = ["réunion", "formation", "visite", "rapport", "autre"];

export default function Journal() {
  const { user } = useAuth();
  const [activites, setActivites] = useState<Activite[]>([]);
  const [chargement, setChargement] = useState(true);
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [ordreDate, setOrdreDate] = useState<OrdreDate>("desc");
  const [envoi, setEnvoi] = useState(false);

  const [formulaire, setFormulaire] = useState({
    date: "",
    description: "",
    responsable: "",
    type: TYPES_ACTIVITE[0],
  });

  useEffect(() => {
    chargerActivites();
  }, []);

  async function chargerActivites() {
    setChargement(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/internal/journal", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement du journal");
      const data = await res.json();
      setActivites(data);
    } catch (err) {
      toast.error("Impossible de charger le journal des activités");
    } finally {
      setChargement(false);
    }
  }

  async function ajouterActivite(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/internal/journal", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formulaire),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      const nouvelle = await res.json();
      setActivites((prev) => [...prev, nouvelle]);
      setFormulaire({
        date: "",
        description: "",
        responsable: "",
        type: TYPES_ACTIVITE[0],
      });
      setDialogOuvert(false);
      toast.success("Activité ajoutée avec succès");
    } catch (err) {
      toast.error("Impossible d'ajouter l'activité");
    } finally {
      setEnvoi(false);
    }
  }

  function basculerOrdre() {
    setOrdreDate((prev) => (prev === "asc" ? "desc" : "asc"));
  }

  const activitesTriees = [...activites].sort((a, b) => {
    const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
    return ordreDate === "asc" ? diff : -diff;
  });

  function badgeType(type: string) {
    switch (type) {
      case "réunion":
        return "default";
      case "formation":
        return "secondary";
      case "visite":
        return "outline";
      default:
        return "outline";
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Journal des Activités</CardTitle>
            <CardDescription>
              Chargé des Opérations : {user?.nom ?? "—"}
            </CardDescription>
          </div>
          <Dialog open={dialogOuvert} onOpenChange={setDialogOuvert}>
            <DialogTrigger asChild>
              <Button>Nouvelle activité</Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={ajouterActivite}>
                <DialogHeader>
                  <DialogTitle>Ajouter une activité</DialogTitle>
                  <DialogDescription>
                    Remplissez les informations de la nouvelle activité.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      required
                      value={formulaire.date}
                      onChange={(e) =>
                        setFormulaire({ ...formulaire, date: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      required
                      placeholder="Description de l'activité"
                      value={formulaire.description}
                      onChange={(e) =>
                        setFormulaire({
                          ...formulaire,
                          description: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="responsable">Responsable</Label>
                    <Input
                      id="responsable"
                      required
                      placeholder="Nom du responsable"
                      value={formulaire.responsable}
                      onChange={(e) =>
                        setFormulaire({
                          ...formulaire,
                          responsable: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <select
                      id="type"
                      className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                      value={formulaire.type}
                      onChange={(e) =>
                        setFormulaire({ ...formulaire, type: e.target.value })
                      }
                    >
                      {TYPES_ACTIVITE.map((t) => (
                        <option key={t} value={t}>
                          {t.charAt(0).toUpperCase() + t.slice(1)}
                        </option>
                      ))}
                    </select>
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
        </CardHeader>
        <CardContent>
          {chargement ? (
            <p className="text-muted-foreground py-8 text-center">
              Chargement en cours...
            </p>
          ) : activitesTriees.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Aucune activité enregistrée.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={basculerOrdre}
                  >
                    Date {ordreDate === "asc" ? "↑" : "↓"}
                  </TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Responsable</TableHead>
                  <TableHead>Type</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {activitesTriees.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      {new Date(a.date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell>{a.description}</TableCell>
                    <TableCell>{a.responsable}</TableCell>
                    <TableCell>
                      <Badge variant={badgeType(a.type)}>{a.type}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
