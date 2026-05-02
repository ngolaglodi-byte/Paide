import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Users, Building, BookOpen, Target, AlertTriangle, CheckCircle,
  Clock, TrendingUp, Calendar, Award, MapPin, Activity, FileText,
  BarChart3, ArrowUp, ArrowDown, UserPlus, UserCheck, UserMinus,
  DollarSign, Inbox, ClipboardList, AlertCircle, Briefcase,
  ChevronRight, Plus, Eye, Zap
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend, AreaChart, Area
} from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import { Link } from 'react-router-dom';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'];

const levelLabels: Record<string, string> = {
  superadmin: 'Super Administrateur',
  ministere: 'Cabinet du Ministre',
  national: 'Coordination Nationale',
  provincial: 'Coordination Provinciale',
  sous_provincial: 'Coordination Sous-Provinciale',
  centre: 'Centre de Formation'
};

const postColors: Record<string, string> = {
  'Super Administrateur': 'bg-gray-700',
  'Ministre': 'bg-purple-600',
  'Secrétaire Général': 'bg-purple-500',
  'Directeur de Cabinet du Ministre': 'bg-purple-400',
  'Comptable ministère': 'bg-violet-500',
  'Plan': 'bg-sky-500',
  'Coordonateur': 'bg-indigo-600',
  'Coordonateur Adjoint': 'bg-indigo-400',
  'Finance': 'bg-amber-600',
  'Formation': 'bg-teal-500',
  'Comptable provincial': 'bg-violet-400',
  'Chef de Centre': 'bg-emerald-600',
  'Chef de Centre Adjoint': 'bg-emerald-500',
  'Secrétaire': 'bg-blue-500',
  'Chargé des Opérations': 'bg-orange-500',
  'Intendant': 'bg-slate-500',
  'Disciplinaire': 'bg-red-500',
};

function formatDate(d?: string) {
  if (!d) return '-';
  try { return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); }
  catch { return '-'; }
}

function timeAgo(d?: string) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return mins + ' min';
  const hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h';
  const days = Math.floor(hours / 24);
  return days + 'j';
}

