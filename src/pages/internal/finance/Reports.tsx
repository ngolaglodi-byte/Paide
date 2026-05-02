import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899'];

export default function FinanceReports() {
  const { token } = useAuth();
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/internal/finance/reports', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : {})
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-16 text-center text-gray-400">Chargement...</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-7 w-7 text-indigo-600" />Rapports financiers</h1>
        <p className="text-sm text-gray-500">Synthèse des dépenses opérationnelles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-5">
            <DollarSign className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">Budget total</div>
            <div className="text-2xl font-bold mt-1">{(data.totalBudget || 0).toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-500 to-rose-600 text-white">
          <CardContent className="p-5">
            <TrendingUp className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">Dépensé</div>
            <div className="text-2xl font-bold mt-1">{(data.totalSpent || 0).toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-green-500 to-emerald-600 text-white">
          <CardContent className="p-5">
            <DollarSign className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">Reste</div>
            <div className="text-2xl font-bold mt-1">{(data.remaining || 0).toLocaleString('fr-FR')} FC</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-500 to-orange-600 text-white">
          <CardContent className="p-5">
            <AlertCircle className="h-6 w-6 opacity-80 mb-2" />
            <div className="text-xs opacity-90">À traiter</div>
            <div className="text-2xl font-bold mt-1">{(data.pendingExpenses || 0) + (data.unpaidInvoices || 0)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Dépenses par catégorie</CardTitle></CardHeader>
          <CardContent>
            {(data.byCategory || []).length === 0 ? <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div> :
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={data.byCategory} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="total" label={({ category }: any) => category}>
                  {data.byCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => v.toLocaleString('fr-FR') + ' FC'} />
              </PieChart>
            </ResponsiveContainer>}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm">
          <CardHeader><CardTitle className="text-base">Évolution mensuelle</CardTitle></CardHeader>
          <CardContent>
            {(data.monthlyExpenses || []).length === 0 ? <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Aucune donnée</div> :
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.monthlyExpenses}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => v.toLocaleString('fr-FR') + ' FC'} />
                <Bar dataKey="total" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
