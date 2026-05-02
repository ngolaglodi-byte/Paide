import React, { useState, useEffect, useCallback } from 'react';
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
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Search,
  Plus,
  Eye,
  FolderOpen,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Document {
  id: string;
  titre: string;
  type: DocumentType;
  taille: string;
  uploade_par: string;
  date: string;
  url?: string;
}

type DocumentType = 'administrative' | 'financier' | 'template' | 'rapport' | 'autre';

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'administrative', label: 'Administratif' },
  { value: 'financier', label: 'Financier' },
  { value: 'template', label: 'Template' },
  { value: 'rapport', label: 'Rapport' },
  { value: 'autre', label: 'Autre' },
];

const TYPE_BADGE_VARIANT: Record<DocumentType, string> = {
  administrative: 'bg-blue-100 text-blue-800',
  financier: 'bg-green-100 text-green-800',
  template: 'bg-purple-100 text-purple-800',
  rapport: 'bg-amber-100 text-amber-800',
  autre: 'bg-gray-100 text-gray-800',
};

// ---------------------------------------------------------------------------
// Helper: human-readable file size
// ---------------------------------------------------------------------------

function formatTaille(taille: string | number): string {
  if (typeof taille === 'string') return taille;
  const kb = Number(taille) / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} Ko`;
  return `${(kb / 1024).toFixed(1)} Mo`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Documents() {
  const { token } = useAuth();

  // Data
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & filter
  const [recherche, setRecherche] = useState('');
  const [filtreType, setFiltreType] = useState<string>('tous');

  // Dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form fields
  const [titre, setTitre] = useState('');
  const [type, setType] = useState<DocumentType>('administrative');
  const [fichier, setFichier] = useState<File | null>(null);

  // ---------- Fetch documents ----------

  const fetchDocuments = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/internal/documents', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur ${res.status}`);
      const data = await res.json();
      setDocuments(Array.isArray(data) ? data : data.documents ?? []);
    } catch (err: any) {
      toast.error('Impossible de charger les documents', {
        description: err.message,
      });
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchDocuments();
  }, [token, fetchDocuments]);

  // ---------- Upload ----------

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!titre.trim()) {
      toast.error('Le titre est requis');
      return;
    }
    if (!fichier) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', fichier);
      formData.append('title', titre.trim());
      formData.append('type', type);

      const res = await fetch('/api/internal/documents', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Erreur ${res.status}`);
      }

      toast.success('Document ajouté avec succès');
      setDialogOpen(false);
      resetForm();
      fetchDocuments();
    } catch (err: any) {
      toast.error("Échec de l'envoi du document", {
        description: err.message,
      });
    } finally {
      setUploading(false);
    }
  };

  // ---------- Delete ----------

  const handleDelete = async (id: string, titreDoc: string) => {
    if (!window.confirm(`Supprimer le document "${titreDoc}" ?`)) return;

    try {
      const res = await fetch(`/api/internal/documents/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message ?? `Erreur ${res.status}`);
      }

      toast.success('Document supprimé');
      setDocuments((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      toast.error('Impossible de supprimer le document', {
        description: err.message,
      });
    }
  };

  // ---------- Download ----------

  const handleDownload = (doc: Document) => {
    if (doc.url) {
      const a = document.createElement('a');
      a.href = doc.url;
      a.download = doc.titre;
      a.click();
    } else {
      window.open(`/api/internal/documents/${doc.id}/download`, '_blank');
    }
  };

  // ---------- Helpers ----------

  const resetForm = () => {
    setTitre('');
    setType('administrative');
    setFichier(null);
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchRecherche =
      !recherche ||
      doc.titre.toLowerCase().includes(recherche.toLowerCase()) ||
      doc.uploade_par?.toLowerCase().includes(recherche.toLowerCase());
    const matchType = filtreType === 'tous' || doc.type === filtreType;
    return matchRecherche && matchType;
  });

  // ---------- Render ----------

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Documents administratifs
          </h1>
          <p className="text-muted-foreground">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un document
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter un document</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleUpload} className="space-y-4 pt-2">
              {/* Titre */}
              <div className="space-y-2">
                <Label htmlFor="doc-titre">Titre</Label>
                <Input
                  id="doc-titre"
                  placeholder="Nom du document"
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  required
                />
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="doc-type">Type</Label>
                <Select value={type} onValueChange={(v) => setType(v as DocumentType)}>
                  <SelectTrigger id="doc-type">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent>
                    {DOCUMENT_TYPES.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fichier */}
              <div className="space-y-2">
                <Label htmlFor="doc-fichier">Fichier</Label>
                <Input
                  id="doc-fichier"
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.gif,.zip,.rar,.7z"
                  onChange={(e) => setFichier(e.target.files?.[0] ?? null)}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setDialogOpen(false); resetForm(); }}
                  disabled={uploading}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <>
                      <Upload className="mr-2 h-4 w-4 animate-spin" />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Envoyer
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Rechercher un document..."
                value={recherche}
                onChange={(e) => setRecherche(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filtreType} onValueChange={setFiltreType}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="Filtrer par type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les types</SelectItem>
                {DOCUMENT_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Liste des documents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : filteredDocuments.length === 0 ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">Aucun document</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {recherche || filtreType !== 'tous'
                  ? 'Aucun document ne correspond aux critères de recherche.'
                  : "Commencez par ajouter votre premier document."}
              </p>
              {!recherche && filtreType === 'tous' && (
                <Button onClick={() => setDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un document
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Titre</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Taille</TableHead>
                    <TableHead>Uploadé par</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                          <span className="font-medium">{doc.titre}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={TYPE_BADGE_VARIANT[doc.type] ?? TYPE_BADGE_VARIANT.autre}
                        >
                          {DOCUMENT_TYPES.find((t) => t.value === doc.type)?.label ?? doc.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatTaille(doc.taille)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {doc.uploade_par}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(doc.date).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Télécharger"
                            onClick={() => handleDownload(doc)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Supprimer"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleDelete(doc.id, doc.titre)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
