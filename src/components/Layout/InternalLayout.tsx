import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard,
  Users,
  User,
  Building,
  BookOpen,
  Mail,
  FileText,
  UserCog,
  Menu,
  X,
  LogOut,
  Bell,
  Shield,
  Inbox,
  Upload,
  Target,
  DollarSign,
  Calendar,
  Heart,
  UserCheck,
  MessageCircle,
  FolderOpen,
  Settings,
  Clock,
  Briefcase,
  Network,
  CalendarDays,
  Video,
  Library,
  Activity,
  Wallet,
  CheckSquare,
  BarChart3,
  Receipt,
  ClipboardList,
  FileBadge,
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface InternalLayoutProps {
  children: React.ReactNode;
}

export default function InternalLayout({ children }: InternalLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Configuration des liens par poste
  const getMenuItems = () => {
    if (user?.level === 'superadmin') {
      return [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/users', label: 'Utilisateurs', icon: Users },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/centers', label: 'Centres', icon: Building },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/decisions', label: 'Décisions', icon: Shield },
        { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
        { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/notifications', label: 'Notifications', icon: Bell },
        { path: '/superadmin', label: 'Gestion Contenu Public', icon: Settings }
      ];
    }

    const roleBasedItems: { [key: string]: any[] } = {
      // ═══ NIVEAU MINISTÈRE ═══
      'Ministre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/decisions', label: 'Décisions', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        { path: '/internal/hr/approvals', label: 'RH — Approbations', icon: Shield }
      ],
      'Secrétaire Général': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/hr/approvals', label: 'RH — Approbations', icon: Shield },
        { path: '/internal/finance/reports', label: 'Rapports financiers', icon: BarChart3 },
        { path: '/internal/decisions', label: 'Décisions', icon: Shield },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Directeur de Cabinet du Ministre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/decisions', label: 'Décisions', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Comptable ministère': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Finance (lecture)', icon: Wallet, children: [
          { path: '/internal/finance/budget', label: 'Budget', icon: Wallet },
          { path: '/internal/finance/expenses', label: 'Dépenses', icon: Receipt },
          { path: '/internal/finance/invoices', label: 'Factures', icon: FileText },
          { path: '/internal/finance/reports', label: 'Rapports', icon: BarChart3 },
        ]},
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Plan': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ FINANCE (National uniquement) ═══
      'Finance': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Finance', icon: Wallet, children: [
          { path: '/internal/finance/budget', label: 'Budget', icon: Wallet },
          { path: '/internal/finance/expenses', label: 'Dépenses', icon: Receipt },
          { path: '/internal/finance/invoices', label: 'Factures', icon: FileText },
          { path: '/internal/finance/reports', label: 'Rapports', icon: BarChart3 },
        ]},
        { section: 'Administration', icon: Inbox, children: [
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
          { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
        ]},
      ],
      'Formation': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/formateurs', label: 'Formateurs', icon: UserCheck },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/statistiques', label: 'Statistiques', icon: Target },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Coordonateur Adjoint': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/hr/approvals', label: 'RH — Approbations', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Comptable provincial': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Finance (lecture)', icon: Wallet, children: [
          { path: '/internal/finance/budget', label: 'Budget', icon: Wallet },
          { path: '/internal/finance/expenses', label: 'Dépenses', icon: Receipt },
          { path: '/internal/finance/reports', label: 'Rapports', icon: BarChart3 },
        ]},
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ NIVEAU CENTRE ═══
      'Chef de Centre': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/personnel', label: 'Personnel', icon: Users },
        { path: '/internal/equipement', label: 'Équipement', icon: Building },
        { path: '/internal/discipline', label: 'Discipline', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        { path: '/internal/hr/approvals', label: 'RH — Approbations', icon: Shield }
      ],
      'Chef de Centre Adjoint': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/formations', label: 'Formations', icon: BookOpen },
        { path: '/internal/personnel', label: 'Personnel', icon: Users },
        { path: '/internal/equipement', label: 'Équipement', icon: Building },
        { path: '/internal/discipline', label: 'Discipline', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Chargé des Opérations': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/journal', label: 'Journal', icon: Calendar },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Intendant': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/equipement', label: 'Équipement', icon: Building },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],
      'Disciplinaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/discipline', label: 'Discipline', icon: Shield },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle }
      ],

      // ═══ SECRÉTAIRE (tous niveaux) ═══
      'Secrétaire': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { section: 'Gestion des Employés', icon: Briefcase, children: [
          { path: '/internal/hr/personnel', label: 'Personnel', icon: UserCheck },
          { path: '/internal/hr/organigram', label: 'Organigramme', icon: Network },
          { path: '/internal/hr/attendance', label: 'Présences', icon: Clock },
          { path: '/internal/hr/leave', label: 'Congés', icon: Calendar },
          { path: '/internal/hr/evaluations', label: 'Évaluations', icon: Target },
          { path: '/internal/hr/trainings', label: 'Formations', icon: BookOpen },
          { path: '/internal/hr/disciplinary', label: 'Discipline', icon: Shield },
        ]},
        { section: 'Collaboration', icon: Activity, children: [
          { path: '/internal/hr/agenda', label: 'Agenda', icon: CalendarDays },
          { path: '/internal/hr/meetings', label: 'Réunions', icon: Video },
          { path: '/internal/hr/resources', label: 'Ressources', icon: Library },
        ]},
        { section: 'Administration', icon: Inbox, children: [
          { path: '/internal/courrier', label: 'Courrier', icon: Inbox },
          { path: '/internal/documents', label: 'Documents', icon: FolderOpen },
          { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        ]},
      ],

      // ═══ DEFAULT ═══
      'default': [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        { path: '/internal/reports', label: 'Rapports', icon: FileText }
      ]
    };

    // ─── LEVEL-AWARE MATCHING pour les Coordonateurs ───
    // Un Coordonateur national/provincial/sous-provincial a des menus différents
    // On utilise le post + level pour déterminer le bon menu
    let items;
    const post = user?.post || 'default';
    const level = user?.level || '';

    if (post === 'Coordonateur') {
      // Menu Coordonateur adapté par niveau
      const coordMenu = [
        { path: '/internal/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { path: '/internal/centers', label: 'Centres', icon: Building },
        { path: '/internal/children', label: 'Enfants', icon: UserCheck },
      ];
      if (level === 'national') {
        coordMenu.push({ path: '/internal/formations', label: 'Formations', icon: BookOpen });
      }
      coordMenu.push(
        { path: '/internal/decisions', label: 'Décisions', icon: Shield },
        { path: '/internal/reports', label: 'Rapports', icon: FileText },
        { path: '/internal/messaging', label: 'Messages', icon: MessageCircle },
        { path: '/internal/hr/approvals', label: 'RH — Approbations', icon: Shield }
      );
      items = [...coordMenu];
    } else {
      items = [...(roleBasedItems[post] || roleBasedItems['default'])];
    }

    // Mécanisation: uniquement pour le Secrétaire national
    if (post === 'Secrétaire' && level === 'national') {
      const hrSection = items.find((it: any) => it.section === 'Gestion des Employés');
      const mecLink = { path: '/internal/hr/mecanisation', label: 'Mécanisation', icon: FileBadge };
      if (hrSection && hrSection.children) {
        if (!hrSection.children.some((c: any) => c.path === '/internal/hr/mecanisation')) {
          hrSection.children.push(mecLink);
        }
      } else {
        items.push(mecLink);
      }
    }

    return items;
  };

  const menuItems = getMenuItems();

  // Items communs en bas de menu (sauf si déjà inclus dans le menu principal)
  const commonItems = [
    { path: '/internal/notifications', label: 'Notifications', icon: Bell, hasNotification: true },
    { path: '/internal/profile', label: 'Mon Profil', icon: UserCog }
  ].filter(item => !menuItems.some(menuItem => menuItem.path === item.path));

  const isActiveLink = (path: string) => {
    return location.pathname === path;
  };

  const renderSidebarContent = () => (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <Link to="/" className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <div>
            <div className="text-primary font-bold text-lg">PAIDE</div>
            <div className="text-xs text-gray-600">Espace Interne</div>
          </div>
        </Link>
      </div>

      {/* Navigation principale */}
      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {menuItems.map((item: any, idx: number) => {
          // Section with children (grouped menu)
          if (item.children) {
            const SectionIcon = item.icon;
            return (
              <div key={idx} className="pt-3 first:pt-0">
                <div className="px-3 py-1 flex items-center gap-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  <SectionIcon className="w-3.5 h-3.5" />
                  {item.section}
                </div>
                <div className="mt-1 space-y-0.5">
                  {item.children.map((sub: any) => {
                    const SubIcon = sub.icon;
                    return (
                      <Link
                        key={sub.path}
                        to={sub.path}
                        onClick={() => setSidebarOpen(false)}
                        className={`flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                          isActiveLink(sub.path)
                            ? 'bg-indigo-50 text-indigo-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        }`}
                      >
                        <SubIcon className="w-4 h-4 mr-3" />
                        {sub.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          }
          // Normal item
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActiveLink(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Section commune */}
      <div className="px-4 py-4 space-y-1 border-t border-gray-200">
        {commonItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActiveLink(item.path)
                  ? 'bg-primary text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <Icon className="w-5 h-5 mr-3" />
              {item.label}
              {item.hasNotification && (
                <Badge className="bg-red-500 text-white text-xs ml-auto">3</Badge>
              )}
            </Link>
          );
        })}
      </div>

      {/* Section utilisateur */}
      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
            {(user as any)?.avatar_url ? (
              <img
                src={(user as any).avatar_url + '?t=1'}
                alt=""
                className="w-full h-full object-cover"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            {!(user as any)?.avatar_url && <User className="w-5 h-5 text-gray-600" />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 truncate">
              {user?.name} {user?.postnom || ''}
            </div>
            <div className="text-xs text-gray-500 truncate">
              {user?.post}
            </div>
            {user?.province && (
              <div className="text-xs text-gray-400 truncate">
                {user.province}
              </div>
            )}
          </div>
        </div>
        
        <Button
          onClick={handleLogout}
          variant="outline"
          size="sm"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex bg-gray-50">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-1 min-h-0 border-r border-gray-200">
          {renderSidebarContent()}
        </div>
      </div>

      {/* Mobile menu button */}
      <div className="lg:hidden">
        <div className="flex items-center justify-between p-4 bg-white border-b border-gray-200">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">P</span>
            </div>
            <span className="text-primary font-bold">PAIDE</span>
          </Link>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50 flex">
            <div
              className="fixed inset-0 bg-black opacity-50"
              onClick={() => setSidebarOpen(false)}
            />
            <div className="relative flex flex-col flex-1 w-64 max-w-xs bg-white">
              {renderSidebarContent()}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:ml-64">
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
        <footer className="lg:ml-0 py-3 px-6 text-center text-xs text-gray-400 border-t bg-white">
          © 2024 PAIDE — Programme d'Appui aux Initiatives de Développement de l'Enfant
        </footer>
      </div>
    </div>
  );
}