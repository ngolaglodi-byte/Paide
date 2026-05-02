const fs = require("fs");

// ====== 1. FIX SERVER — Add messaging contacts route with hierarchy ======
let server = fs.readFileSync("/app/server.js", "utf8");

// Add a new route for messaging contacts (organized by hierarchy)
// Insert before the existing GET /api/internal/messages route
const msgRoute = `
// Contacts pour la messagerie — organisés par hiérarchie
app.get('/api/internal/messages/contacts', authenticateToken, (req, res) => {
  try {
    const me = req.user;
    const levels = ['ministere', 'national', 'provincial', 'sous_provincial', 'centre'];
    const myIndex = levels.indexOf(me.level);
    
    // Tous les utilisateurs sauf moi
    const allUsers = db.prepare(
      'SELECT id, name, postnom, email, level, post, province, sous_province, center_id FROM users WHERE id != ? AND status = ? ORDER BY level, post, name'
    ).all(me.id, 'active');
    
    // Organiser par catégorie
    const contacts = {
      hierarchy_up: [],    // Supérieurs hiérarchiques
      same_level: [],      // Même niveau (pairs)
      hierarchy_down: [],  // Subordonnés
    };
    
    allUsers.forEach(u => {
      const uIndex = levels.indexOf(u.level);
      if (uIndex < myIndex) {
        contacts.hierarchy_up.push({ ...u, category: 'Hiérarchie supérieure' });
      } else if (uIndex === myIndex) {
        contacts.same_level.push({ ...u, category: 'Même niveau' });
      } else {
        // Subordonnés — filtrer par province/zone si applicable
        if (me.level === 'provincial' && u.province && u.province !== me.province) {
          return; // Coord Provincial ne voit que sa province en dessous
        }
        if (me.level === 'sous_provincial' && u.level === 'centre') {
          // Ne montrer que les centres de sa sous-province
          if (u.sous_province && u.sous_province !== me.sous_province) return;
        }
        contacts.hierarchy_down.push({ ...u, category: 'Niveau inférieur' });
      }
    });
    
    // SuperAdmin et Ministère voient tout
    if (me.level === 'superadmin' || me.level === 'ministere') {
      res.json(allUsers.map(u => ({ ...u, category: levels.indexOf(u.level) <= levels.indexOf(me.level) ? 'Même niveau' : 'Niveau inférieur' })));
      return;
    }
    
    const result = [
      ...contacts.hierarchy_up,
      ...contacts.same_level,
      ...contacts.hierarchy_down
    ];
    
    res.json(result);
  } catch (error) {
    console.error('Erreur contacts:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// Messages envoyés et reçus
`;

// Replace the simple GET /api/internal/messages with both routes
server = server.replace(
  "app.get('/api/internal/messages', authenticateToken, (req, res) => {\n  try {\n    const messages = db.prepare('SELECT m.*, u.name as sender_name FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.receiver_id = ? ORDER BY m.created_at DESC').all(req.user.id);\n    res.json(messages);\n  } catch (error) {\n    res.status(500).json({ message: 'Erreur serveur' });\n  }\n});",
  msgRoute + `app.get('/api/internal/messages', authenticateToken, (req, res) => {
  try {
    // Retourne les messages envoyés ET reçus par l'utilisateur
    const messages = db.prepare(
      'SELECT m.*, s.name as sender_name, s.postnom as sender_postnom, s.post as sender_post, r.name as receiver_name, r.postnom as receiver_postnom, r.post as receiver_post FROM messages m JOIN users s ON m.sender_id = s.id JOIN users r ON m.receiver_id = r.id WHERE m.sender_id = ? OR m.receiver_id = ? ORDER BY m.created_at ASC'
    ).all(req.user.id, req.user.id);
    res.json(messages);
  } catch (error) {
    console.error('Erreur messages:', error.message);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});`
);

fs.writeFileSync("/app/server.js", server);
fs.copyFileSync("/app/server.js", "/app/server.cjs");

try {
  require("child_process").execSync("node --check /app/server.cjs", { encoding: "utf8" });
  console.log("SERVER SYNTAX OK");
} catch (e) {
  console.log("SYNTAX ERROR: " + e.stderr.split("\n").slice(0, 3).join(" "));
  process.exit(1);
}

