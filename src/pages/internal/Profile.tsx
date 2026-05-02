import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building, 
  Calendar, 
  Edit, 
  Lock, 
  Shield,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Banknote
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';




export default function Profile() {
  const { user, setUser } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string>((user as any)?.avatar_url || '');

  // Sync avatar quand user charge (useState initial ne se met pas à jour async)
  useEffect(() => {
    if ((user as any)?.avatar_url) setAvatarUrl((user as any).avatar_url + '?t=' + Date.now());
  }, [user]);
  const [isEditing, setIsEditing] = useState(false);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Image trop grande (max 5MB)'); return; }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_id', String((user as any)?.id));
    formData.append('doc_type', 'avatar');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/avatar', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      if (response.ok) {
        const data = await response.json();
        setAvatarUrl(data.avatar_url + '?t=' + Date.now());
        if (user) setUser({ ...user, avatar_url: data.avatar_url } as any);
        toast.success('Photo de profil mise à jour');
      } else {
        toast.error('Erreur lors de l\'upload');
      }
    } catch { toast.error('Erreur de connexion'); }
  };
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    postnom: (user as any)?.postnom || '',
    email: user?.email || '',
    phone: user?.phone || '',
    province: user?.province || '',
    department: user?.department || '',
    post: user?.post || ''
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // API call pour mettre à jour le profil
      toast.success('Profil mis à jour avec succès');
      setIsEditing(false);
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les nouveaux mots de passe ne correspondent pas');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: passwordData.currentPassword, newPassword: passwordData.newPassword })
      });
      if (response.ok) {
        toast.success('Mot de passe modifié avec succès');
        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        const err = await response.json();
        toast.error(err.message || 'Erreur lors du changement');
      }
    } catch (error) {
      toast.error('Erreur de connexion');
    }
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case 'national': return 'bg-primary';
      case 'provincial': return 'bg-warning';
      case 'local': return 'bg-success';
      default: return 'bg-secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    return status === 'active' ? (
      <CheckCircle className="h-4 w-4 text-success" />
    ) : (
      <AlertCircle className="h-4 w-4 text-warning" />
    );
  };

  return (
    <div className="bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* En-tête du profil */}
        <div className="mb-8">
          <Card className="card-official">
            <CardContent className="p-6">
              <div className="flex items-center space-x-6">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                    {avatarUrl ? (
                      <img
                        src={avatarUrl}
                        alt={user?.name || ''}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const t = e.target as HTMLImageElement;
                          t.style.display = 'none';
                          if (t.nextElementSibling) (t.nextElementSibling as HTMLElement).style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <span className={`text-2xl font-bold text-primary/80 ${avatarUrl ? 'hidden' : 'flex'} items-center justify-center w-full h-full`}>
                      {(user?.name || 'U').split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    <span className="text-white text-xs font-medium">Changer</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-dark mb-2">{user.name}</h1>
                  <p className="text-lg text-gray-600 mb-3">{user.post}</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge className={getLevelBadgeColor(user.level)}>
                      Niveau {user.level}
                    </Badge>
                    <Badge variant="outline">
                      {user.department}
                    </Badge>
                    <Badge variant="outline" className="flex items-center gap-1">
                      {getStatusIcon(user.status || 'active')}
                      Actif
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs principales */}
        <Tabs defaultValue="informations" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="informations" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Informations
            </TabsTrigger>
            <TabsTrigger value="securite" className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              Sécurité
            </TabsTrigger>
            <TabsTrigger value="activite" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Activité
            </TabsTrigger>
          </TabsList>

          {/* Onglet Informations personnelles */}
          <TabsContent value="informations">
            <Card className="card-official">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Informations personnelles
                    </CardTitle>
                    <CardDescription>
                      Gérez vos informations personnelles et professionnelles
                    </CardDescription>
                  </div>
                  <Button
                    variant={isEditing ? "outline" : "default"}
                    onClick={() => setIsEditing(!isEditing)}
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {isEditing ? 'Annuler' : 'Modifier'}
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Nom complet
                      </Label>
                      <Input
                        id="name"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="postnom" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Postnom
                      </Label>
                      <Input
                        id="postnom"
                        value={profileData.postnom}
                        onChange={(e) => setProfileData(prev => ({ ...prev, postnom: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email professionnel
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        disabled={!isEditing}
                        placeholder="+243 XX XXX XXXX"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="province" className="flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        Province
                      </Label>
                      <Input
                        id="province"
                        value={profileData.province}
                        onChange={(e) => setProfileData(prev => ({ ...prev, province: e.target.value }))}
                        disabled={!isEditing}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="department" className="flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Département
                      </Label>
                      <Input
                        id="department"
                        value={profileData.department}
                        disabled={true}
                        className=""
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="post" className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Poste
                      </Label>
                      <Input
                        id="post"
                        value={profileData.post}
                        disabled={true}
                        className=""
                      />
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-4">
                      <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" className="btn-primary-official">
                        Sauvegarder les modifications
                      </Button>
                    </div>
                  )}
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Onglet Sécurité */}
          <TabsContent value="securite">
            <div className="space-y-6">
              {/* Changement de mot de passe */}
              <Card className="card-official">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5" />
                    Changer le mot de passe
                  </CardTitle>
                  <CardDescription>
                    Modifiez votre mot de passe pour sécuriser votre compte
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <form onSubmit={handlePasswordSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                      <div className="relative">
                        <Input
                          id="currentPassword"
                          type={showCurrentPassword ? "text" : "password"}
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        >
                          {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          type={showNewPassword ? "text" : "password"}
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        >
                          {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                      <div className="relative">
                        <Input
                          id="confirmPassword"
                          type={showConfirmPassword ? "text" : "password"}
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
                        >
                          {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">
                        Critères pour un mot de passe sécurisé :
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• Au moins 6 caractères</li>
                        <li>• Mélange de lettres et chiffres</li>
                        <li>• Évitez les mots de passe évidents</li>
                      </ul>
                    </div>

                    <Button type="submit" className="btn-primary-official">
                      Changer le mot de passe
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Informations de sécurité */}
              <Card className="card-official">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Informations de sécurité
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-success" />
                      <div>
                        <div className="font-semibold text-success">Compte sécurisé</div>
                        <div className="text-sm text-green-700">Dernière connexion: Aujourd'hui, 14:30</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <div className="font-semibold text-dark mb-1">Niveau d'accès</div>
                      <div className="text-sm text-gray-600">
                        {user.level === 'national' ? 'Accès national complet' : 
                         user.level === 'provincial' ? 'Accès provincial' : 'Accès local'}
                      </div>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <div className="font-semibold text-dark mb-1">Département</div>
                      <div className="text-sm text-gray-600">{user.department}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Onglet Activité */}
          <TabsContent value="activite">
            <Card className="card-official">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Activité récente
                </CardTitle>
                <CardDescription>
                  Historique de vos actions dans le système
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: "Connexion au système", date: "Aujourd'hui à 14:30", status: "success" },
                    { action: "Mise à jour du profil", date: "Hier à 16:45", status: "success" },
                    { action: "Envoi de rapport mensuel", date: "Il y a 2 jours", status: "success" },
                    { action: "Consultation des messages", date: "Il y a 3 jours", status: "info" }
                  ].map((activity, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${
                          activity.status === 'success' ? 'bg-success' : 'bg-primary'
                        }`} />
                        <div>
                          <div className="font-medium text-dark">{activity.action}</div>
                          <div className="text-sm text-gray-600">{activity.date}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
</Tabs>
      </div>
    </div>
  );
}