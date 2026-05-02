import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const isSuperAdmin = user?.level === 'superadmin';

  return (
    <header className="nav-primary sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo et titre */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center">
              <span className="text-primary-600 font-bold text-xl">P</span>
            </div>
            <div>
              <h1 className="text-white font-bold text-lg">PAIDE</h1>
              <p className="text-blue-200 text-xs">Former pour transformer</p>
            </div>
          </Link>

          {/* Navigation desktop */}
          <nav className="hidden md:flex space-x-8">
            <Link
              to="/"
              className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary'
              }`}
            >
              Accueil
            </Link>
            <Link
              to="/mission"
              className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/mission') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary'
              }`}
            >
              Mission
            </Link>
            <Link
              to="/formations"
              className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/formations') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary'
              }`}
            >
              Formations
            </Link>
            <Link
              to="/centres"
              className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/centres') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary'
              }`}
            >
              Centres
            </Link>
            <Link
              to="/public-cible"
              className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/public-cible') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary'
              }`}
            >
              Public Cible
            </Link>
            <Link
              to="/partenaires"
              className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/partenaires') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary'
              }`}
            >
              Partenaires
            </Link>
            <Link
              to="/actualites"
              className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/actualites') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary'
              }`}
            >
              Actualités
            </Link>
            <Link
              to="/contact"
              className={`nav-link px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/contact') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary'
              }`}
            >
              Contact
            </Link>
          </nav>

          {/* Actions utilisateur */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {isSuperAdmin && (
                  <Link
                    to="/superadmin"
                    className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                      isActive('/superadmin')
                        ? 'bg-yellow-500 text-black'
                        : 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40'
                    }`}
                  >
                    <Shield className="w-4 h-4" />
                    <span>Super Admin</span>
                  </Link>
                )}
                <Link
                  to="/internal/profile"
                  className="flex items-center space-x-2 text-white hover:text-secondary transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm">{user.name}</span>
                </Link>
                <Button
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-white hover:text-secondary hover:bg-white/10"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
            ) : (
              <Link
                to="/login"
                className="btn-secondary-official text-sm px-4 py-2"
              >
                Espace Interne
              </Link>
            )}
          </div>

          {/* Menu mobile */}
          <div className="md:hidden">
            <Button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              variant="ghost"
              size="sm"
              className="text-white hover:text-secondary"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </Button>
          </div>
        </div>

        {/* Menu mobile ouvert */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-primary-600/95 backdrop-blur-sm rounded-lg mt-2">
              <Link
                to="/"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Accueil
              </Link>
              <Link
                to="/mission"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/mission') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Mission
              </Link>
              <Link
                to="/formations"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/formations') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Formations
              </Link>
              <Link
                to="/centres"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/centres') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Centres
              </Link>
              <Link
                to="/public-cible"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/public-cible') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Public Cible
              </Link>
              <Link
                to="/partenaires"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/partenaires') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Partenaires
              </Link>
              <Link
                to="/actualites"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/actualites') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Actualités
              </Link>
              <Link
                to="/contact"
                className={`block px-3 py-2 rounded-md text-base font-medium ${
                  isActive('/contact') ? 'text-secondary bg-white/10' : 'text-white hover:text-secondary hover:bg-white/10'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                Contact
              </Link>
              
              {user ? (
                <div className="border-t border-white/20 pt-3 mt-3">
                  {isSuperAdmin && (
                    <Link
                      to="/superadmin"
                      className="flex items-center space-x-2 px-3 py-2 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40 rounded-md mb-2"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Shield className="w-4 h-4" />
                      <span className="font-medium">Super Admin</span>
                    </Link>
                  )}
                  <Link
                    to="/internal/profile"
                    className="flex items-center space-x-2 px-3 py-2 text-white hover:text-secondary hover:bg-white/10 rounded-md"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    <span>{user.name}</span>
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-2 w-full text-left px-3 py-2 text-white hover:text-secondary hover:bg-white/10 rounded-md"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Se déconnecter</span>
                  </button>
                </div>
              ) : (
                <div className="border-t border-white/20 pt-3 mt-3">
                  <Link
                    to="/login"
                    className="block px-3 py-2 text-center bg-secondary text-dark font-medium rounded-md hover:bg-secondary/90 transition-colors"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Espace Interne
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