// ====== 2. FIX FRONTEND — Messaging.tsx with hierarchy contacts ======
const messaging = `import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Search, MessageCircle, Users, ChevronUp, ChevronDown, Building } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface User { id: number; name: string; postnom?: string; email: string; level: string; post: string; province?: string; category?: string; }
interface Message { id: number; sender_id: number; receiver_id: number; content: string; sender_name: string; sender_postnom?: string; sender_post?: string; receiver_name: string; receiver_postnom?: string; receiver_post?: string; read: number; created_at: string; }

const levelLabels: Record<string, string> = {
  superadmin: 'Administration', ministere: 'Ministère', national: 'National',
  provincial: 'Provincial', sous_provincial: 'Sous-Provincial', centre: 'Centre'
};

const categoryIcons: Record<string, any> = {
  'Hiérarchie supérieure': ChevronUp,
  'Même niveau': Users,
  'Niveau inférieur': ChevronDown,
};

export default function Messaging() {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [contacts, setContacts] = useState<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<any>(null);

  const headers = useCallback(() => ({
    'Authorization': \`Bearer \${token}\`,
    'Content-Type': 'application/json',
  }), [token]);

  const loadContacts = useCallback(async () => {
    try {
      const res = await fetch('/api/internal/messages/contacts', { headers: headers() });
      if (!res.ok) {
        // Fallback to /api/internal/users if contacts route not available
        const res2 = await fetch('/api/internal/users', { headers: headers() });
        if (res2.ok) setContacts(await res2.json());
        return;
      }
      setContacts(await res.json());
    } catch { /* silent */ }
  }, [headers]);

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch('/api/internal/messages', { headers: headers() });
      if (res.ok) setMessages(await res.json());
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [headers]);

  useEffect(() => { loadContacts(); loadMessages(); }, [loadContacts, loadMessages]);
  useEffect(() => {
    pollingRef.current = setInterval(loadMessages, 10000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, [loadMessages]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, selectedUser]);

  // Group contacts by category
  const groupedContacts = useMemo(() => {
    const filtered = contacts.filter(c =>
      c.id !== user?.id &&
      (c.name?.toLowerCase().includes(search.toLowerCase()) ||
       c.post?.toLowerCase().includes(search.toLowerCase()) ||
       c.email?.toLowerCase().includes(search.toLowerCase()))
    );

    const groups: Record<string, User[]> = {};
    filtered.forEach(c => {
      const cat = c.category || levelLabels[c.level] || 'Autre';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(c);
    });
    return groups;
  }, [contacts, search, user]);

  // Conversation with selected user
  const conversation = useMemo(() => {
    if (!selectedUser || !user) return [];
    return messages.filter(m =>
      (m.sender_id === user.id && m.receiver_id === selectedUser.id) ||
      (m.sender_id === selectedUser.id && m.receiver_id === user.id)
    );
  }, [messages, selectedUser, user]);

  // Unread count per user
  const unreadCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    messages.forEach(m => {
      if (m.receiver_id === user?.id && !m.read) {
        counts[m.sender_id] = (counts[m.sender_id] || 0) + 1;
      }
    });
    return counts;
  }, [messages, user]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedUser || sending) return;
    setSending(true);
    try {
      const res = await fetch('/api/internal/messages', {
        method: 'POST', headers: headers(),
        body: JSON.stringify({ receiver_id: selectedUser.id, content: newMessage.trim() })
      });
      if (res.ok) {
        setNewMessage('');
        await loadMessages();
      } else {
        toast.error('Erreur lors de l\\'envoi');
      }
    } catch { toast.error('Erreur de connexion'); }
    finally { setSending(false); }
  };

  const formatTime = (d: string) => {
    if (!d) return '';
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    if (diff < 604800000) return date.toLocaleDateString('fr-FR', { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Contacts sidebar */}
      <Card className="w-80 shrink-0 flex flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageCircle className="h-5 w-5" /> Messagerie
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
        </CardHeader>
        <ScrollArea className="flex-1">
          <div className="px-3 pb-3 space-y-4">
            {Object.entries(groupedContacts).map(([category, users]) => (
              <div key={category}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">{category}</p>
                {users.map(c => {
                  const unread = unreadCounts[c.id] || 0;
                  const isSelected = selectedUser?.id === c.id;
                  return (
                    <button key={c.id} onClick={() => setSelectedUser(c)}
                      className={\`w-full text-left p-2.5 rounded-lg mb-1 transition-colors \${isSelected ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}\`}>
                      <div className="flex items-center justify-between">
                        <div className="min-w-0">
                          <p className={\`text-sm font-medium truncate \${isSelected ? 'text-blue-700' : 'text-gray-900'}\`}>
                            {c.name} {c.postnom || ''}
                          </p>
                          <p className="text-xs text-gray-500 truncate">{c.post}</p>
                          {c.province && <p className="text-xs text-gray-400 truncate">{c.province}</p>}
                        </div>
                        {unread > 0 && <Badge className="bg-blue-500 text-white text-xs shrink-0">{unread}</Badge>}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
            {Object.keys(groupedContacts).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Aucun contact trouvé</p>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Chat area */}
      <Card className="flex-1 flex flex-col">
        {selectedUser ? (
          <>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">
                  {selectedUser.name[0]}{(selectedUser.postnom || '')[0] || ''}
                </div>
                <div>
                  <p className="font-semibold text-sm">{selectedUser.name} {selectedUser.postnom || ''}</p>
                  <p className="text-xs text-gray-500">{selectedUser.post} — {levelLabels[selectedUser.level] || selectedUser.level}</p>
                </div>
              </div>
            </CardHeader>
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              <div className="space-y-3">
                {conversation.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-8">Aucun message. Commencez la conversation.</p>
                )}
                {conversation.map(m => {
                  const isMine = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={\`flex \${isMine ? 'justify-end' : 'justify-start'}\`}>
                      <div className={\`max-w-[70%] rounded-xl px-4 py-2.5 \${isMine ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-900'}\`}>
                        {!isMine && <p className="text-xs font-semibold mb-1 opacity-70">{m.sender_name} {m.sender_postnom || ''}</p>}
                        <p className="text-sm whitespace-pre-wrap">{m.content}</p>
                        <p className={\`text-xs mt-1 \${isMine ? 'text-blue-100' : 'text-gray-400'}\`}>{formatTime(m.created_at)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
            <div className="p-3 border-t flex gap-2">
              <Input value={newMessage} onChange={e => setNewMessage(e.target.value)}
                placeholder={\`Message à \${selectedUser.name}...\`}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                className="flex-1" />
              <Button onClick={sendMessage} disabled={sending || !newMessage.trim()} size="sm">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center">
              <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-sm">Sélectionnez un contact pour démarrer une conversation</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
`;

fs.writeFileSync("/app/src/pages/internal/Messaging.tsx", messaging);
console.log("MESSAGING.TSX UPDATED");

console.log("ALL DONE");
