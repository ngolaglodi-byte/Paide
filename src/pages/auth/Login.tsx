import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, LogIn, Lock, User, Home } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, login } = useAuth();

  // Rediriger si déjà connecté — superadmin vers /superadmin, autres vers profil
  if (user) {
    if (user.level === 'superadmin') {
      return <Navigate to="/superadmin" replace />;
    }
    return <Navigate to="/internal/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);
    
    try {
      const success = await login(email, password);
      if (success) {
        // La redirection sera gérée par le contexte auth
      }
    } catch (error) {
      console.error('Erreur de connexion:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Pas de comptes démo — les comptes sont créés par le SuperAdmin et les Secrétaires

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header simple */}
      <header className="bg-primary text-white">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-secondary rounded-lg flex items-center justify-center">
              <span className="text-dark font-bold">P</span>
            </div>
            <div>
              <div className="text-white font-bold text-lg">PAIDE</div>
              <div className="text-secondary text-xs">Espace Interne</div>
            </div>
          </Link>
          <Button asChild variant="ghost" size="sm" className="text-white hover:text-secondary">
            <Link to="/" className="flex items-center">
              <Home className="h-4 w-4 mr-2" />
              Retour au site
            </Link>
          </Button>
        </div>
      </header>

      {/* Contenu principal */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Formulaire de connexion */}
          <div className="w-full max-w-md mx-auto">
            <Card className="card-official">
              <CardHeader className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-2xl font-bold text-dark">
                  Connexion
                </CardTitle>
                <CardDescription>
                  Accédez à votre espace de travail PAIDE
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Adresse email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="votre@email.cd"
                      required
                      disabled={isLoading}
                      className="h-12"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="flex items-center">
                      <Lock className="h-4 w-4 mr-2" />
                      Mot de passe
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Votre mot de passe"
                        required
                        disabled={isLoading}
                        className="h-12 pr-12"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-primary"
                        disabled={isLoading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                        disabled={isLoading}
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                        Se souvenir de moi
                      </Label>
                    </div>
                    <Link 
                      to="#" 
                      className="text-sm text-primary hover:underline"
                    >
                      Mot de passe oublié ?
                    </Link>
                  </div>

                  <Button 
                    type="submit" 
                    className="btn-primary-official w-full h-12"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      'Connexion...'
                    ) : (
                      <>
                        <LogIn className="h-5 w-5 mr-2" />
                        Se connecter
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-6 text-center">
                  <p className="text-sm text-gray-600">
                    Besoin d'aide ? 
                    <Link to="/contact" className="text-primary hover:underline ml-1">
                      Contactez le support
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Présentation PAIDE */}
          <div>
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-dark mb-4">
                Espace de travail PAIDE
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed">
                Système de gestion intégré pour le Programme d'Appui aux
                Initiatives de Développement de l'Enfant. Accédez à votre
                espace de travail pour gérer les centres, formations,
                rapports et communications.
              </p>
            </div>

            <div className="space-y-4">
              <Card className="card-official border-l-4 border-l-primary">
                <CardContent className="p-6">
                  <h3 className="font-bold text-dark mb-3">5 niveaux hiérarchiques</h3>
                  <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full"></span>Ministère</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full"></span>Coordination Nationale</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full"></span>Coordination Provinciale</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full"></span>Coordination Sous-Provinciale</li>
                    <li className="flex items-center gap-2"><span className="w-2 h-2 bg-primary rounded-full"></span>Centre</li>
                  </ul>
                </CardContent>
              </Card>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-900 mb-2">Accès sécurisé</h4>
                <p className="text-sm text-blue-700">
                  Votre compte est créé par votre Secrétaire de niveau.
                  Contactez votre responsable si vous n'avez pas encore d'identifiants.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer simple */}
      <footer className="bg-dark text-white py-6">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-400">
            © 2024 PAIDE - Programme d'Appui aux Initiatives de Développement de l'Enfant
          </p>
        </div>
      </footer>
    </div>
  );
}
