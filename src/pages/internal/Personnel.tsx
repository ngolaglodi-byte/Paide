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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Personnel {
  id: string;
  nom: string;
  postnom: string;
  poste: string;
  email: string;
  statut: string;
}

export default function Personnel() {
  const { user } = useAuth();
  const [personnel, setPersonnel] = useState<Personnel[]>([]);
  const [recherche, setRecherche] = useState("");
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    chargerPersonnel();
  }, []);

  async function chargerPersonnel() {
    setChargement(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/internal/personnel", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Erreur lors du chargement du personnel");
      const data = await res.json();
      setPersonnel(data);
    } catch (err) {
      toast.error("Impossible de charger la liste du personnel");
    } finally {
      setChargement(false);
    }
  }

  const personnelFiltre = personnel.filter(
    (p) =>
      p.nom.toLowerCase().includes(recherche.toLowerCase()) ||
      p.postnom.toLowerCase().includes(recherche.toLowerCase())
  );

  function badgeVariant(statut: string) {
    switch (statut) {
      case "actif":
        return "default";
      case "congé":
        return "secondary";
      case "inactif":
        return "destructive";
      default:
        return "outline";
    }
  }

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion du Personnel</CardTitle>
          <CardDescription>
            Liste des agents du centre — Chef de Centre : {user?.nom ?? "—"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Rechercher par nom ou postnom..."
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="max-w-sm"
          />

          {chargement ? (
            <p className="text-muted-foreground py-8 text-center">
              Chargement en cours...
            </p>
          ) : personnelFiltre.length === 0 ? (
            <p className="text-muted-foreground py-8 text-center">
              Aucun agent trouvé.
            </p>
          ) : (
            <div className="overflow-x-auto"><Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Postnom</TableHead>
                  <TableHead>Poste</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {personnelFiltre.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.nom}</TableCell>
                    <TableCell>{p.postnom}</TableCell>
                    <TableCell>{p.poste}</TableCell>
                    <TableCell>{p.email}</TableCell>
                    <TableCell>
                      <Badge variant={badgeVariant(p.statut)}>
                        {p.statut}
                      </Badge>
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
