import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Network, Users, ChevronDown, ChevronRight } from 'lucide-react';

const postColors: Record<string,string> = {
  'Ministre': 'bg-purple-600',
  'Secrétaire Général': 'bg-purple-500',
  'Directeur de Cabinet du Ministre': 'bg-purple-400',
  'Coordonateur': 'bg-indigo-600',
  'Coordonateur Adjoint': 'bg-indigo-400',
  'Finance': 'bg-amber-600',
  'Comptable ministère': 'bg-violet-500',
  'Comptable provincial': 'bg-violet-400',
  'Plan': 'bg-sky-500',
  'Formation': 'bg-teal-500',
  'Chef de Centre': 'bg-emerald-600',
  'Chef de Centre Adjoint': 'bg-emerald-500',
  'Secrétaire': 'bg-blue-500',
  'Chargé des Opérations': 'bg-orange-500',
  'Intendant': 'bg-slate-500',
  'Disciplinaire': 'bg-red-500',
};

function PersonCard({ person }: { person: any }) {
  const color = postColors[person.post] || 'bg-gray-500';
  return (
    <div className="bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all p-4 min-w-[220px]">
      <div className="flex items-start gap-3">
        <div className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white font-bold shrink-0 shadow overflow-hidden`}>
          {person.avatar_url ? (
            <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            (person.name || '?')[0].toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-sm text-gray-900 truncate">{person.name} {person.postnom || ''}</div>
          <div className="text-xs text-gray-500 truncate">{person.post}</div>
          {person.province && <Badge className="mt-1 bg-gray-100 text-gray-700 border-0 text-[10px]">{person.province}</Badge>}
        </div>
      </div>
    </div>
  );
}

export default function Organigram() {
  const { token } = useAuth();
  const [data, setData] = useState<any>({ byPost: {}, order: [] });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch('/api/internal/hr/organigram', { headers: { Authorization: 'Bearer ' + token } })
      .then(r => r.ok ? r.json() : { byPost: {}, order: [] })
      .then(d => { setData(d); const e: any = {}; Object.keys(d.byPost).forEach(k => e[k] = true); setExpanded(e); setLoading(false); });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900">
          <Network className="h-7 w-7 text-indigo-600" />Organigramme
        </h1>
        <p className="text-sm text-gray-500">Structure hiérarchique de votre organisation</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">Chargement...</div>
      ) : Object.keys(data.byPost).length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Aucun employé enregistré</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {(data.order || []).filter((post: string) => data.byPost[post]).map((post: string) => {
            const people = data.byPost[post];
            const color = postColors[post] || 'bg-gray-500';
            const isOpen = expanded[post] !== false;
            return (
              <Card key={post} className="border-0 shadow-sm overflow-hidden">
                <button onClick={() => setExpanded({...expanded, [post]: !isOpen})} className="w-full">
                  <div className={`${color} text-white px-5 py-3 flex items-center justify-between`}>
                    <div className="flex items-center gap-3">
                      {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      <span className="font-semibold">{post}</span>
                      <Badge className="bg-white/20 text-white border-0 text-xs">{people.length}</Badge>
                    </div>
                  </div>
                </button>
                {isOpen && (
                  <CardContent className="p-4 bg-gray-50">
                    <div className="flex flex-wrap gap-3">
                      {people.map((p: any) => <PersonCard key={p.id} person={p} />)}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
