import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Printer, Download, X } from 'lucide-react';

interface CreatedUser {
  name: string;
  postnom?: string;
  prenom?: string;
  email: string;
  password: string;
  post: string;
  level: string;
  province?: string;
  sous_province?: string;
  center_id?: number;
  created_at: string;
}

interface Props {
  user: CreatedUser;
  onClose: () => void;
}

export default function UserCreatedSheet({ user, onClose }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    const content = `
FICHE DE CRÉATION DE COMPTE — PAIDE
=====================================
Date: ${new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}

NOM: ${user.name}
POSTNOM: ${user.postnom || '-'}
PRÉNOM: ${user.prenom || '-'}
POSTE: ${user.post}
NIVEAU: ${user.level}
PROVINCE: ${user.province || '-'}
SOUS-PROVINCE: ${user.sous_province || '-'}

========= IDENTIFIANTS DE CONNEXION =========
EMAIL: ${user.email}
MOT DE PASSE INITIAL: ${user.password}

⚠ IMPORTANT: Ce mot de passe devra être changé lors de la première connexion.

Site: https://app.prestige-build.dev
=====================================
Programme d'Appui aux Initiatives de Développement de l'Enfant
    `.trim();

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compte-${user.email.replace('@', '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const levelLabels: Record<string, string> = {
    ministere: 'Ministère',
    national: 'Coordination Nationale',
    provincial: 'Coordination Provinciale',
    sous_provincial: 'Coordination Sous-Provinciale',
    centre: 'Centre'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg bg-white print:shadow-none print:border-none">
        <CardHeader className="flex flex-row items-center justify-between print:pb-2">
          <CardTitle className="text-lg">Fiche de création de compte</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose} className="print:hidden">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center mb-4 print:mb-2">
            <h2 className="text-xl font-bold text-primary">PAIDE</h2>
            <p className="text-xs text-gray-500">Programme d'Appui aux Initiatives de Développement de l'Enfant</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(user.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Nom:</span> <span className="font-medium">{user.name}</span></div>
            <div><span className="text-gray-500">Postnom:</span> <span className="font-medium">{user.postnom || '-'}</span></div>
            <div><span className="text-gray-500">Prénom:</span> <span className="font-medium">{user.prenom || '-'}</span></div>
            <div><span className="text-gray-500">Poste:</span> <span className="font-medium">{user.post}</span></div>
            <div><span className="text-gray-500">Niveau:</span> <span className="font-medium">{levelLabels[user.level] || user.level}</span></div>
            <div><span className="text-gray-500">Province:</span> <span className="font-medium">{user.province || '-'}</span></div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <h3 className="font-bold text-blue-900 mb-2">Identifiants de connexion</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-blue-700">Email:</span>
                <span className="font-mono font-bold text-blue-900">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Mot de passe:</span>
                <span className="font-mono font-bold text-blue-900">{user.password}</span>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
            ⚠ Ce mot de passe devra être changé lors de la première connexion.
          </div>

          <div className="flex gap-3 print:hidden mt-4">
            <Button onClick={handlePrint} className="flex-1">
              <Printer className="h-4 w-4 mr-2" /> Imprimer
            </Button>
            <Button onClick={handleDownload} variant="outline" className="flex-1">
              <Download className="h-4 w-4 mr-2" /> Télécharger
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
