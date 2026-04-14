import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import toast from 'react-hot-toast';
import {
  Users,
  Shield,
  Ban,
  Send,
  SendHorizontal,
  Smartphone,
  Megaphone,
  MessageCircle,
  Crown,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Lock,
  Download,
  Phone,
  Database
} from 'lucide-react';
import styles from './Admin.module.css';

function Admin() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [leadsStats, setLeadsStats] = useState(null);
  const [activationRequests, setActivationRequests] = useState([]);
  const [expandedUser, setExpandedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [editingLimit, setEditingLimit] = useState(null);
  const [limitValue, setLimitValue] = useState('');
  const [downloadingLeads, setDownloadingLeads] = useState(false);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsSearch, setLeadsSearch] = useState('');
  const leadsPerPage = 10;

  useEffect(() => {
    if (user?.accountType !== 'admin') {
      navigate('/app/dashboard');
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);

      const results = await Promise.allSettled([
        api.get('/admin/users'),
        api.get('/admin/stats'),
        api.get('/admin/activation-requests'),
        api.get('/admin/leads/stats')
      ]);

      const [usersRes, statsRes, requestsRes, leadsRes] = results;

      // Check for 403 error (not admin)
      const firstError = results.find(r => r.status === 'rejected' && r.reason?.response?.status === 403);
      if (firstError) {
        // Error already shown by API interceptor
        navigate('/app/dashboard');
        return;
      }

      if (usersRes.status === 'fulfilled' && usersRes.value.data.success) {
        setUsers(usersRes.value.data.users);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.data.success) {
        setStats(statsRes.value.data.stats);
      }

      if (requestsRes.status === 'fulfilled' && requestsRes.value.data.success) {
        setActivationRequests(requestsRes.value.data.requests);
      }

      if (leadsRes.status === 'fulfilled' && leadsRes.value.data.success) {
        setLeadsStats(leadsRes.value.data.stats);
      }

    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao carregar dados', { id: 'admin-load-error' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleBan = async (userId, currentStatus) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/ban`, {
        banned: !currentStatus
      });

      if (data.success) {
        toast.success(data.message);
        setUsers(users.map(u =>
          u.id === userId ? { ...u, is_banned: !currentStatus, is_active: currentStatus } : u
        ));
      }
    } catch (error) {
      toast.error('Erro ao alterar status');
    }
  };

  const handleToggleSend = async (userId, currentStatus) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/send-permission`, {
        canSend: !currentStatus
      });

      if (data.success) {
        toast.success(data.message);
        setUsers(users.map(u =>
          u.id === userId ? { ...u, can_send: !currentStatus } : u
        ));
      }
    } catch (error) {
      toast.error('Erro ao alterar permissao');
    }
  };

  const handleUpdateLimit = async (userId) => {
    try {
      const maxInstances = parseInt(limitValue) || 0;
      const { data } = await api.put(`/admin/users/${userId}/instance-limit`, {
        maxInstances
      });

      if (data.success) {
        toast.success(data.message);
        setUsers(users.map(u =>
          u.id === userId ? { ...u, max_instances: maxInstances } : u
        ));
        setEditingLimit(null);
        setLimitValue('');
      }
    } catch (error) {
      toast.error('Erro ao alterar limite');
    }
  };

  const handleUpdateAccountType = async (userId, newType) => {
    try {
      const { data } = await api.put(`/admin/users/${userId}/account-type`, {
        accountType: newType
      });

      if (data.success) {
        toast.success(data.message);
        setUsers(users.map(u =>
          u.id === userId ? { ...u, account_type: newType } : u
        ));
      }
    } catch (error) {
      toast.error('Erro ao alterar tipo de conta');
    }
  };

  const handleProcessRequest = async (requestId, action) => {
    try {
      const { data } = await api.put(`/admin/activation-requests/${requestId}`, {
        action
      });

      if (data.success) {
        toast.success(data.message);
        setActivationRequests(activationRequests.filter(r => r.id !== requestId));
        loadData();
      }
    } catch (error) {
      toast.error('Erro ao processar solicitacao');
    }
  };

  const handleDownloadLeads = async (status = null, userId = null) => {
    try {
      setDownloadingLeads(true);
      let url = '/admin/leads/export';
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (userId) params.append('userId', userId);
      if (params.toString()) url += '?' + params.toString();

      const response = await api.get(url, { responseType: 'blob' });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `leads-${status || 'todos'}-${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast.success('Leads exportados com sucesso!');
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.status === 404) {
        toast.error('Nenhum lead encontrado');
      } else {
        toast.error('Erro ao exportar leads');
      }
    } finally {
      setDownloadingLeads(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'banned') return matchesSearch && u.is_banned;
    if (filterStatus === 'blocked') return matchesSearch && !u.can_send;
    if (filterStatus === 'active') return matchesSearch && u.account_type === 'active';
    if (filterStatus === 'free') return matchesSearch && u.account_type === 'free';

    return matchesSearch;
  });

  const formatDate = (date) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return <div className={styles.loader}>Carregando...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #3B82F6, #60A5FA)' }}>
            <Users size={28} color="white" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>Total Usuarios</p>
            <p className={styles.statValue}>{stats?.users?.total || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #10B981, #34D399)' }}>
            <UserCheck size={28} color="white" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>Contas Ativas</p>
            <p className={styles.statValue}>{stats?.users?.active || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #EF4444, #F87171)' }}>
            <Ban size={28} color="white" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>Banidos</p>
            <p className={styles.statValue}>{stats?.users?.banned || 0}</p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: 'linear-gradient(135deg, #F59E0B, #FBBF24)' }}>
            <Clock size={28} color="white" />
          </div>
          <div className={styles.statContent}>
            <p className={styles.statTitle}>Solicitacoes Pendentes</p>
            <p className={styles.statValue}>{stats?.pendingActivations || 0}</p>
          </div>
        </div>
      </div>

      {/* System Stats */}
      <div className={styles.systemStats}>
        <div className={styles.systemStatItem}>
          <Smartphone size={20} />
          <span>{stats?.instances?.connected || 0} / {stats?.instances?.total || 0} instancias conectadas</span>
        </div>
        <div className={styles.systemStatItem}>
          <Megaphone size={20} />
          <span>{stats?.campaigns?.processing || 0} campanhas em andamento</span>
        </div>
        <div className={styles.systemStatItem}>
          <MessageCircle size={20} />
          <span>{stats?.campaigns?.total_sent?.toLocaleString() || 0} mensagens enviadas</span>
        </div>
      </div>

      {/* Leads Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2><Database size={20} /> Exportar Leads</h2>
        </div>

        <div className={styles.leadsGrid}>
          <div className={styles.leadsStat}>
            <div className={styles.leadsStatIcon} style={{ background: 'rgba(59, 130, 246, 0.15)', color: '#3B82F6' }}>
              <Phone size={24} />
            </div>
            <div className={styles.leadsStatContent}>
              <span className={styles.leadsStatValue}>
                {leadsStats?.uniqueLeads?.toLocaleString() || 0}
              </span>
              <span className={styles.leadsStatLabel}>Total de Leads</span>
            </div>
          </div>

          {leadsStats?.byStatus?.map(s => (
            <div key={s.status} className={styles.leadsStat}>
              <div className={styles.leadsStatIcon} style={{
                background: s.status === 'sent' ? 'rgba(16, 185, 129, 0.15)' :
                           s.status === 'failed' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                color: s.status === 'sent' ? '#10B981' :
                       s.status === 'failed' ? '#EF4444' : '#6B7280'
              }}>
                {s.status === 'sent' ? <CheckCircle size={24} /> :
                 s.status === 'failed' ? <XCircle size={24} /> : <Clock size={24} />}
              </div>
              <div className={styles.leadsStatContent}>
                <span className={styles.leadsStatValue}>
                  {s.unique_count?.toLocaleString() || 0}
                </span>
                <span className={styles.leadsStatLabel}>
                  {s.status === 'sent' ? 'Enviados' :
                   s.status === 'failed' ? 'Falhas' : 'Pendentes'}
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className={styles.leadsActions}>
          <button
            className={styles.downloadBtn}
            onClick={() => handleDownloadLeads()}
            disabled={downloadingLeads}
          >
            <Download size={18} />
            {downloadingLeads ? 'Baixando...' : 'Baixar Todos os Leads'}
          </button>

          <button
            className={`${styles.downloadBtn} ${styles.success}`}
            onClick={() => handleDownloadLeads('sent')}
            disabled={downloadingLeads}
          >
            <CheckCircle size={18} />
            Enviados
          </button>

          <button
            className={`${styles.downloadBtn} ${styles.danger}`}
            onClick={() => handleDownloadLeads('failed')}
            disabled={downloadingLeads}
          >
            <XCircle size={18} />
            Falhas
          </button>
        </div>

        {leadsStats?.byUser && leadsStats.byUser.length > 0 && (() => {
          const filteredLeadsUsers = leadsStats.byUser.filter(u =>
            u.username.toLowerCase().includes(leadsSearch.toLowerCase())
          );
          const totalLeadsPages = Math.ceil(filteredLeadsUsers.length / leadsPerPage);

          return (
          <div className={styles.leadsUserList}>
            <div className={styles.leadsUserHeader}>
              <h3><Users size={18} /> Leads por Usuario ({filteredLeadsUsers.length})</h3>
              <div className={styles.leadsSearchBox}>
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={leadsSearch}
                  onChange={(e) => {
                    setLeadsSearch(e.target.value);
                    setLeadsPage(1);
                  }}
                />
              </div>
            </div>

            <div className={styles.leadsTable}>
              <div className={styles.leadsTableHeader}>
                <div className={styles.leadsColUser}>Usuario</div>
                <div className={styles.leadsColCount}>Leads Unicos</div>
                <div className={styles.leadsColTotal}>Total</div>
                <div className={styles.leadsColAction}>Acao</div>
              </div>

              {filteredLeadsUsers.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Nenhum usuario encontrado</p>
                </div>
              ) : filteredLeadsUsers
                .slice((leadsPage - 1) * leadsPerPage, leadsPage * leadsPerPage)
                .map(u => (
                  <div key={u.id} className={styles.leadsTableRow}>
                    <div className={styles.leadsColUser}>
                      <div className={styles.userAvatar}>
                        {u.username.charAt(0).toUpperCase()}
                      </div>
                      <span>{u.username}</span>
                    </div>
                    <div className={styles.leadsColCount}>
                      <strong>{u.unique_leads.toLocaleString()}</strong>
                    </div>
                    <div className={styles.leadsColTotal}>
                      {u.total_leads.toLocaleString()}
                    </div>
                    <div className={styles.leadsColAction}>
                      <button
                        className={styles.downloadSmallBtn}
                        onClick={() => handleDownloadLeads(null, u.id)}
                        disabled={downloadingLeads}
                        title={`Baixar leads de ${u.username}`}
                      >
                        <Download size={16} />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {totalLeadsPages > 1 && (
              <div className={styles.pagination}>
                <button
                  className={styles.pageBtn}
                  onClick={() => setLeadsPage(p => Math.max(1, p - 1))}
                  disabled={leadsPage === 1}
                >
                  <ChevronLeft size={18} />
                </button>

                <span className={styles.pageInfo}>
                  Pagina {leadsPage} de {totalLeadsPages}
                </span>

                <button
                  className={styles.pageBtn}
                  onClick={() => setLeadsPage(p => Math.min(totalLeadsPages, p + 1))}
                  disabled={leadsPage >= totalLeadsPages}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        );
        })()}
      </div>

      {/* Activation Requests */}
      {activationRequests.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2><Clock size={20} /> Solicitacoes de Ativacao</h2>
            <span className={styles.badge}>{activationRequests.length} pendentes</span>
          </div>

          <div className={styles.requestsList}>
            {activationRequests.map(request => (
              <div key={request.id} className={styles.requestCard}>
                <div className={styles.requestInfo}>
                  <div className={styles.requestUser}>
                    <strong>{request.username}</strong>
                    <span>{request.email}</span>
                  </div>
                  <p className={styles.requestMessage}>{request.request_message}</p>
                  <span className={styles.requestDate}>{formatDate(request.created_at)}</span>
                </div>
                <div className={styles.requestActions}>
                  <button
                    className={styles.approveBtn}
                    onClick={() => handleProcessRequest(request.id, 'approved')}
                  >
                    <CheckCircle size={18} />
                    Aprovar
                  </button>
                  <button
                    className={styles.rejectBtn}
                    onClick={() => handleProcessRequest(request.id, 'rejected')}
                  >
                    <XCircle size={18} />
                    Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Users Section */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2><Users size={20} /> Gerenciar Usuarios</h2>
          <button className={styles.refreshBtn} onClick={loadData}>
            <RefreshCw size={18} />
          </button>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <div className={styles.searchBox}>
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className={styles.filterButtons}>
            <button
              className={`${styles.filterBtn} ${filterStatus === 'all' ? styles.active : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              Todos
            </button>
            <button
              className={`${styles.filterBtn} ${filterStatus === 'active' ? styles.active : ''}`}
              onClick={() => setFilterStatus('active')}
            >
              Ativos
            </button>
            <button
              className={`${styles.filterBtn} ${filterStatus === 'free' ? styles.active : ''}`}
              onClick={() => setFilterStatus('free')}
            >
              Free
            </button>
            <button
              className={`${styles.filterBtn} ${filterStatus === 'banned' ? styles.active : ''}`}
              onClick={() => setFilterStatus('banned')}
            >
              Banidos
            </button>
            <button
              className={`${styles.filterBtn} ${filterStatus === 'blocked' ? styles.active : ''}`}
              onClick={() => setFilterStatus('blocked')}
            >
              Envio Bloqueado
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className={styles.usersTable}>
          <div className={styles.tableHeader}>
            <div className={styles.colUser}>Usuario</div>
            <div className={styles.colType}>Tipo</div>
            <div className={styles.colStats}>Estatisticas</div>
            <div className={styles.colStatus}>Status</div>
            <div className={styles.colActions}>Acoes</div>
          </div>

          {filteredUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <Users size={48} />
              <p>Nenhum usuario encontrado</p>
            </div>
          ) : (
            filteredUsers.map(u => (
              <div key={u.id} className={styles.userRow}>
                <div className={styles.userMain}>
                  <div className={styles.colUser}>
                    <div className={styles.userAvatar}>
                      {u.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userInfo}>
                      <strong>{u.username}</strong>
                      <span>{u.email}</span>
                    </div>
                  </div>

                  <div className={styles.colType}>
                    <select
                      className={styles.typeSelect}
                      value={u.account_type}
                      onChange={(e) => handleUpdateAccountType(u.id, e.target.value)}
                    >
                      <option value="free">Free</option>
                      <option value="active">Ativo</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className={styles.colStats}>
                    <div className={styles.statBadge}>
                      <Smartphone size={14} />
                      {u.instance_count || 0}
                    </div>
                    <div className={styles.statBadge}>
                      <Megaphone size={14} />
                      {u.campaign_count || 0}
                    </div>
                    <div className={styles.statBadge}>
                      <MessageCircle size={14} />
                      {(u.total_messages || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className={styles.colStatus}>
                    {u.is_banned && (
                      <span className={`${styles.statusBadge} ${styles.banned}`}>
                        <Ban size={12} /> Banido
                      </span>
                    )}
                    {!u.can_send && !u.is_banned && (
                      <span className={`${styles.statusBadge} ${styles.blocked}`}>
                        <Lock size={12} /> Bloqueado
                      </span>
                    )}
                    {!u.is_banned && u.can_send && (
                      <span className={`${styles.statusBadge} ${styles.ok}`}>
                        <CheckCircle size={12} /> OK
                      </span>
                    )}
                  </div>

                  <div className={styles.colActions}>
                    <button
                      className={`${styles.actionBtn} ${u.is_banned ? styles.success : styles.danger}`}
                      onClick={() => handleToggleBan(u.id, u.is_banned)}
                      title={u.is_banned ? 'Desbanir' : 'Banir'}
                    >
                      {u.is_banned ? <UserCheck size={16} /> : <Ban size={16} />}
                    </button>

                    <button
                      className={`${styles.actionBtn} ${!u.can_send ? styles.success : styles.warning}`}
                      onClick={() => handleToggleSend(u.id, u.can_send)}
                      title={u.can_send ? 'Bloquear Envio' : 'Liberar Envio'}
                    >
                      {u.can_send ? <Lock size={16} /> : <Send size={16} />}
                    </button>

                    <button
                      className={styles.actionBtn}
                      onClick={() => setExpandedUser(expandedUser === u.id ? null : u.id)}
                      title="Mais opcoes"
                    >
                      {expandedUser === u.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {expandedUser === u.id && (
                  <div className={styles.expandedRow}>
                    <div className={styles.expandedInfo}>
                      <div className={styles.infoItem}>
                        <label>Criado em:</label>
                        <span>{formatDate(u.created_at)}</span>
                      </div>
                      <div className={styles.infoItem}>
                        <label>Ultimo login:</label>
                        <span>{formatDate(u.last_login)}</span>
                      </div>
                    </div>

                    <div className={styles.limitSection}>
                      <label>Limite de Instancias:</label>
                      <div className={styles.limitInput}>
                        {editingLimit === u.id ? (
                          <>
                            <input
                              type="number"
                              min="0"
                              value={limitValue}
                              onChange={(e) => setLimitValue(e.target.value)}
                              placeholder="0 = ilimitado"
                            />
                            <button
                              className={styles.saveBtn}
                              onClick={() => handleUpdateLimit(u.id)}
                            >
                              Salvar
                            </button>
                            <button
                              className={styles.cancelBtn}
                              onClick={() => {
                                setEditingLimit(null);
                                setLimitValue('');
                              }}
                            >
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            <span>{u.max_instances === 0 ? 'Ilimitado' : u.max_instances}</span>
                            <button
                              className={styles.editBtn}
                              onClick={() => {
                                setEditingLimit(u.id);
                                setLimitValue(u.max_instances?.toString() || '0');
                              }}
                            >
                              Editar
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Admin;
