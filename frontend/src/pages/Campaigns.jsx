import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import socketService from '../lib/socket';
import { useAuthStore } from '../store/authStore';
import { Plus, Megaphone, Play, Pause, X, Trash2, Filter, ArrowUpDown, ArrowUp, ArrowDown, Download, CheckCircle2, ChevronDown, Smartphone, FileUp, Settings, Loader2, Sparkles, RotateCcw } from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import styles from './Campaigns.module.css';

function Campaigns() {
  const { user } = useAuthStore();
  const [searchParams, setSearchParams] = useSearchParams();
  const [campaigns, setCampaigns] = useState([]);
  const campaignsRef = useRef([]);
  const [templates, setTemplates] = useState([]);
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showInstancesModal, setShowInstancesModal] = useState(false);
  const [showEditInstancesModal, setShowEditInstancesModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [editInstanceIds, setEditInstanceIds] = useState([]);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, id: null });
  const [showMonitorButton, setShowMonitorButton] = useState(() => {
    return localStorage.getItem('campaignMonitorClosed') === 'true';
  });
  const [recreateNumbers, setRecreateNumbers] = useState([]);
  const [isRecreating, setIsRecreating] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [filters, setFilters] = useState({
    status: 'all'
  });
  const [sorting, setSorting] = useState({
    column: 'created_at',
    direction: 'desc'
  });
  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    templateId2: '',
    templateId3: '',
    instanceIds: [],
    minInterval: 0,
    maxInterval: 25,
    batchSize: 20,
    useProxy: false,
    useAntiBan: true
  });

  useEffect(() => {
    fetchCampaigns();
    fetchTemplates();
    fetchInstances();

    // Socket is already connected from Layout - just attach listeners
    socketService.on('campaign-status-changed', handleCampaignStatusChanged);

    return () => {
      socketService.off('campaign-status-changed', handleCampaignStatusChanged);
    };
  }, [pagination.currentPage, filters.status, sorting.column, sorting.direction, user?.id]);

  // Handle recreate parameter from URL
  useEffect(() => {
    const recreateId = searchParams.get('recreate');
    if (recreateId && templates.length > 0 && instances.length > 0) {
      loadCampaignForRecreate(recreateId);
    }
  }, [searchParams, templates.length, instances.length]);

  const loadCampaignForRecreate = async (campaignId) => {
    try {
      const { data } = await api.get(`/campaigns/${campaignId}/recreate`);
      if (data.success) {
        // Pre-fill form with campaign data
        setFormData({
          name: `${data.campaign.name} (Cópia)`,
          templateId: data.campaign.template_id || templates[0]?.id || '',
          templateId2: '',
          templateId3: '',
          instanceIds: data.instanceIds || [],
          minInterval: data.campaign.min_interval || 0,
          maxInterval: data.campaign.max_interval || 25,
          batchSize: 20,
          useProxy: data.campaign.use_proxy || false,
          useAntiBan: data.campaign.use_anti_ban !== false
        });

        // Store numbers for recreation
        setRecreateNumbers(data.numbers || []);
        setIsRecreating(true);
        setShowModal(true);

        // Clear the URL parameter
        setSearchParams({});

        toast.success(`Recriando campanha com ${data.numbers?.length || 0} números`);
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar dados da campanha');
      }
      setSearchParams({});
    }
  };

  // Keep ref in sync with campaigns state
  useEffect(() => {
    campaignsRef.current = campaigns;
  }, [campaigns]);

  const fetchCampaigns = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage,
        limit: 10,
        sortBy: sorting.column,
        sortOrder: sorting.direction
      });

      if (filters.status !== 'all') {
        params.append('status', filters.status);
      }

      const { data } = await api.get(`/campaigns?${params.toString()}`);
      if (data.success) {
        setCampaigns(data.campaigns);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar campanhas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFilterChange = (e) => {
    setFilters({ status: e.target.value });
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handleSort = (column) => {
    setSorting(prev => ({
      column,
      direction: prev.column === column && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
    setPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  const handleOpenMonitor = () => {
    window.dispatchEvent(new Event('openCampaignMonitor'));
    setShowMonitorButton(false);
  };

  // Listen for monitor close event to show button
  useEffect(() => {
    const checkMonitorStatus = () => {
      const isClosed = localStorage.getItem('campaignMonitorClosed') === 'true';
      setShowMonitorButton(isClosed);
    };

    const interval = setInterval(checkMonitorStatus, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get('/templates');
      if (data.success) {
        setTemplates(data.templates);
      }
    } catch (error) {
    }
  };

  const fetchInstances = async () => {
    try {
      const { data } = await api.get('/instances');
      if (data.success) {
        // Filter only connected instances
        const connectedInstances = data.instances.filter(i => i.status === 'connected' && i.is_active);
        setInstances(connectedInstances);
      }
    } catch (error) {
    }
  };

  // Handle real-time campaign status changes
  const handleCampaignStatusChanged = (data) => {
    setCampaigns(prev => prev.map(campaign =>
      campaign.id === data.campaignId
        ? { ...campaign, status: data.status }
        : campaign
    ));

    // Show toast notification
    if (data.action === 'paused') {
      toast.success('Campanha pausada!');
    } else if (data.action === 'resumed') {
      toast.success('Campanha retomada!');
    } else if (data.action === 'cancelled') {
      toast.info('Campanha cancelada!');
      // Remove cancelled campaigns from list after a delay
      setTimeout(() => {
        setCampaigns(prev => prev.filter(c => c.id !== data.campaignId));
      }, 2000);
    }
  };

  // Handle real-time campaign progress updates
  const handleCampaignProgress = useCallback((data) => {
    setCampaigns(prev => prev.map(campaign =>
      campaign.id === data.campaignId
        ? {
            ...campaign,
            sent_count: data.sent || 0,
            success_count: data.success || 0,
            failed_count: data.failed || 0,
            total_numbers: data.total || campaign.total_numbers
          }
        : campaign
    ));
  }, []);

  // Real-time progress polling for processing campaigns
  useEffect(() => {
    socketService.on('campaign-progress', handleCampaignProgress);

    // Poll every 1 second for processing campaigns
    const progressPolling = setInterval(() => {
      const processingCampaigns = campaignsRef.current.filter(c => c.status === 'processing');

      if (processingCampaigns.length > 0 && socketService.isConnected()) {
        processingCampaigns.forEach(campaign => {
          socketService.emit('request-campaign-progress', campaign.id);
        });
      }
    }, 1000);

    return () => {
      socketService.off('campaign-progress', handleCampaignProgress);
      clearInterval(progressPolling);
    };
  }, [handleCampaignProgress]);

  const handleOpenModal = () => {
    if (templates.length === 0) {
      toast.error('Você precisa criar um template primeiro');
      return;
    }
    if (instances.length === 0) {
      toast.error('Você precisa ter pelo menos uma instância conectada');
      return;
    }
    setFormData({
      name: '',
      templateId: templates[0]?.id || '',
      templateId2: '',
      templateId3: '',
      instanceIds: [],
      minInterval: 0,
      maxInterval: 25,
      batchSize: 20,
      useProxy: false,
      useAntiBan: true
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsRecreating(false);
    setRecreateNumbers([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleInstanceToggle = (instanceId) => {
    setFormData(prev => {
      const isSelected = prev.instanceIds.includes(instanceId);
      return {
        ...prev,
        instanceIds: isSelected
          ? prev.instanceIds.filter(id => id !== instanceId)
          : [...prev.instanceIds, instanceId]
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.instanceIds.length === 0) {
      toast.error('Selecione pelo menos uma instância', {
        icon: '📱',
        duration: 4000
      });
      return;
    }

    setSubmitting(true);

    // Show loading toast
    const loadingToast = toast.loading('🚀 Criando campanha...', {
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        fontWeight: '600'
      }
    });

    try {
      // Include recreate numbers if recreating a campaign
      const payload = isRecreating && recreateNumbers.length > 0
        ? { ...formData, recreateNumbers }
        : formData;

      const { data } = await api.post('/campaigns', payload);
      if (data.success) {
        toast.success(data.message || '✨ Campanha criada com sucesso!', {
          id: loadingToast,
          icon: '🎉',
          duration: 5000,
          style: {
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            fontWeight: '600'
          }
        });
        fetchCampaigns();
        handleCloseModal();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || '❌ Erro ao criar campanha', {
        id: loadingToast,
        icon: '⚠️',
        duration: 5000,
        style: {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#fff',
          fontWeight: '600'
        }
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePause = async (id) => {
    try {
      const { data } = await api.post(`/campaigns/${id}/pause`);
      if (data.success) {
        toast.success(data.message);
        fetchCampaigns();
      }
    } catch (error) {
      const errorData = error.response?.data;
      toast.error(errorData?.message || 'Erro ao pausar campanha');
    }
  };

  const handleResume = async (id) => {
    try {
      const { data } = await api.post(`/campaigns/${id}/resume`);
      if (data.success) {
        toast.success(data.message);
        fetchCampaigns();
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.code === 'NO_INSTANCES') {
        toast.error('⚠️ Nenhuma instância conectada! Conecte uma instância primeiro.', {
          duration: 5000,
          icon: '📱'
        });
      } else {
        toast.error(errorData?.message || 'Erro ao retomar campanha');
      }
    }
  };

  const handleStart = async (id) => {
    try {
      const { data } = await api.post(`/campaigns/${id}/start`);
      if (data.success) {
        toast.success(data.message);
        fetchCampaigns();
      }
    } catch (error) {
      const errorData = error.response?.data;
      if (errorData?.code === 'NO_INSTANCES') {
        toast.error('⚠️ Nenhuma instância conectada! Conecte uma instância primeiro.', {
          duration: 5000,
          icon: '📱'
        });
      } else {
        toast.error(errorData?.message || 'Erro ao iniciar campanha');
      }
    }
  };

  const handleCancel = (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'cancel',
      id: id
    });
  };

  const handleDelete = (id) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      id: id
    });
  };

  const handleRecreateCampaign = (campaignId) => {
    loadCampaignForRecreate(campaignId);
  };

  const handleDownloadLeads = async (campaignId) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}/export`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `campaign_${campaignId}_leads.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Download iniciado!');
    } catch (error) {
      toast.error('Erro ao baixar leads');
    }
  };

  const handleEditInstances = async (campaign) => {
    setEditingCampaign(campaign);

    // Fetch current instances for this campaign
    try {
      const { data } = await api.get(`/campaigns/${campaign.id}/instances`);
      if (data.success) {
        setEditInstanceIds(data.instances.map(i => i.instance_id));
      }
    } catch (error) {
      setEditInstanceIds([]);
    }

    setShowEditInstancesModal(true);
  };

  const handleSaveInstances = async () => {
    if (editInstanceIds.length === 0) {
      toast.error('Selecione pelo menos uma instância');
      return;
    }

    try {
      const { data } = await api.put(`/campaigns/${editingCampaign.id}/instances`, {
        instanceIds: editInstanceIds
      });

      if (data.success) {
        toast.success('Instâncias atualizadas com sucesso!');
        setShowEditInstancesModal(false);
        setEditingCampaign(null);
        setEditInstanceIds([]);
        fetchCampaigns();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar instâncias');
    }
  };

  const handleToggleEditInstance = (instanceId) => {
    setEditInstanceIds(prev => {
      const isSelected = prev.includes(instanceId);
      return isSelected
        ? prev.filter(id => id !== instanceId)
        : [...prev, instanceId];
    });
  };

  const executeAction = async () => {
    const { action, id } = confirmModal;

    try {
      if (action === 'cancel') {
        const { data } = await api.post(`/campaigns/${id}/cancel`);
        if (data.success) {
          toast.success(data.message);
          fetchCampaigns();
        }
      } else if (action === 'delete') {
        const { data } = await api.delete(`/campaigns/${id}`);
        if (data.success) {
          toast.success(data.message);
          fetchCampaigns();
        }
      } else if (action === 'retry') {
        const { data } = await api.post(`/campaigns/${id}/retry-failed`);
        if (data.success) {
          toast.success(data.message);
          fetchCampaigns(); // Refresh the list to show new campaign
        }
      }
    } catch (error) {
      if (action === 'cancel') {
        toast.error('Erro ao cancelar campanha');
      } else if (action === 'retry') {
        toast.error(error.response?.data?.message || 'Erro ao criar campanha de retentativa');
      } else {
        toast.error(error.response?.data?.message || 'Erro ao excluir campanha');
      }
    } finally {
      setConfirmModal({ isOpen: false, action: null, id: null });
    }
  };

  const handleExportFailed = async (campaignId, campaignName) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}/export-failed`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `falhas-${campaignName}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Números com falha exportados com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao exportar números com falha');
    }
  };

  const handleRetryFailed = (campaignId, failedCount) => {
    setConfirmModal({
      isOpen: true,
      action: 'retry',
      id: campaignId,
      title: 'Retentar Números com Falha',
      message: `Deseja criar uma nova campanha com os ${failedCount} números que falharam?`,
      confirmText: 'Criar Campanha',
      danger: false
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      processing: { text: 'Em Andamento', class: styles.statusProcessing },
      completed: { text: 'Concluída', class: styles.statusCompleted },
      paused: { text: 'Pausada', class: styles.statusPaused },
      pending: { text: 'Pendente', class: styles.statusPending },
      cancelled: { text: 'Cancelada', class: styles.statusCancelled },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loader}>Carregando...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
            <p>Gerencie suas campanhas de envio</p>
        </div>
        <button onClick={handleOpenModal} className={styles.createBtn}>
          <Plus size={20} />
          Nova Campanha
        </button>
      </div>

      {/* Filters and Sorting - Always show after loading */}
      {!loading && (
        <div className={styles.filtersBar}>
          <div className={styles.filterGroup}>
            <Filter size={18} />
            <select value={filters.status} onChange={handleFilterChange} className={styles.filterSelect}>
              <option value="all">Todos os Status</option>
              <option value="pending">Pendente</option>
              <option value="processing">Em Andamento</option>
              <option value="paused">Pausada</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>

          <div className={styles.sortGroup}>
            <span className={styles.sortLabel}>Ordenar por:</span>
            <button
              onClick={() => handleSort('id')}
              className={`${styles.sortBtn} ${sorting.column === 'id' ? styles.active : ''}`}
            >
              Número
              {sorting.column === 'id' && (
                sorting.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
              )}
            </button>
            <button
              onClick={() => handleSort('status')}
              className={`${styles.sortBtn} ${sorting.column === 'status' ? styles.active : ''}`}
            >
              Status
              {sorting.column === 'status' && (
                sorting.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
              )}
            </button>
            <button
              onClick={() => handleSort('created_at')}
              className={`${styles.sortBtn} ${sorting.column === 'created_at' ? styles.active : ''}`}
            >
              Data de Criação
              {sorting.column === 'created_at' && (
                sorting.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
              )}
            </button>
            <button
              onClick={() => handleSort('sent_count')}
              className={`${styles.sortBtn} ${sorting.column === 'sent_count' ? styles.active : ''}`}
            >
              Enviadas
              {sorting.column === 'sent_count' && (
                sorting.direction === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />
              )}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className={styles.campaignsList}>
          {[...Array(6)].map((_, index) => (
            <div key={index} className={styles.skeletonCard}>
              <div className={styles.skeletonHeader}>
                <div className={styles.skeletonTitle}></div>
                <div className={styles.skeletonBadge}></div>
              </div>
              <div className={styles.skeletonStats}>
                <div className={styles.skeletonStat}></div>
                <div className={styles.skeletonStat}></div>
                <div className={styles.skeletonStat}></div>
                <div className={styles.skeletonStat}></div>
              </div>
              <div className={styles.skeletonProgress}></div>
              <div className={styles.skeletonActions}>
                <div className={styles.skeletonButton}></div>
                <div className={styles.skeletonButton}></div>
              </div>
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className={styles.emptyState}>
          {filters.status !== 'all' || sorting.column !== 'created_at' ? (
            <>
              <Megaphone size={64} />
              <h3>Nenhuma campanha encontrada</h3>
              <p>Não há campanhas que correspondam aos filtros aplicados</p>
              <button
                onClick={() => {
                  setFilters({ status: 'all' });
                  setSorting({ column: 'created_at', direction: 'desc' });
                }}
                className={styles.createBtn}
              >
                Limpar Filtros
              </button>
            </>
          ) : (
            <>
              <Megaphone size={64} />
              <h3>Nenhuma campanha criada</h3>
              <p>Crie sua primeira campanha para começar</p>
              <button onClick={handleOpenModal} className={styles.createBtn}>
                <Plus size={20} />
                Criar Campanha
              </button>
            </>
          )}
        </div>
      ) : (
        <div className={styles.campaignsList}>
          {campaigns.map((campaign) => {
            const statusBadge = getStatusBadge(campaign.status);
            const progress = campaign.total_numbers > 0
              ? Math.round((campaign.sent_count / campaign.total_numbers) * 100)
              : 0;

            return (
              <div key={campaign.id} className={styles.campaignCard}>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className={styles.deleteCardBtn}
                  title="Excluir campanha"
                >
                  <Trash2 size={18} />
                </button>
                <Link to={`/app/campaigns/${campaign.id}`} className={styles.campaignLink}>
                  <div className={styles.campaignHeader}>
                    <div>
                      <h3>{campaign.name}</h3>
                      <span className={styles.templateName}>
                        Template: {campaign.template_name || 'N/A'}
                      </span>
                    </div>
                    <span className={`${styles.statusBadge} ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                  </div>

                  <div className={styles.campaignStats}>
                    <div className={styles.stat}>
                      <span>Total</span>
                      <strong>{campaign.total_numbers || 0}</strong>
                    </div>
                    <div className={styles.stat}>
                      <span>Enviadas</span>
                      <strong>{campaign.sent_count || 0}</strong>
                    </div>
                    <div className={styles.stat}>
                      <span>Sucesso</span>
                      <strong>{campaign.success_count || 0}</strong>
                    </div>
                    <div className={styles.stat}>
                      <span>Falhas</span>
                      <strong>{campaign.failed_count || 0}</strong>
                    </div>
                  </div>

                  <div className={styles.progressBar}>
                    <div
                      className={styles.progressFill}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className={styles.progressText}>{progress}% concluído</span>
                </Link>

                <div className={styles.campaignActions}>
                  {campaign.status === 'pending' && campaign.total_numbers === 0 && (
                    <Link
                      to={`/app/campaigns/${campaign.id}`}
                      className={styles.addNumbersBtn}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <FileUp size={16} />
                      Adicionar Números
                    </Link>
                  )}
                  {campaign.status === 'pending' && campaign.total_numbers > 0 && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleStart(campaign.id);
                      }}
                      className={styles.startBtn}
                    >
                      <Play size={16} />
                      Iniciar Campanha
                    </button>
                  )}
                  {campaign.status === 'processing' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handlePause(campaign.id);
                      }}
                      className={styles.pauseBtn}
                    >
                      <Pause size={16} />
                      Pausar
                    </button>
                  )}
                  {campaign.status === 'paused' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleResume(campaign.id);
                      }}
                      className={styles.resumeBtn}
                    >
                      <Play size={16} />
                      Retomar
                    </button>
                  )}
                  {(campaign.status === 'pending' || campaign.status === 'paused') && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleEditInstances(campaign);
                      }}
                      className={styles.editInstancesBtn}
                      title="Gerenciar Instâncias"
                    >
                      <Settings size={16} />
                      Instâncias
                    </button>
                  )}
                  {(campaign.status === 'processing' || campaign.status === 'paused') && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleCancel(campaign.id);
                      }}
                      className={styles.cancelBtn}
                    >
                      <X size={16} />
                      Cancelar
                    </button>
                  )}
                  {campaign.status === 'completed' && campaign.failed_count > 0 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleExportFailed(campaign.id, campaign.name);
                        }}
                        className={styles.exportFailedBtn}
                      >
                        <Download size={16} />
                        Exportar Falhas ({campaign.failed_count})
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRetryFailed(campaign.id, campaign.failed_count);
                        }}
                        className={styles.retryBtn}
                      >
                        <Play size={16} />
                        Retentar Falhas
                      </button>
                    </>
                  )}
                  {campaign.status === 'completed' && (
                    <>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleRecreateCampaign(campaign.id);
                        }}
                        className={styles.recreateBtn}
                      >
                        <RotateCcw size={16} />
                        Recriar
                      </button>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          handleDownloadLeads(campaign.id);
                        }}
                        className={styles.downloadLeadsBtn}
                      >
                        <Download size={16} />
                        Baixar Leads
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && campaigns.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Create Modal */}
      {showModal && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{isRecreating ? 'Recriar Campanha' : 'Nova Campanha'}</h2>
              <button onClick={handleCloseModal} className={styles.closeBtn}>×</button>
            </div>

            {isRecreating && recreateNumbers.length > 0 && (
              <div className={styles.recreateInfo}>
                <CheckCircle2 size={18} />
                <span>{recreateNumbers.length} números serão adicionados automaticamente</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome da Campanha *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Promoção Black Friday"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Template Principal *</label>
                <select
                  name="templateId"
                  value={formData.templateId}
                  onChange={handleChange}
                  required
                >
                  {templates.map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Template 2 (Rotação)</label>
                  <select
                    name="templateId2"
                    value={formData.templateId2}
                    onChange={handleChange}
                  >
                    <option value="">Nenhum</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label>Template 3 (Rotação)</label>
                  <select
                    name="templateId3"
                    value={formData.templateId3}
                    onChange={handleChange}
                  >
                    <option value="">Nenhum</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label>Instâncias *</label>
                {instances.length === 0 ? (
                  <p className={styles.noInstances}>
                    Nenhuma instância conectada. <Link to="/app/instances">Conectar instância</Link>
                  </p>
                ) : (
                  <button
                    type="button"
                    className={styles.selectInstancesBtn}
                    onClick={() => setShowInstancesModal(true)}
                  >
                    <Smartphone size={18} />
                    {formData.instanceIds.length === 0
                      ? 'Selecionar instâncias'
                      : `${formData.instanceIds.length} instância(s) selecionada(s)`}
                  </button>
                )}
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Intervalo Mínimo (segundos)</label>
                  <input
                    type="number"
                    name="minInterval"
                    value={formData.minInterval}
                    onChange={handleChange}
                    min="0"
                    max="60"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Intervalo Máximo (segundos)</label>
                  <input
                    type="number"
                    name="maxInterval"
                    value={formData.maxInterval}
                    onChange={handleChange}
                    min="15"
                    max="120"
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.checkbox}>
                  <input
                    type="checkbox"
                    name="useAntiBan"
                    checked={formData.useAntiBan}
                    onChange={handleChange}
                  />
                  <span>Usar Sistema Anti-Ban (Recomendado)</span>
                </label>
                <p className={styles.antiBanInfo}>
                  Alterna entre instâncias a cada 3 msgs, aplica intervalos aleatórios e simula comportamento humano para evitar bloqueios.
                </p>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.cancelButton}
                  disabled={submitting}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={styles.submitBtn}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className={styles.spinner} />
                      Criando...
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      Criar Campanha
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, id: null })}
        onConfirm={executeAction}
        title={confirmModal.title || (confirmModal.action === 'delete' ? 'Excluir Campanha' : 'Cancelar Campanha')}
        message={confirmModal.message || (confirmModal.action === 'delete'
          ? 'Tem certeza que deseja excluir esta campanha? Esta ação não pode ser desfeita.'
          : 'Deseja cancelar esta campanha?')}
        confirmText={confirmModal.confirmText || (confirmModal.action === 'delete' ? 'Excluir' : 'Cancelar')}
        danger={confirmModal.danger !== undefined ? confirmModal.danger : confirmModal.action === 'delete'}
      />

      {/* Edit Instances Modal */}
      {showEditInstancesModal && (
        <div className={styles.modalOverlay} onClick={() => setShowEditInstancesModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Gerenciar Instâncias</h2>
              <button
                onClick={() => setShowEditInstancesModal(false)}
                className={styles.modalClose}
              >
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Campanha: {editingCampaign?.name}</label>
                {instances.length === 0 ? (
                  <p className={styles.noInstances}>
                    Nenhuma instância conectada. <Link to="/app/instances">Conectar instância</Link>
                  </p>
                ) : (
                  <div className={styles.instancesCheckboxList}>
                    {instances.map((instance) => (
                      <label key={instance.id} className={styles.instanceCheckboxItem}>
                        <input
                          type="checkbox"
                          checked={editInstanceIds.includes(instance.id)}
                          onChange={() => handleToggleEditInstance(instance.id)}
                        />
                        <span>{instance.instance_name || `Instância ${instance.id}`}</span>
                        <small>{instance.phone_number || ''}</small>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowEditInstancesModal(false)}
                className={styles.cancelButton}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveInstances}
                className={styles.submitButton}
                disabled={editInstanceIds.length === 0}
              >
                <CheckCircle2 size={18} />
                Salvar Instâncias
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Select Instances Modal */}
      {showInstancesModal && (
        <div className={styles.modalOverlay} onClick={() => setShowInstancesModal(false)}>
          <div className={styles.instancesModalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>Selecionar Instâncias</h2>
              <button
                onClick={() => setShowInstancesModal(false)}
                className={styles.modalClose}
              >
                <X size={24} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.instancesCheckboxList}>
                {instances.map((instance) => (
                  <label key={instance.id} className={styles.instanceCheckboxItem}>
                    <input
                      type="checkbox"
                      checked={formData.instanceIds.includes(instance.id)}
                      onChange={() => handleInstanceToggle(instance.id)}
                    />
                    <span>{instance.instance_name || `Instância ${instance.id}`}</span>
                    <small>{instance.phone_number || ''}</small>
                  </label>
                ))}
              </div>
            </div>

            <div className={styles.modalFooter}>
              <button
                onClick={() => setShowInstancesModal(false)}
                className={styles.cancelButton}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show Monitor Button */}
      {showMonitorButton && (
        <button
          onClick={handleOpenMonitor}
          className={styles.showMonitorBtn}
          title="Mostrar Monitor de Campanhas"
        >
          <Megaphone size={24} />
        </button>
      )}
    </div>
  );
}

export default Campaigns;
