import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  CheckCircle, 
  AlertTriangle, 
  Info, 
  MessageCircle, 
  FileText,
  User,
  Settings,
  Trash2,
  MarkAsUnreadIcon,
  CheckIcon
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface Notification {
  id: number;
  type: 'message' | 'report' | 'alert' | 'info' | 'user';
  title: string;
  content: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  from_user?: string;
  action_url?: string;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/internal/notifications', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data);
      } else {
        toast.error('Erreur lors du chargement des notifications');
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur de connexion');
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
    toast.success('Toutes les notifications marquées comme lues');
  };

  const deleteNotification = (id: number) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    toast.success('Notification supprimée');
  };

  const getIcon = (type: string, priority: string) => {
    const iconClass = `w-5 h-5 ${
      priority === 'high' ? 'text-red-500' : 
      priority === 'medium' ? 'text-orange-500' : 
      'text-blue-500'
    }`;

    switch (type) {
      case 'message': return <MessageCircle className={iconClass} />;
      case 'report': return <FileText className={iconClass} />;
      case 'alert': return <AlertTriangle className={iconClass} />;
      case 'user': return <User className={iconClass} />;
      default: return <Info className={iconClass} />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-orange-100 text-orange-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (filter) {
      case 'unread': return !notif.read;
      case 'read': return notif.read;
      default: return true;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours < 1) return 'À l\'instant';
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays === 1) return 'Hier';
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="">
      <div className="space-y-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-dark mb-2">Notifications</h1>
          <p className="text-gray-600">Restez informé des dernières activités</p>
        </div>

        {/* Stats et filtres */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="card-official">
            <CardContent className="p-4 text-center">
              <Bell className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold text-dark">{notifications.length}</div>
              <div className="text-sm text-gray-600">Total</div>
            </CardContent>
          </Card>
          <Card className="card-official">
            <CardContent className="p-4 text-center">
              <AlertTriangle className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-dark">{unreadCount}</div>
              <div className="text-sm text-gray-600">Non lues</div>
            </CardContent>
          </Card>
          <Card className="card-official">
            <CardContent className="p-4 text-center">
              <MessageCircle className="h-8 w-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-dark">{notifications.filter(n => n.type === 'message').length}</div>
              <div className="text-sm text-gray-600">Messages</div>
            </CardContent>
          </Card>
          <Card className="card-official">
            <CardContent className="p-4 text-center">
              <FileText className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-dark">{notifications.filter(n => n.type === 'report').length}</div>
              <div className="text-sm text-gray-600">Rapports</div>
            </CardContent>
          </Card>
        </div>

        <Card className="card-official">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Centre de Notifications
                {unreadCount > 0 && (
                  <Badge className="bg-red-500 text-white ml-2">{unreadCount}</Badge>
                )}
              </CardTitle>
              
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <select 
                    value={filter}
                    onChange={(e) => setFilter(e.target.value as any)}
                    className="border border-gray-300 rounded-md px-3 py-1 text-sm"
                  >
                    <option value="all">Toutes ({notifications.length})</option>
                    <option value="unread">Non lues ({unreadCount})</option>
                    <option value="read">Lues ({notifications.length - unreadCount})</option>
                  </select>
                </div>
                
                {unreadCount > 0 && (
                  <Button onClick={markAllAsRead} variant="outline" size="sm">
                    <CheckIcon className="h-4 w-4 mr-2" />
                    Tout marquer lu
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <Bell className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {filter === 'unread' ? 'Aucune notification non lue' : 
                   filter === 'read' ? 'Aucune notification lue' : 
                   'Aucune notification'}
                </h3>
                <p className="text-gray-500">
                  {filter === 'all' ? 'Vous serez notifié dès qu\'une nouvelle activité aura lieu.' : ''}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border rounded-lg transition-colors hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getIcon(notification.type, notification.priority)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className={`text-sm font-medium ${!notification.read ? 'text-dark' : 'text-gray-900'}`}>
                                {notification.title}
                              </h3>
                              {!notification.read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                              )}
                              <Badge className={getPriorityColor(notification.priority)}>
                                {notification.priority === 'high' ? 'Urgent' : 
                                 notification.priority === 'medium' ? 'Important' : 'Info'}
                              </Badge>
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">
                              {notification.content}
                            </p>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{formatDate(notification.created_at)}</span>
                              {notification.from_user && (
                                <span>De: {notification.from_user}</span>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-2 ml-4">
                            {!notification.read && (
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => markAsRead(notification.id)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                            
                            <Button 
                              size="sm" 
                              variant="ghost"
                              onClick={() => deleteNotification(notification.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
