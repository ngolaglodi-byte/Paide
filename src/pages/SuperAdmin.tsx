import { useState, useEffect } from 'react';
import UserCreatedSheet from '@/components/UserCreatedSheet';
import DevicesPanel from '@/components/DevicesPanel';
import AuditPanel from '@/components/AuditPanel';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { Upload, Save, Settings, Users, Home as HomeIcon, Target, BookOpen, Building2, UserCheck, Handshake, Newspaper, Mail, Trash2, Edit3, Plus, Eye, FileText, LogOut, Globe, Shield, Monitor, Check, XCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { invalidateContentCache } from '@/hooks/usePageContent';

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

interface ContentItem {
  id: number;
  page: string;
  section: string;
  title: string;
  content: string;
  image_url: string;
  order_index: number;
  created_at: string;
  updated_at: string;
}

const sections = [
  { id: 'home', label: 'Accueil', icon: HomeIcon },
  { id: 'mission', label: 'Mission', icon: Target },
  { id: 'formations', label: 'Formations', icon: BookOpen },
  { id: 'centres', label: 'Centres', icon: Building2 },
  { id: 'public-cible', label: 'Public Cible', icon: UserCheck },
  { id: 'partenaires', label: 'Partenaires', icon: Handshake },
  { id: 'actualites', label: 'Actualités', icon: Newspaper },
  { id: 'contact', label: 'Contact', icon: Mail },
  { id: 'users', label: 'Utilisateurs', icon: Users },
  { id: 'settings', label: 'Paramètres', icon: Settings },
  { id: 'devices', label: 'Appareils', icon: Shield },
  { id: 'audit', label: 'Audit Sécurité', icon: Eye }
];

export default function SuperAdmin() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState('home');
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingContent, setEditingContent] = useState<{[key: string]: string}>({});
  const [isCreating, setIsCreating] = useState(false);
  const [newContent, setNewContent] = useState({
    section: '',
    title: '',
    content: '',
    image_url: '',
    order_index: 0
  });

  // Secrétaires management
  const [secretaires, setSecretaires] = useState<any[]>([]);
  const [secForm, setSecForm] = useState({ name: '', postnom: '', prenom: '', post: 'Ministre', level: 'ministere', province: '', sous_province: '', center_id: '' });

  // Postes autorisés pour SuperAdmin: Responsable N°1 + Secrétaire de chaque niveau
  const POSTES_PAR_NIVEAU = {
    ministere: ['Ministre', 'Secrétaire'],
    national: ['Coordonateur', 'Secrétaire'],
    provincial: ['Coordonateur', 'Secrétaire'],
    sous_provincial: ['Coordonateur', 'Secrétaire'],
    centre: ['Chef de Centre', 'Secrétaire'],
  };
  const [secLoading, setSecLoading] = useState(false);
  const [createdUser, setCreatedUser] = useState<any>(null);

  const loadSecretaires = async () => {
    try {
      setSecLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch('/api/internal/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setSecretaires(await res.json());
    } catch {} finally { setSecLoading(false); }
  };

  const createSecretaire = async () => {
    if (!secForm.name) { toast.error('Nom requis'); return; }
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/internal/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(secForm)
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Compte créé avec succès');
        setCreatedUser(data); // Show printable sheet
        setSecForm({ name: '', postnom: '', prenom: '', post: 'Ministre', level: 'ministere', province: '', sous_province: '', center_id: '' });
        loadSecretaires();
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch { toast.error('Erreur de connexion'); }
  };

  const deleteSecretaire = async (id: number) => {
    if (!confirm('Supprimer ce compte ?')) return;
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/internal/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
      toast.success('Supprimé');
      loadSecretaires();
    } catch { toast.error('Erreur'); }
  };

  const resetSecretairePassword = async (id: number, name: string) => {
    if (!confirm(`Réinitialiser le mot de passe de ${name} ?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/internal/users/${id}/reset-password`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        toast.success('Mot de passe réinitialisé');
        setCreatedUser(data);
      } else {
        toast.error(data.message || 'Erreur');
      }
    } catch { toast.error('Erreur'); }
  };

  useEffect(() => {
    if (activeSection === 'users') loadSecretaires();
    else loadContent(activeSection);
  }, [activeSection]);

  const loadContent = async (page: string) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/superadmin/content/${page}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        if (response.status === 403) {
          toast.error('Accès non autorisé. Seuls les super administrateurs peuvent accéder à cette section.');
          return;
        }
        throw new Error('Erreur de chargement');
      }
      const data = await response.json();
      setContent(data);
      
      // Initialize editing state
      const editState: {[key: string]: string} = {};
      data.forEach((item: ContentItem) => {
        editState[`${item.id}_title`] = item.title || '';
        editState[`${item.id}_text`] = item.content || '';
        editState[`${item.id}_image`] = item.image_url || '';
      });
      setEditingContent(editState);
    } catch (error) {
      toast.error('Erreur lors du chargement du contenu');
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleContentChange = (contentId: number, field: string, value: string) => {
    setEditingContent(prev => ({
      ...prev,
      [`${contentId}_${field}`]: value
    }));
  };

  const handleImageUpload = async (contentId: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = localStorage.getItem('token');
      const response = await fetch(`/api/superadmin/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) throw new Error('Erreur d\'upload');
      const data = await response.json();
      const imageUrl = data.imageUrl;

      // Mettre à jour le state local
      handleContentChange(contentId, 'image', imageUrl);

      // Sauvegarder automatiquement l'image_url dans le contenu
      const saveResponse = await fetch(`/api/superadmin/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ image_url: imageUrl })
      });

      if (!saveResponse.ok) throw new Error('Erreur de sauvegarde');
      toast.success('Image uploadée et sauvegardée');
      invalidateContentCache();
      loadContent(activeSection);
    } catch (error) {
      toast.error('Erreur lors de l\'upload de l\'image');
    }
  };

  const saveContent = async (contentId: number) => {
    try {
      const titleValue = editingContent[`${contentId}_title`] || '';
      const textValue = editingContent[`${contentId}_text`] || '';
      const imageValue = editingContent[`${contentId}_image`] || '';
      const token = localStorage.getItem('token');

      const response = await fetch(`/api/superadmin/content/${contentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: titleValue,
          content: textValue,
          image_url: imageValue
        })
      });

      if (!response.ok) throw new Error('Erreur de sauvegarde');
      toast.success('Contenu sauvegardé avec succès');
      invalidateContentCache();
      loadContent(activeSection);
    } catch (error) {
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  const deleteContent = async (contentId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce contenu ?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/superadmin/content/${contentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Erreur de suppression');
      toast.success('Contenu supprimé avec succès');
      loadContent(activeSection);
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const createContent = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/superadmin/content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          page: activeSection,
          section: newContent.section,
          title: newContent.title,
          content: newContent.content,
          image_url: newContent.image_url,
          order_index: newContent.order_index
        })
      });

      if (!response.ok) throw new Error('Erreur de création');
      toast.success('Contenu créé avec succès');
      invalidateContentCache();
      setNewContent({
        section: '',
        title: '',
        content: '',
        image_url: '',
        order_index: 0
      });
      setIsCreating(false);
      loadContent(activeSection);
    } catch (error) {
      toast.error('Erreur lors de la création');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {createdUser && <UserCreatedSheet user={createdUser} onClose={() => setCreatedUser(null)} />}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className="w-64 bg-background shadow-lg">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-primary mb-2">Super Admin</h1>
            <p className="text-sm text-gray-600">Gestion du contenu</p>
          </div>
          
          <nav className="px-4 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    activeSection === section.id
                      ? 'bg-primary text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {section.label}
                </button>
              );
            })}
          </nav>

          <div className="mt-auto p-4 border-t space-y-2">
            <button
              onClick={() => navigate('/')}
              className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Globe className="w-5 h-5 mr-3" />
              Voir le site
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-3" />
              Se déconnecter
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="bg-background shadow-sm border-b p-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  {sections.find(s => s.id === activeSection)?.label}
                </h2>
                <p className="text-gray-600">Gérez le contenu de cette page</p>
              </div>
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-primary text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nouveau contenu
              </Button>
            </div>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
            {activeSection === 'audit' ? (
              <AuditPanel />
            ) : activeSection === 'devices' ? (
              <DevicesPanel />
            ) : activeSection === 'users' ? (
              /* ── SECRÉTAIRES PANEL ── */
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Créer un compte (Responsable N°1 ou Secrétaire)</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Nom</label>
                        <Input value={secForm.name} onChange={e => setSecForm(p => ({...p, name: e.target.value}))} placeholder="Nom" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Postnom</label>
                        <Input value={secForm.postnom} onChange={e => setSecForm(p => ({...p, postnom: e.target.value}))} placeholder="Postnom" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Prénom</label>
                        <Input value={secForm.prenom} onChange={e => setSecForm(p => ({...p, prenom: e.target.value}))} placeholder="Prénom" />
                      </div>
                      <div className="col-span-2 bg-blue-50 rounded p-2 text-xs text-blue-700">
                        L'email et le mot de passe seront générés automatiquement
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Niveau</label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm" value={secForm.level} onChange={e => {
                          const lvl = e.target.value;
                          const defaultPost = (POSTES_PAR_NIVEAU as any)[lvl]?.[0] || '';
                          setSecForm(p => ({...p, level: lvl, post: defaultPost}));
                        }}>
                          <option value="ministere">Ministère</option>
                          <option value="national">Coordination Nationale</option>
                          <option value="provincial">Coordination Provinciale</option>
                          <option value="sous_provincial">Coordination Sous-Provinciale</option>
                          <option value="centre">Centre</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Poste</label>
                        <select className="w-full border rounded-md px-3 py-2 text-sm" value={secForm.post} onChange={e => setSecForm(p => ({...p, post: e.target.value}))}>
                          {((POSTES_PAR_NIVEAU as any)[secForm.level] || []).map((p: string) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </select>
                      </div>
                      {(secForm.level === 'provincial' || secForm.level === 'sous_provincial' || secForm.level === 'centre') && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Province</label>
                          <Input value={secForm.province} onChange={e => setSecForm(p => ({...p, province: e.target.value}))} placeholder="Ex: Kinshasa" />
                        </div>
                      )}
                      {(secForm.level === 'sous_provincial' || secForm.level === 'centre') && (
                        <div>
                          <label className="block text-sm font-medium mb-1">Sous-province</label>
                          <Input value={secForm.sous_province} onChange={e => setSecForm(p => ({...p, sous_province: e.target.value}))} placeholder="Ex: Kinshasa-Ouest" />
                        </div>
                      )}
                      {secForm.level === 'centre' && (
                        <div>
                          <label className="block text-sm font-medium mb-1">ID Centre</label>
                          <Input type="number" value={secForm.center_id} onChange={e => setSecForm(p => ({...p, center_id: e.target.value}))} placeholder="1" />
                        </div>
                      )}
                    </div>
                    <Button onClick={createSecretaire} className="bg-primary text-white">
                      <Plus className="w-4 h-4 mr-2" /> Créer le compte
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Comptes créés ({secretaires.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {secLoading ? <p>Chargement...</p> : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Nom</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Poste</TableHead>
                            <TableHead>Niveau</TableHead>
                            <TableHead>Province</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {secretaires.map((s: any) => (
                            <TableRow key={s.id}>
                              <TableCell>{s.name} {s.postnom || ''}</TableCell>
                              <TableCell>{s.email}</TableCell>
                              <TableCell>{s.post || '-'}</TableCell>
                              <TableCell className="capitalize">{s.level?.replace('_', ' ')}</TableCell>
                              <TableCell>{s.province || '-'} {s.sous_province ? `/ ${s.sous_province}` : ''}</TableCell>
                              <TableCell>
                                <Button size="sm" variant="outline" className="mr-2" onClick={() => resetSecretairePassword(s.id, s.name)}>Réinitialiser MDP</Button>
                                <Button size="sm" variant="destructive" onClick={() => deleteSecretaire(s.id)}>Supprimer</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {secretaires.length === 0 && (
                            <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Aucun compte créé</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-gray-500">Chargement...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Formulaire de création */}
                {isCreating && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Plus className="w-5 h-5 mr-2" />
                        Nouveau contenu
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium mb-2">Section</label>
                          <Input
                            value={newContent.section}
                            onChange={(e) => setNewContent(prev => ({ ...prev, section: e.target.value }))}
                            placeholder="Nom de la section (ex: hero, intro)"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Titre</label>
                          <Input
                            value={newContent.title}
                            onChange={(e) => setNewContent(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Titre du contenu"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">Contenu</label>
                        <Textarea
                          value={newContent.content}
                          onChange={(e) => setNewContent(prev => ({ ...prev, content: e.target.value }))}
                          rows={4}
                          placeholder="Saisissez le contenu"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium mb-2">URL de l'image (optionnel)</label>
                        <Input
                          value={newContent.image_url}
                          onChange={(e) => setNewContent(prev => ({ ...prev, image_url: e.target.value }))}
                          placeholder="https://exemple.com/image.jpg"
                        />
                      </div>
                      
                      <div className="flex justify-end space-x-3">
                        <Button
                          variant="outline"
                          onClick={() => setIsCreating(false)}
                        >
                          Annuler
                        </Button>
                        <Button
                          onClick={createContent}
                          className="bg-primary text-white"
                        >
                          <Save className="w-4 h-4 mr-2" />
                          Créer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Liste du contenu */}
                {content.length === 0 ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-muted-foreground text-lg mb-2">Aucun contenu trouvé</p>
                      <p className="text-sm text-gray-400 mb-4">
                        Créez du nouveau contenu pour cette page
                      </p>
                      <Button
                        onClick={() => setIsCreating(true)}
                        className="bg-primary text-white"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Créer du contenu
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardHeader>
                      <CardTitle>Contenu existant</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Section</TableHead>
                            <TableHead>Titre</TableHead>
                            <TableHead>Contenu</TableHead>
                            <TableHead>Image</TableHead>
                            <TableHead>Dernière modif.</TableHead>
                            <TableHead>Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {content.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">
                                {item.section}
                              </TableCell>
                              <TableCell className="max-w-[150px]">
                                <Input
                                  value={editingContent[`${item.id}_title`] || ''}
                                  onChange={(e) => handleContentChange(item.id, 'title', e.target.value)}
                                  className="text-sm"
                                />
                              </TableCell>
                              <TableCell className="max-w-xs">
                                <Textarea
                                  value={editingContent[`${item.id}_text`] || ''}
                                  onChange={(e) => handleContentChange(item.id, 'text', e.target.value)}
                                  rows={2}
                                  className="text-sm"
                                />
                              </TableCell>
                              <TableCell className="max-w-[200px]">
                                <div className="space-y-2">
                                  {editingContent[`${item.id}_image`] && (
                                    <img
                                      src={editingContent[`${item.id}_image`]}
                                      alt="Preview"
                                      className="w-16 h-16 object-cover rounded"
                                    />
                                  )}
                                  <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                      const file = e.target.files?.[0];
                                      if (file) handleImageUpload(item.id, file);
                                    }}
                                    className="text-xs"
                                  />
                                  <Input
                                    value={editingContent[`${item.id}_image`] || ''}
                                    onChange={(e) => handleContentChange(item.id, 'image', e.target.value)}
                                    placeholder="URL de l'image"
                                    className="text-xs"
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-gray-500">
                                {new Date(item.updated_at).toLocaleDateString('fr-FR')}
                              </TableCell>
                              <TableCell>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => saveContent(item.id)}
                                    className="bg-green-600 text-white"
                                  >
                                    <Save className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => deleteContent(item.id)}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}