export default function Dashboard() {
  const { user, token } = useAuth();
  const [stats, setStats] = useState<any>({});
  const [hrStats, setHrStats] = useState<any>({
    total_employees: 0, present_today: 0, on_leave: 0, pending_approvals: 0,
    active_sanctions: 0, pending_evaluations: 0, monthly_trend: [], by_post: []
  });
  const [loading, setLoading] = useState(true);

  const isSecretaire = user?.post === 'Secrétaire';
  const isSuperAdmin = user?.level === 'superadmin';

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    try {
      const headers = { Authorization: 'Bearer ' + token };
      // Dashboard stats
      const statsRes = await fetch('/api/internal/dashboard/stats', { headers });
      if (statsRes.ok) setStats(await statsRes.json());

      // HR stats (if secretaire)
      if (isSecretaire || isSuperAdmin) {
        const [personnel, attendance, leave, approvals, disciplinary, evaluations] = await Promise.all([
          fetch('/api/internal/hr/personnel', { headers }).then(r => r.ok ? r.json() : []),
          fetch('/api/internal/hr/attendance', { headers }).then(r => r.ok ? r.json() : []),
          fetch('/api/internal/hr/leave', { headers }).then(r => r.ok ? r.json() : []),
          fetch('/api/internal/hr/approvals', { headers }).then(r => r.ok ? r.json() : { pending: [] }),
          fetch('/api/internal/hr/disciplinary', { headers }).then(r => r.ok ? r.json() : []),
          fetch('/api/internal/hr/evaluations', { headers }).then(r => r.ok ? r.json() : []),
        ]);

        const today = new Date().toISOString().substring(0, 10);
        const todayAttendance = attendance.filter((a: any) => a.date === today);
        const presentToday = todayAttendance.filter((a: any) => a.status === 'present').length;
        const onLeaveToday = leave.filter((l: any) => {
          if (l.status !== 'approved') return false;
          return l.start_date <= today && l.end_date >= today;
        }).length;

        // Group by post for chart
        const byPost: Record<string, number> = {};
        personnel.forEach((p: any) => {
          byPost[p.post || 'Autre'] = (byPost[p.post || 'Autre'] || 0) + 1;
        });

        setHrStats({
          total_employees: personnel.length,
          present_today: presentToday,
          on_leave: onLeaveToday,
          pending_approvals: (approvals.pending || []).length,
          active_sanctions: disciplinary.filter((d: any) => d.status === 'pending').length,
          pending_evaluations: evaluations.filter((e: any) => e.status === 'draft').length,
          by_post: Object.entries(byPost).map(([name, value]) => ({ name, value })),
          recent_personnel: personnel.slice(0, 5),
          recent_approvals: (approvals.pending || []).slice(0, 5),
        });
      }
    } finally { setLoading(false); }
  };

  const filiereData = (stats.charts?.filieres || []).map((f: any, i: number) => ({
    name: f.name || 'Inconnu', value: f.value || 0, color: COLORS[i % COLORS.length]
  }));

  const monthlyTrend = [
    { month: 'Jan', present: 85, absent: 15 },
    { month: 'Fév', present: 88, absent: 12 },
    { month: 'Mar', present: 92, absent: 8 },
    { month: 'Avr', present: 90, absent: 10 },
  ];

  if (loading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-32 bg-gradient-to-r from-gray-200 to-gray-100 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-gray-100 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-72 bg-gray-100 rounded-xl" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* ═══ HEADER HERO ═══ */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-blue-600 to-purple-700 shadow-xl">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 2px, transparent 2px), radial-gradient(circle at 80% 50%, white 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
        <div className="relative px-8 py-7 text-white">
          <div className="flex items-start justify-between gap-6 flex-wrap">
            <div className="flex items-center gap-5">
              <div className={`w-16 h-16 rounded-2xl ${postColors[user?.post || ''] || 'bg-blue-500'} flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white/20 overflow-hidden`}>
                {(user as any)?.avatar_url ? (
                  <img
                    src={(user as any).avatar_url + '?t=1'}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : null}
                {!(user as any)?.avatar_url && (user?.name || 'U')[0].toUpperCase()}
              </div>
              <div>
                <div className="text-sm text-blue-100 font-medium mb-1">Bonjour {user?.prenom || user?.name} 👋</div>
                <h1 className="text-2xl font-bold tracking-tight">{user?.name} {user?.postnom || ''}</h1>
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur">{user?.post}</Badge>
                  <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur">{levelLabels[user?.level || ''] || user?.level}</Badge>
                  {user?.province && (
                    <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur flex items-center gap-1">
                      <MapPin className="h-3 w-3" />{user.province}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-blue-200 uppercase tracking-wider mb-1">Aujourd'hui</div>
              <div className="text-xl font-semibold">{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</div>
              <div className="text-sm text-blue-100 mt-1">{new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ KPI RH (pour Secrétaire) ═══ */}
      {(isSecretaire || isSuperAdmin) && (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-indigo-600" />Gestion des Employés
              </h2>
              <p className="text-sm text-gray-500">Vue d'ensemble des ressources humaines de votre {levelLabels[user?.level || '']?.toLowerCase() || 'niveau'}</p>
            </div>
            <Link to="/internal/hr/personnel"><Button size="sm" className="bg-indigo-600 hover:bg-indigo-700"><Plus className="h-4 w-4 mr-1" />Nouvel employé</Button></Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Total Employés', value: hrStats.total_employees, icon: Users, color: 'blue', link: '/internal/hr/personnel' },
              { label: 'Présents', value: hrStats.present_today, icon: UserCheck, color: 'green', link: '/internal/hr/attendance' },
              { label: 'En Congé', value: hrStats.on_leave, icon: Calendar, color: 'amber', link: '/internal/hr/leave' },
              { label: 'Approbations', value: hrStats.pending_approvals, icon: AlertCircle, color: 'purple', urgent: hrStats.pending_approvals > 0, link: '/internal/hr/approvals' },
              { label: 'Sanctions', value: hrStats.active_sanctions, icon: AlertTriangle, color: 'red', link: '/internal/hr/disciplinary' },
              { label: 'Évaluations', value: hrStats.pending_evaluations, icon: Target, color: 'indigo', link: '/internal/hr/evaluations' },
            ].map((kpi, i) => {
              const Icon = kpi.icon;
              const colors: Record<string, string> = {
                blue: 'from-blue-500 to-blue-600 text-blue-600 bg-blue-50',
                green: 'from-green-500 to-emerald-600 text-green-600 bg-green-50',
                amber: 'from-amber-500 to-orange-600 text-amber-600 bg-amber-50',
                purple: 'from-purple-500 to-fuchsia-600 text-purple-600 bg-purple-50',
                red: 'from-red-500 to-rose-600 text-red-600 bg-red-50',
                indigo: 'from-indigo-500 to-blue-600 text-indigo-600 bg-indigo-50',
              };
              const [gradient, textClass, bgClass] = colors[kpi.color].split(' text-');
              return (
                <Link key={i} to={kpi.link}>
                  <Card className={`relative overflow-hidden hover:shadow-lg transition-all hover:-translate-y-0.5 cursor-pointer border-0 ${kpi.urgent ? 'ring-2 ring-purple-400' : ''}`}>
                    <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
                    <CardContent className="p-4">
                      <div className={`w-10 h-10 rounded-lg bg-${kpi.color}-50 flex items-center justify-center mb-3`}>
                        <Icon className={`h-5 w-5 text-${kpi.color}-600`} />
                      </div>
                      <div className="text-2xl font-bold text-gray-900">{kpi.value}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{kpi.label}</div>
                      {kpi.urgent && <Badge className="mt-2 bg-purple-100 text-purple-700 text-[10px] px-1.5 py-0">À traiter</Badge>}
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-indigo-600" />Présences mensuelles</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={monthlyTrend}>
                    <defs>
                      <linearGradient id="presentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Area type="monotone" dataKey="present" stroke="#10B981" fill="url(#presentGrad)" strokeWidth={2} name="Présents %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-purple-600" />Par poste</CardTitle>
              </CardHeader>
              <CardContent>
                {hrStats.by_post?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={hrStats.by_post} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                        {hrStats.by_post.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={24} iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[220px] flex flex-col items-center justify-center text-gray-400 gap-2">
                    <Users className="h-10 w-10 opacity-30" />
                    <p className="text-sm">Aucun employé</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Approvals + Recent personnel */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2"><AlertCircle className="h-4 w-4 text-amber-600" />Approbations en attente</CardTitle>
                <Link to="/internal/hr/approvals"><Button size="sm" variant="ghost" className="text-xs">Voir tout <ChevronRight className="h-3 w-3 ml-1" /></Button></Link>
              </CardHeader>
              <CardContent>
                {(hrStats.recent_approvals || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <CheckCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    Aucune approbation en attente
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hrStats.recent_approvals.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                        <div>
                          <div className="text-sm font-medium">{a.module} — {a.action}</div>
                          <div className="text-xs text-gray-500">par {a.requester_name} · {timeAgo(a.created_at)}</div>
                        </div>
                        <Badge className="bg-amber-100 text-amber-800 border-0 text-xs">En attente</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3 flex-row items-center justify-between space-y-0">
                <CardTitle className="text-base flex items-center gap-2"><UserPlus className="h-4 w-4 text-blue-600" />Derniers employés</CardTitle>
                <Link to="/internal/hr/personnel"><Button size="sm" variant="ghost" className="text-xs">Voir tout <ChevronRight className="h-3 w-3 ml-1" /></Button></Link>
              </CardHeader>
              <CardContent>
                {(hrStats.recent_personnel || []).length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-30" />
                    Aucun employé enregistré
                  </div>
                ) : (
                  <div className="space-y-2">
                    {hrStats.recent_personnel.map((p: any) => (
                      <div key={p.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white text-sm font-semibold">{(p.name || '?')[0]}</div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{p.name} {p.postnom || ''}</div>
                          <div className="text-xs text-gray-500 truncate">{p.post} · {p.matricule || 'Sans matricule'}</div>
                        </div>
                        <Badge className={p.status === 'active' ? 'bg-green-100 text-green-700 border-0' : 'bg-gray-100 text-gray-600 border-0'}>{p.status}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* ═══ SECTION MÉTIER (pour tous) ═══ */}
      <div className="flex items-center justify-between mt-8">
        <div>
          <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />Activité {levelLabels[user?.level || '']}
          </h2>
          <p className="text-sm text-gray-500">Informations et activités de votre zone</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Enfants actifs', value: stats.children?.active || 0, total: stats.children?.total || 0, icon: Users, color: 'emerald' },
          { label: 'Centres', value: stats.centers?.active || 0, total: stats.centers?.total || 0, icon: Building, color: 'sky' },
          { label: 'Formations', value: stats.formations?.ongoing || 0, total: stats.formations?.total || 0, icon: BookOpen, color: 'violet' },
          { label: 'Taux de réussite', value: (stats.tauxReussite || 0) + '%', icon: Award, color: 'rose' },
        ].map((k, i) => {
          const Icon = k.icon;
          return (
            <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl bg-${k.color}-100 flex items-center justify-center`}>
                    <Icon className={`h-5 w-5 text-${k.color}-600`} />
                  </div>
                  {k.total !== undefined && (
                    <div className="text-xs text-gray-400">sur {k.total}</div>
                  )}
                </div>
                <div className="text-2xl font-bold text-gray-900">{k.value}</div>
                <div className="text-xs text-gray-500 mt-1">{k.label}</div>
                {k.total !== undefined && typeof k.value === 'number' && k.total > 0 && (
                  <Progress value={(k.value / k.total) * 100} className="mt-3 h-1" />
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-gray-500" />Activités récentes</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats.activities || []).length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                <Activity className="h-10 w-10 mx-auto mb-2 opacity-30" />
                Aucune activité récente
              </div>
            ) : (
              <div className="space-y-2">
                {(stats.activities || []).map((a: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${a.type === 'child' ? 'bg-blue-100 text-blue-600' : a.type === 'formation' ? 'bg-green-100 text-green-600' : 'bg-purple-100 text-purple-600'}`}>
                      {a.type === 'child' ? <Users className="h-4 w-4" /> : a.type === 'formation' ? <BookOpen className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-gray-900 truncate">{a.text}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{timeAgo(a.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-500" />Alertes</CardTitle>
          </CardHeader>
          <CardContent>
            {(stats.alertes || []).length === 0 ? (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-green-50 text-green-800 text-sm">
                <CheckCircle className="h-4 w-4" />
                <span>Tout est en ordre</span>
              </div>
            ) : (
              <div className="space-y-2">
                {(stats.alertes || []).map((a: any, i: number) => {
                  const styles: Record<string, string> = {
                    critical: 'bg-red-50 border-red-200 text-red-900',
                    warning: 'bg-amber-50 border-amber-200 text-amber-900',
                    info: 'bg-blue-50 border-blue-200 text-blue-900',
                    success: 'bg-green-50 border-green-200 text-green-900',
                  };
                  return (
                    <div key={i} className={`p-3 border rounded-lg text-sm ${styles[a.level] || styles.info}`}>
                      {a.text}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
