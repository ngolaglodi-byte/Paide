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
} from "@/components/ui/dialog";

interface Incident {
  id: string;
  nomEnfant: string;
  type: string;
  description: string;
  actionPrise: string;
  date: string;
}

const TYPES_INCIDENT = ["absence", "comportement", "infraction", "autre"];

const FORM_VIDE = {
  nomEnfant: "",
  type: TYPES_INCIDENT[0],
  description: "",
  actionPrise: "",
  date: "",
};

export default function Discipline() {
  const { user } = useAuth();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [chargement, setChargement] = useState(true);
  const [dialogOuvert, setDialogOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [formulaire, setFormulaire] = useState(FORM_VIDE);

  useEffect(() => {
    chargerIncidents();
  }, []);

  async function chargerIncidents() {
    setChargement(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/internal/discipline", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur de chargement");
      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      toast.error("Impossible de charger le registre disciplinaire");
    } finally {
      setChargement(false);
    }
  }

  async function ajouterIncident(e: React.FormEvent) {
    e.preventDefault();
    setEnvoi(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/internal/discipline", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formulaire),
      });
      if (!res.ok) throw new Error("Erreur lors de l'ajout");
      const nouveau = await res.json();
      setIncidents((prev) => [...prev, nouveau]);
      setFormulaire(FORM_VIDE);
      setDialogOuvert(false);
      toast.success("Incident enregistré avec succès");
    } catch (err) {
      toast.error("Impossible d'enregistrer l'incident");
    } finally {
      setEnvoi(false);
    }
  }

  function badgeType(type: string) {
    switch (type) {
      case "absence":
        return "secondary";
      case "comportement":
        return "default";
      case "infraction":
        return "destructive";
      case "autre":
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
            <CardTitle>Registre Disciplinaire</CardTitle>
            <CardDescription>
              Responsable discipline : {user?.nom ?? "—"}
            </CardDescription>
          </div>
          <Button onClick={() => setDialogOuvert(true)}>
            Signaler un incident
          </Button>
        </CardHeader>
        <CardContent>
          {chargement ? (
            <p className="text-muted-foreground py-8 text-center">
              Chargement en cours...
            </p>
          ) : incidents.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Aucun incident enregistré.
            </p>
          ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Nom de l'enfant</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Action prise</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell>
                      {new Date(inc.date).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="font-medium">
                      {inc.nomEnfant}
                    </TableCell>
                    <TableCell>
                      <Badge variant={badgeType(inc.type)}>{inc.type}</Badge>
                    </TableCell>
                    <TableCell>{inc.description}</TableCell>
                    <TableCell>{inc.actionPrise}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table></div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOuvert} onOpenChange={setDialogOuvert}>
        <DialogContent>
          <form onSubmit={ajouterIncident}>
            <DialogHeader>
              <DialogTitle>Signaler un incident</DialogTitle>
              <DialogDescription>
                Remplissez les informations relatives à l'incident disciplinaire.
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
                <Label htmlFor="nomEnfant">Nom de l'enfant</Label>
                <Input
                  id="nomEnfant"
                  required
                  placeholder="Nom complet de l'enfant"
                  value={formulaire.nomEnfant}
                  onChange={(e) =>
                    setFormulaire({ ...formulaire, nomEnfant: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type d'incident</Label>
                <select
                  id="type"
                  className="border-input bg-background flex h-10 w-full rounded-md border px-3 py-2 text-sm"
                  value={formulaire.type}
                  onChange={(e) =>
                    setFormulaire({ ...formulaire, type: e.target.value })
                  }
                >
                  {TYPES_INCIDENT.map((t) => (
                    <option key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  required
                  placeholder="Décrivez l'incident"
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
                <Label htmlFor="actionPrise">Action prise</Label>
                <Input
                  id="actionPrise"
                  required
                  placeholder="Mesure disciplinaire appliquée"
                  value={formulaire.actionPrise}
                  onChange={(e) =>
                    setFormulaire({
                      ...formulaire,
                      actionPrise: e.target.value,
                    })
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
