import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import socketService from '../lib/socket';
import {
  LayoutDashboard,
  FileText,
  Smartphone,
  Megaphone,
  LogOut,
  User,
  Globe,
  UserCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search,
  Settings,
  MessageCircle,
  Clock,
  Shield
} from 'lucide-react';
import ActiveCampaignMonitor from './ActiveCampaignMonitor';
import styles from './Layout.module.css';

// Connect socket immediately when Layout is loaded (before render)
if (!socketService.socket) {
  socketService.connect();
}

function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [userLocation, setUserLocation] = useState({ city: 'Carregando...', country: '' });

  // Fetch user location by IP
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const response = await fetch('/api/location');
        const data = await response.json();
        if (data.success && data.location) {
          setUserLocation({
            city: data.location.city,
            country: data.location.country
          });
        }
      } catch (error) {
        setUserLocation({ city: 'São Paulo', country: 'BR' });
      }
    };
    fetchLocation();
  }, []);

  // Join user room when user changes
  useEffect(() => {
    if (user?.id) {
      socketService.joinUser(user.id);
    }
  }, [user?.id]);

  // Only disconnect on unmount if it's a real logout
  useEffect(() => {
    return () => {
      // Only disconnect if user is actually logging out (not just navigating)
      const isLogout = !useAuthStore.getState().token;
      if (isLogout) {
        socketService.disconnect();
      }
    };
  }, []);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Load notifications
  useEffect(() => {
    loadNotifications();
  }, []);

  // Listen for new notifications via socket
  useEffect(() => {
    const handleNewNotification = (notification) => {
      setNotifications(prev => [notification, ...prev].slice(0, 10));
    };

    socketService.on('notification', handleNewNotification);

    return () => {
      socketService.off('notification', handleNewNotification);
    };
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(`.${styles.headerBtnWrapper}`)) {
        setSearchOpen(false);
        setNotificationsOpen(false);
        setSettingsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadNotifications = async () => {
    try {
      const api = (await import('../lib/api')).default;
      const { data } = await api.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      setNotifications([]);
    }
  };

  const markNotificationAsRead = async (id) => {
    try {
      const api = (await import('../lib/api')).default;
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev =>
        prev.map(notif => notif.id === id ? { ...notif, read: true } : notif)
      );
    } catch (error) {
    }
  };

  const markAllAsRead = async () => {
    try {
      const api = (await import('../lib/api')).default;
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
    } catch (error) {
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleSearch = () => {
    setSearchOpen(!searchOpen);
    setNotificationsOpen(false);
    setSettingsOpen(false);
    if (!searchOpen) {
      setTimeout(() => document.getElementById('search-input')?.focus(), 100);
    }
  };

  const toggleNotifications = () => {
    setNotificationsOpen(!notificationsOpen);
    setSearchOpen(false);
    setSettingsOpen(false);
  };

  const toggleSettings = () => {
    setSettingsOpen(!settingsOpen);
    setSearchOpen(false);
    setNotificationsOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results or filter current page
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'campaign':
        return <Megaphone size={16} />;
      case 'instance':
        return <Smartphone size={16} />;
      case 'system':
        return <Bell size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  const formatNotificationTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    if (hours < 24) return `${hours}h atrás`;
    return `${days}d atrás`;
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const baseNavItems = [
    { path: '/app/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/app/campaigns', icon: Megaphone, label: 'Campanhas' },
    { path: '/app/instances', icon: Smartphone, label: 'Instâncias' },
    { path: '/app/whatsapp-profile', icon: UserCircle, label: 'Perfil WhatsApp' },
    { path: '/app/templates', icon: FileText, label: 'Templates' },
    { path: '/app/proxys', icon: Globe, label: 'Proxys' },
  ];

  const navItems = user?.accountType === 'admin'
    ? [...baseNavItems, { path: '/app/admin', icon: Shield, label: 'Admin' }]
    : baseNavItems;

  const getPageTitle = () => {
    const currentPage = navItems.find(item => location.pathname.startsWith(item.path));
    return currentPage?.label || 'Dashboard';
  };

  // Format time for São Paulo timezone
  const formatTime = () => {
    return currentTime.toLocaleTimeString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = () => {
    return currentTime.toLocaleDateString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.layout}>
      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
        <div className={styles.sidebarHeader}>
          <div className={styles.logo}>
            <MessageCircle className={styles.logoIcon} size={sidebarCollapsed ? 24 : 32} />
            {!sidebarCollapsed && (
              <div className={styles.logoText}>
                <h1>ReactSpam</h1>
                <p>WhatsApp Marketing</p>
              </div>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className={styles.toggleBtn}
            title={sidebarCollapsed ? 'Expandir menu' : 'Recolher menu'}
          >
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className={styles.nav}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
                title={sidebarCollapsed ? item.label : ''}
              >
                <Icon size={20} />
                {!sidebarCollapsed && <span>{item.label}</span>}
                {isActive && <div className={styles.activeIndicator}></div>}
              </Link>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          {/* Clock */}
          <div className={styles.clockSection}>
            <Clock size={16} />
            {!sidebarCollapsed && (
              <div className={styles.clockContent}>
                <div className={styles.time}>{formatTime()}</div>
                <div className={styles.location}>{userLocation.city}{userLocation.country ? `, ${userLocation.country}` : ''}</div>
              </div>
            )}
          </div>

          {/* User Section */}
          <div className={styles.userSection}>
            <div className={styles.userInfo}>
              <div className={styles.avatar}>
                <User size={20} />
              </div>
              {!sidebarCollapsed && (
                <div className={styles.userDetails}>
                  <p className={styles.userName}>{user?.username}</p>
                  <span className={styles.userBadge}>{user?.accountType}</span>
                </div>
              )}
            </div>
            <button
              onClick={handleLogout}
              className={styles.logoutBtn}
              title="Sair"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className={styles.mainWrapper}>
        {/* Header */}
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <h2 className={styles.pageTitle}>{getPageTitle()}</h2>
            <p className={styles.pageSubtitle}>{formatDate()}</p>
          </div>
          <div className={styles.headerRight}>
            {/* Search Button */}
            <div className={styles.headerBtnWrapper}>
              <button
                className={`${styles.headerBtn} ${searchOpen ? styles.active : ''}`}
                onClick={toggleSearch}
                title="Pesquisar"
              >
                <Search size={20} />
              </button>
              {searchOpen && (
                <div className={styles.dropdown}>
                  <form onSubmit={handleSearch} className={styles.searchForm}>
                    <Search size={18} />
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Pesquisar campanhas, instâncias, templates..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className={styles.searchInput}
                    />
                  </form>
                  <div className={styles.searchQuickLinks}>
                    <p className={styles.searchLabel}>Atalhos rápidos</p>
                    <Link to="/app/campaigns" className={styles.quickLink} onClick={toggleSearch}>
                      <Megaphone size={16} />
                      <span>Campanhas</span>
                    </Link>
                    <Link to="/app/instances" className={styles.quickLink} onClick={toggleSearch}>
                      <Smartphone size={16} />
                      <span>Instâncias</span>
                    </Link>
                    <Link to="/app/templates" className={styles.quickLink} onClick={toggleSearch}>
                      <FileText size={16} />
                      <span>Templates</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Button */}
            <div className={styles.headerBtnWrapper}>
              <button
                className={`${styles.headerBtn} ${notificationsOpen ? styles.active : ''}`}
                onClick={toggleNotifications}
                title="Notificações"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className={styles.notificationBadge}>{unreadCount}</span>
                )}
              </button>
              {notificationsOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <h3>Notificações</h3>
                    {unreadCount > 0 && (
                      <button onClick={markAllAsRead} className={styles.markAllRead}>
                        Marcar todas como lida
                      </button>
                    )}
                  </div>
                  <div className={styles.notificationsList}>
                    {notifications.length === 0 ? (
                      <div className={styles.emptyState}>
                        <Bell size={32} />
                        <p>Nenhuma notificação</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`${styles.notificationItem} ${notification.read ? styles.read : ''}`}
                          onClick={() => markNotificationAsRead(notification.id)}
                        >
                          <div className={styles.notificationIcon}>
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className={styles.notificationContent}>
                            <p className={styles.notificationTitle}>{notification.title}</p>
                            <p className={styles.notificationMessage}>{notification.message}</p>
                            <span className={styles.notificationTime}>
                              {formatNotificationTime(notification.timestamp)}
                            </span>
                          </div>
                          {!notification.read && <div className={styles.unreadDot}></div>}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Settings Button */}
            <div className={styles.headerBtnWrapper}>
              <button
                className={`${styles.headerBtn} ${settingsOpen ? styles.active : ''}`}
                onClick={toggleSettings}
                title="Configurações"
              >
                <Settings size={20} />
              </button>
              {settingsOpen && (
                <div className={styles.dropdown}>
                  <div className={styles.dropdownHeader}>
                    <h3>Configurações</h3>
                  </div>
                  <div className={styles.settingsList}>
                    <Link to="/app/profile" className={styles.settingItem} onClick={toggleSettings}>
                      <UserCircle size={18} />
                      <div>
                        <p className={styles.settingTitle}>Meu Perfil</p>
                        <span className={styles.settingDesc}>Informações da conta</span>
                      </div>
                    </Link>
                    <Link to="/app/whatsapp-profile" className={styles.settingItem} onClick={toggleSettings}>
                      <MessageCircle size={18} />
                      <div>
                        <p className={styles.settingTitle}>Perfil WhatsApp</p>
                        <span className={styles.settingDesc}>Configurar perfil de negócios</span>
                      </div>
                    </Link>
                    <Link to="/app/instances" className={styles.settingItem} onClick={toggleSettings}>
                      <Smartphone size={18} />
                      <div>
                        <p className={styles.settingTitle}>Instâncias</p>
                        <span className={styles.settingDesc}>Gerenciar conexões</span>
                      </div>
                    </Link>
                    <Link to="/app/proxys" className={styles.settingItem} onClick={toggleSettings}>
                      <Globe size={18} />
                      <div>
                        <p className={styles.settingTitle}>Proxys</p>
                        <span className={styles.settingDesc}>Configurar proxys</span>
                      </div>
                    </Link>
                    <div className={styles.settingsDivider}></div>
                    <button onClick={handleLogout} className={`${styles.settingItem} ${styles.logout}`}>
                      <LogOut size={18} />
                      <div>
                        <p className={styles.settingTitle}>Sair</p>
                        <span className={styles.settingDesc}>Desconectar da conta</span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>

      {/* Active Campaign Monitor - Floating Panel */}
      <ActiveCampaignMonitor />
    </div>
  );
}

export default Layout;
