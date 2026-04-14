import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import socketService from '../lib/socket';
import {
  ArrowLeft,
  Upload,
  Play,
  Pause,
  X,
  Download,
  RefreshCw,
  GripVertical,
  ArrowUpToLine,
  Loader2,
  TrendingUp,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  Activity,
  Zap
} from 'lucide-react';
import Pagination from '../components/Pagination';
import MoveToTopModal from '../components/MoveToTopModal';
import ConfirmModal from '../components/ConfirmModal';
import styles from './CampaignDetails.module.css';

function CampaignDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [numbers, setNumbers] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState(null);
  const [manualNumbers, setManualNumbers] = useState('');
  const [processingManual, setProcessingManual] = useState(false);
  const [numbersPagination, setNumbersPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20
  });
  const [numbersFilter, setNumbersFilter] = useState({
    status: 'all',
    search: ''
  });
  const [draggedNumber, setDraggedNumber] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedNumberToMove, setSelectedNumberToMove] = useState(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastEventTime, setLastEventTime] = useState(null);
  const [eventCount, setEventCount] = useState(0);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    danger: false
  });
  const currentCampaignId = useRef(null);

  // Socket event handlers
  const handleProgressUpdate = useCallback((data) => {
    if (data.campaignId === parseInt(id)) {
      const now = new Date().toLocaleTimeString();
      // Update event tracking
      setLastEventTime(now);
      setEventCount(prev => prev + 1);

      // Update progress state immediately
      setProgress({
        total: data.total,
        success: data.success,
        failed: data.failed,
        sent: data.sent,
        pending: data.pending,
        percentage: data.percentage
      });

      // Update campaign stats in real-time
      setCampaign(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sent_count: data.sent || 0,
          success_count: data.success || 0,
          failed_count: data.failed || 0,
          total_numbers: data.total || prev.total_numbers
        };
      });
    }
  }, [id]);

  const handleMessageProcessing = useCallback((data) => {
    if (data.campaignId === parseInt(id)) {
      setNumbers(prev => {
        const found = prev.find(num => num.id === data.numberId);
        if (!found) return prev;
        return prev.map(num =>
          num.id === data.numberId
            ? { ...num, status: 'processing' }
            : num
        );
      });
    }
  }, [id]);

  const handleMessageSent = useCallback((data) => {
    if (data.campaignId === parseInt(id)) {
      setNumbers(prev => {
        const found = prev.find(num => num.id === data.numberId);
        if (!found) return prev;
        return prev.map(num =>
          num.id === data.numberId
            ? { ...num, status: 'sent', sent_at: new Date().toISOString() }
            : num
        );
      });

      setCampaign(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sent_count: (prev.sent_count || 0) + 1,
          success_count: (prev.success_count || 0) + 1
        };
      });
    }
  }, [id]);

  const handleMessageFailed = useCallback((data) => {
    if (data.campaignId === parseInt(id)) {
      setNumbers(prev => {
        const found = prev.find(num => num.id === data.numberId);
        if (!found) return prev;
        return prev.map(num =>
          num.id === data.numberId
            ? { ...num, status: 'failed', error_message: data.error }
            : num
        );
      });

      setCampaign(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          sent_count: (prev.sent_count || 0) + 1,
          failed_count: (prev.failed_count || 0) + 1
        };
      });

      toast.error(`Falha ao enviar para ${data.phoneNumber}`);
    }
  }, [id]);

  const handleCampaignCompleted = useCallback((data) => {
    if (data.campaignId === parseInt(id)) {
      fetchCampaign();
      toast.success('Campanha concluída!');
    }
  }, [id]);

  const handleCampaignAutoPaused = useCallback((data) => {
    if (data.campaignId === parseInt(id)) {
      fetchCampaign();

      if (data.reason === 'no_instance') {
        toast.error('⏸️ Campanha pausada: Nenhuma instância conectada', {
          duration: 6000
        });
      } else if (data.reason === 'instance_disconnected') {
        toast.error('⏸️ Campanha pausada: WhatsApp desconectado', {
          duration: 6000
        });
      } else if (data.reason === 'connection_error') {
        toast.error('⏸️ Campanha pausada: Erro de conexão', {
          duration: 6000
        });
      } else {
        toast.error(`⏸️ ${data.message}`, {
          duration: 6000
        });
      }
    }
  }, [id]);

  const handleCampaignStatusChanged = useCallback((data) => {
    if (data.campaignId === parseInt(id)) {
      setCampaign(prev => {
        if (!prev) return prev;
        return { ...prev, status: data.status };
      });
    }
  }, [id]);

  useEffect(() => {
    fetchCampaign();
    fetchNumbers(1);

    // Join campaign room (socket is already connected from Layout)
    const joinRoom = async () => {
      const connected = await socketService.joinCampaign(id);
      if (connected !== false) {
        setSocketConnected(true);
      } else {
        setSocketConnected(false);
      }
    };

    joinRoom();
    currentCampaignId.current = id;

    // Monitor socket connection status
    const checkConnection = setInterval(() => {
      const isConnected = socketService.isConnected();
      setSocketConnected(isConnected);

      // If reconnected, rejoin the room
      if (isConnected && !socketService.joinedRooms.has(`campaign:${id}`)) {
        socketService.joinCampaign(id);
      }
    }, 2000);

    // Real-time polling: Request progress every 1 second when campaign is processing
    const progressPolling = setInterval(() => {
      if (socketService.isConnected() && campaign?.status === 'processing') {
        socketService.emit('request-campaign-progress', id);

        // Also refresh the numbers table to show updated statuses
        fetchNumbers(numbersPagination.currentPage, false); // false = don't show loading
      }
    }, 1000);

    // Fallback: fetch progress if socket disconnects
    const fallbackInterval = setInterval(() => {
      if (!socketService.isConnected()) {
        fetchProgress();
      }
    }, 30000);

    return () => {
      clearInterval(progressPolling);
      clearInterval(fallbackInterval);
      clearInterval(checkConnection);
      socketService.leaveCampaign(id);
    };
  }, [id, campaign?.status]);

  // Separate useEffect for socket listeners to ensure they update with handlers
  useEffect(() => {
    socketService.on('campaign-progress', handleProgressUpdate);
    socketService.on('message-processing', handleMessageProcessing);
    socketService.on('message-sent', handleMessageSent);
    socketService.on('message-failed', handleMessageFailed);
    socketService.on('campaign-completed', handleCampaignCompleted);
    socketService.on('campaign-auto-paused', handleCampaignAutoPaused);
    socketService.on('campaign-status-changed', handleCampaignStatusChanged);
    return () => {
      socketService.off('campaign-progress', handleProgressUpdate);
      socketService.off('message-processing', handleMessageProcessing);
      socketService.off('message-sent', handleMessageSent);
      socketService.off('message-failed', handleMessageFailed);
      socketService.off('campaign-completed', handleCampaignCompleted);
      socketService.off('campaign-auto-paused', handleCampaignAutoPaused);
      socketService.off('campaign-status-changed', handleCampaignStatusChanged);
    };
  }, [id, handleProgressUpdate, handleMessageProcessing, handleMessageSent, handleMessageFailed, handleCampaignCompleted, handleCampaignAutoPaused, handleCampaignStatusChanged]);

  useEffect(() => {
    if (id) {
      fetchNumbers(numbersPagination.currentPage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [numbersPagination.currentPage, numbersFilter.status, numbersFilter.search]);

  const fetchCampaign = async () => {
    try {
      const { data } = await api.get(`/campaigns/${id}`);
      if (data.success) {
        setCampaign(data.campaign);
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar campanha');
      }
      navigate('/campaigns');
    } finally {
      setLoading(false);
    }
  };

  const fetchNumbers = async (page = 1, showLoading = true) => {
    try {
      const params = new URLSearchParams({
        page,
        limit: 20
      });

      if (numbersFilter.status !== 'all') {
        params.append('status', numbersFilter.status);
      }

      if (numbersFilter.search.trim()) {
        params.append('search', numbersFilter.search.trim());
      }

      const { data } = await api.get(`/campaigns/${id}/numbers?${params.toString()}`);
      if (data.success) {
        setNumbers(data.numbers || []);
        if (data.pagination) {
          setNumbersPagination(data.pagination);
        }
      }
    } catch (error) {
      if (showLoading) {
      }
    }
  };

  const handleNumbersPageChange = (page) => {
    setNumbersPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNumbersFilterChange = (filterType, value) => {
    setNumbersFilter(prev => ({
      ...prev,
      [filterType]: value
    }));
    setNumbersPagination(prev => ({ ...prev, currentPage: 1 })); // Reset to first page
  };

  // Drag and Drop handlers
  const handleDragStart = (e, numberId) => {
    setDraggedNumber(numberId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', numberId);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedNumber(null);
    setDragOverIndex(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = async (e, dropIndex) => {
    e.preventDefault();
    setDragOverIndex(null);

    if (draggedNumber === null) return;

    const draggedIndex = numbers.findIndex(n => n.id === draggedNumber);
    if (draggedIndex === dropIndex || draggedIndex === -1) return;

    // Create new order for current page
    const newNumbers = [...numbers];
    const [removed] = newNumbers.splice(draggedIndex, 1);
    newNumbers.splice(dropIndex, 0, removed);

    // Update local state immediately for better UX
    setNumbers(newNumbers);

    // Get all number IDs in new order (for current page only)
    // Note: This reorders only the numbers on the current page
    const newOrderIds = newNumbers.map(n => n.id);

    try {
      // Send reorder request to backend
      const { data } = await api.post(`/campaigns/${id}/numbers/reorder`, {
        numberIds: newOrderIds
      });

      if (data.success) {
        toast.success('Ordem atualizada com sucesso!');
        // Reload numbers to get updated order from database
        fetchNumbers(numbersPagination.currentPage);
      }
    } catch (error) {
      // Revert on error
      setNumbers(numbers);
      toast.error(error.response?.data?.message || 'Erro ao reordenar números');
    }

    setDraggedNumber(null);
  };

  const handleMoveToTop = (numberId, phoneNumber) => {
    setSelectedNumberToMove({ id: numberId, phone: phoneNumber });
    setShowMoveModal(true);
  };

  const confirmMoveToTop = async () => {
    if (!selectedNumberToMove) return;

    setShowMoveModal(false);

    try {
      const { data } = await api.post(`/campaigns/${id}/numbers/${selectedNumberToMove.id}/move-to-top`);

      if (data.success) {
        toast.success('Número movido para o topo!');
        // Reload the first page to show the moved number
        setNumbersPagination(prev => ({ ...prev, currentPage: 1 }));
        fetchNumbers(1);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao mover número');
    } finally {
      setSelectedNumberToMove(null);
    }
  };

  const fetchProgress = async () => {
    try {
      const { data } = await api.get(`/campaigns/${id}/progress`);
      if (data.success) {
        setProgress(data.progress);
      }
    } catch (error) {
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file) {
      toast.error('Selecione um arquivo TXT ou CSV');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);

    try {
      const { data } = await api.post(`/campaigns/${id}/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (data.success) {
        toast.success(data.message);
        setFile(null);
        fetchCampaign();
        fetchNumbers(1); // Reset to first page and reload numbers
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao fazer upload');
    } finally {
      setUploading(false);
    }
  };

  const handleManualSubmit = async (e) => {
    e.preventDefault();

    if (!manualNumbers.trim()) {
      toast.error('Cole ou digite os números');
      return;
    }

    setProcessingManual(true);

    try {
      const { data } = await api.post(`/campaigns/${id}/add-numbers`, {
        numbers: manualNumbers
      });

      if (data.success) {
        toast.success(data.message);
        setManualNumbers('');
        fetchCampaign();
        fetchNumbers(1); // Reset to first page and reload numbers
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao processar números');
    } finally {
      setProcessingManual(false);
    }
  };

  const handleStart = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Iniciar Campanha',
      message: 'Deseja iniciar esta campanha?',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          const { data } = await api.post(`/campaigns/${id}/start`);
          if (data.success) {
            toast.success(data.message);
            fetchCampaign();
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
      },
      danger: false
    });
  };

  const handlePause = async () => {
    try {
      const { data } = await api.post(`/campaigns/${id}/pause`);
      if (data.success) {
        toast.success(data.message);
        fetchCampaign();
      }
    } catch (error) {
      toast.error('Erro ao pausar campanha');
    }
  };

  const handleResume = async () => {
    try {
      const { data } = await api.post(`/campaigns/${id}/resume`);
      if (data.success) {
        toast.success(data.message);
        fetchCampaign();
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

  const handleCancel = () => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancelar Campanha',
      message: 'Deseja cancelar esta campanha? Esta ação não pode ser desfeita.',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          const { data } = await api.post(`/campaigns/${id}/cancel`);
          if (data.success) {
            toast.success(data.message);
            fetchCampaign();
          }
        } catch (error) {
          toast.error('Erro ao cancelar campanha');
        }
      },
      danger: true
    });
  };

  const handleExport = async () => {
    try {
      const response = await api.get(`/campaigns/${id}/export`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `leads-${campaign.name}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Leads exportados com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao exportar leads');
    }
  };

  const handleExportFailedNumbers = async () => {
    try {
      const response = await api.get(`/campaigns/${id}/export-failed`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `falhas-${campaign.name}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Números com falha exportados com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao exportar números com falha');
    }
  };

  const handleExportPendingNumbers = async () => {
    try {
      const response = await api.get(`/campaigns/${id}/export-pending`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pendentes-${campaign.name}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Números pendentes exportados com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao exportar números pendentes');
    }
  };

  const handleExportSentNumbers = async () => {
    try {
      const response = await api.get(`/campaigns/${id}/export-sent`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `enviados-${campaign.name}-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Números enviados exportados com sucesso!');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao exportar números enviados');
    }
  };

  const handleRetryFailedNumbers = () => {
    const failedCount = progress?.failed ?? campaign?.failed_count ?? 0;
    setConfirmModal({
      isOpen: true,
      title: 'Retentar Números com Falha',
      message: `Deseja criar uma nova campanha com os ${failedCount} números que falharam?`,
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          const { data } = await api.post(`/campaigns/${id}/retry-failed`);
          if (data.success) {
            toast.success(data.message);
            // Navigate to the new campaign
            if (data.newCampaignId) {
              navigate(`/app/campaigns/${data.newCampaignId}`);
            }
          }
        } catch (error) {
          toast.error(error.response?.data?.message || 'Erro ao criar campanha de retentativa');
        }
      },
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

  const getNumberStatusBadge = (status) => {
    const badges = {
      sent: { text: 'Enviado', class: styles.numberSent },
      failed: { text: 'Falha', class: styles.numberFailed },
      processing: { text: 'Processando', class: styles.numberProcessing },
      pending: { text: 'Pendente', class: styles.numberPending },
    };
    return badges[status] || badges.pending;
  };

  if (loading) {
    return (
      <div className={styles.container}>
        {/* Skeleton Header */}
        <div className={styles.skeletonHeader}>
          <div className={styles.skeletonBackBtn}></div>
          <div className={styles.skeletonTitleWrapper}>
            <div className={styles.skeletonTitle}></div>
            <div className={styles.skeletonBadge}></div>
          </div>
          <div className={styles.skeletonActions}>
            <div className={styles.skeletonActionBtn}></div>
            <div className={styles.skeletonActionBtn}></div>
          </div>
        </div>

        {/* Skeleton Stats Grid */}
        <div className={styles.statsGrid}>
          {[...Array(6)].map((_, index) => (
            <div key={index} className={styles.skeletonStatCard}>
              <div className={styles.skeletonStatLabel}></div>
              <div className={styles.skeletonStatValue}></div>
            </div>
          ))}
        </div>

        {/* Skeleton Progress Bar */}
        <div className={styles.skeletonProgressSection}>
          <div className={styles.skeletonProgressBar}></div>
          <div className={styles.skeletonProgressText}></div>
        </div>

        {/* Skeleton Upload Section */}
        <div className={styles.skeletonUploadSection}>
          <div className={styles.skeletonUploadTitle}></div>
          <div className={styles.skeletonUploadBox}></div>
        </div>

        {/* Skeleton Numbers Table */}
        <div className={styles.skeletonNumbersSection}>
          <div className={styles.skeletonSectionTitle}></div>
          {[...Array(5)].map((_, index) => (
            <div key={index} className={styles.skeletonNumberRow}></div>
          ))}
        </div>
      </div>
    );
  }

  if (!campaign) {
    return null;
  }

  const statusBadge = getStatusBadge(campaign.status);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button onClick={() => navigate(-1)} className={styles.backBtn}>
            <ArrowLeft size={20} />
            Voltar
          </button>
          <div>
            <h1>{campaign.name}</h1>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span className={`${styles.statusBadge} ${statusBadge.class}`}>
                {statusBadge.text}
              </span>
              {socketConnected && (
                <span className={styles.liveIndicator} title={`Eventos recebidos: ${eventCount} | Último: ${lastEventTime || 'N/A'}`}>
                  <span className={styles.liveDot}></span>
                  AO VIVO
                  {eventCount > 0 && (
                    <span style={{ fontSize: '0.7rem', opacity: 0.8, marginLeft: '4px' }}>
                      ({eventCount})
                    </span>
                  )}
                </span>
              )}
            </div>
          </div>
        </div>
        <div className={styles.headerActions}>
          {campaign.status === 'pending' && numbers.length > 0 && (
            <button onClick={handleStart} className={styles.startBtn}>
              <Play size={18} />
              Iniciar Campanha
            </button>
          )}
          {campaign.status === 'processing' && (
            <button onClick={handlePause} className={styles.pauseBtn}>
              <Pause size={18} />
              Pausar
            </button>
          )}
          {campaign.status === 'paused' && (
            <button onClick={handleResume} className={styles.resumeBtn}>
              <Play size={18} />
              Retomar
            </button>
          )}
          {(campaign.status === 'processing' || campaign.status === 'paused') && (
            <button onClick={handleCancel} className={styles.cancelBtn}>
              <X size={18} />
              Cancelar
            </button>
          )}
          <button onClick={fetchCampaign} className={styles.refreshBtn}>
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Progress Stats */}
      {(progress || campaign) && (
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span>Total de Números</span>
            <strong>{progress?.total || campaign?.total_numbers || 0}</strong>
          </div>
          <div className={styles.statCard}>
            <span>Enviadas com Sucesso</span>
            <strong className={styles.success}>
              {progress?.success ?? campaign?.success_count ?? 0}
            </strong>
          </div>
          <div className={styles.statCard}>
            <span>Falhas</span>
            <strong className={styles.danger}>
              {progress?.failed ?? campaign?.failed_count ?? 0}
            </strong>
          </div>
          <div className={styles.statCard}>
            <span>Pendentes</span>
            <strong className={styles.warning}>
              {progress?.pending ?? ((campaign?.total_numbers || 0) - (campaign?.sent_count || 0))}
            </strong>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      {progress && progress.total > 0 && (
        <div className={styles.progressSection}>
          <div className={styles.progressHeader}>
            <span>Progresso</span>
            <strong>{progress.percentage}%</strong>
          </div>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Instances Section */}
      {campaign && campaign.instances_used && campaign.instances_used.length > 0 && (
        <div className={styles.instancesSection}>
          <h3>Instâncias Utilizadas ({campaign.active_instances_count || campaign.instances_used.length})</h3>
          <div className={styles.instancesList}>
            {campaign.instances_used.map((instance, index) => (
              <div key={instance.id} className={styles.instanceCard}>
                <div className={styles.instanceIcon}>📱</div>
                <div className={styles.instanceInfo}>
                  <div className={styles.instancePhone}>
                    {instance.profileName || instance.name || `Instance ${instance.id}`}
                  </div>
                  {instance.phone && instance.phone !== 'N/A' && (
                    <div className={styles.instanceId}>📞 {instance.phone}</div>
                  )}
                  {instance.profileName && instance.name && instance.profileName !== instance.name && (
                    <div className={styles.instanceId} style={{ fontSize: '0.7rem', opacity: 0.7 }}>
                      {instance.name}
                    </div>
                  )}
                  <div className={styles.instanceId}>ID: {instance.id}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Section */}
      {campaign.status === 'pending' && (
        <div className={styles.uploadSection}>
          <h2>Upload de Números</h2>
          <form onSubmit={handleUpload} className={styles.uploadForm}>
            <div className={styles.fileInput}>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                id="csvFile"
              />
              <label htmlFor="csvFile" className={styles.fileLabel}>
                <Upload size={20} />
                {file ? file.name : 'Selecionar arquivo TXT ou CSV'}
              </label>
            </div>
            <button
              type="submit"
              disabled={!file || uploading}
              className={styles.uploadBtn}
            >
              {uploading ? 'Enviando...' : 'Fazer Upload'}
            </button>
          </form>
          <div className={styles.uploadInfo}>
            <p><strong>Formatos aceitos:</strong></p>
            <p><strong>TXT:</strong> Um número por linha (apenas números) - Ex: 5511999999999</p>
            <p><strong>CSV:</strong> phone, var1, var2, var3, var4, var5</p>
            <p>Exemplo CSV: 5511999999999, João, Produto X, ...</p>
          </div>

          {/* Manual Number Input */}
          <div className={styles.manualSection}>
            <h3>Ou Cole/Digite os Números</h3>
            <form onSubmit={handleManualSubmit} className={styles.manualForm}>
              <textarea
                className={styles.manualTextarea}
                value={manualNumbers}
                onChange={(e) => setManualNumbers(e.target.value)}
                placeholder="Cole ou digite os números aqui (um por linha)&#10;&#10;Exemplo:&#10;11999999999&#10;5511988888888&#10;21977777777&#10;&#10;✅ Remove duplicados automaticamente&#10;✅ Valida números&#10;✅ Adiciona 55 se necessário"
                rows={10}
              />
              <button
                type="submit"
                disabled={!manualNumbers.trim() || processingManual}
                className={styles.manualBtn}
              >
                {processingManual ? 'Processando...' : 'Adicionar Números'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Numbers Table */}
      {(numbers.length > 0 || numbersPagination.totalItems > 0) && (
        <div className={styles.numbersSection}>
          <div className={styles.sectionHeader}>
            <h2>
              Números da Campanha ({numbersPagination.totalItems || campaign?.total_numbers || 0})
              {(campaign?.status === 'processing' || campaign?.status === 'paused') && (
                <span style={{
                  marginLeft: '8px',
                  fontSize: '0.85rem',
                  color: '#10B981',
                  fontWeight: 'normal'
                }}>
                  • {progress?.success ?? campaign?.success_count ?? 0} enviadas
                </span>
              )}
            </h2>
            <div className={styles.headerActions}>
              <button onClick={handleExport} className={styles.exportBtn}>
                <Download size={18} />
                Exportar CSV
              </button>

              {(progress?.pending > 0 || (campaign && campaign.total_numbers - campaign.sent_count - campaign.failed_count > 0)) && (
                <button onClick={handleExportPendingNumbers} className={styles.exportPendingBtn}>
                  <Download size={18} />
                  Exportar Pendentes ({progress?.pending ?? (campaign.total_numbers - campaign.sent_count - campaign.failed_count) ?? 0})
                </button>
              )}

              {(campaign?.sent_count > 0 || progress?.sent > 0) && (
                <button onClick={handleExportSentNumbers} className={styles.exportSentBtn}>
                  <Download size={18} />
                  Exportar Enviados ({progress?.sent ?? campaign?.sent_count ?? 0})
                </button>
              )}

              {(campaign?.failed_count > 0 || progress?.failed > 0) && (
                <button onClick={handleExportFailedNumbers} className={styles.exportFailedBtn}>
                  <Download size={18} />
                  Exportar Falhas ({progress?.failed ?? campaign?.failed_count ?? 0})
                </button>
              )}

              {campaign?.status === 'completed' && (campaign?.failed_count > 0 || progress?.failed > 0) && (
                <button onClick={handleRetryFailedNumbers} className={styles.retryBtn}>
                  <Play size={18} />
                  Retentar Falhas
                </button>
              )}
            </div>
          </div>

          {/* Numbers Filter Bar */}
          <div className={styles.numbersFilterBar}>
            <div className={styles.filterGroup}>
              <label>Status:</label>
              <select
                value={numbersFilter.status}
                onChange={(e) => handleNumbersFilterChange('status', e.target.value)}
                className={styles.filterSelect}
              >
                <option value="all">Todos</option>
                <option value="pending">Pendentes</option>
                <option value="sent">Enviados</option>
                <option value="failed">Falhas</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label>Buscar:</label>
              <input
                type="text"
                value={numbersFilter.search}
                onChange={(e) => handleNumbersFilterChange('search', e.target.value)}
                placeholder="Número de telefone..."
                className={styles.filterInput}
              />
            </div>

            {(numbersFilter.status !== 'all' || numbersFilter.search) && (
              <button
                onClick={() => {
                  setNumbersFilter({ status: 'all', search: '' });
                  setNumbersPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
                className={styles.clearFiltersBtn}
              >
                Limpar Filtros
              </button>
            )}
          </div>

          {numbers.length > 0 ? (
            <>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>#</th>
                      <th>Número</th>
                      <th>Var1</th>
                      <th>Var2</th>
                      <th>Status</th>
                      <th>Instância</th>
                      <th>Enviado em</th>
                      {campaign?.status === 'pending' && <th style={{ width: '100px' }}>Ações</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {numbers.map((number, index) => {
                      const numStatusBadge = getNumberStatusBadge(number.status);
                      const globalIndex = (numbersPagination.currentPage - 1) * numbersPagination.itemsPerPage + index + 1;
                      const isDragging = draggedNumber === number.id;
                      const isDragOver = dragOverIndex === index;
                      
                      return (
                        <tr
                          key={number.id}
                          draggable={campaign?.status === 'pending'}
                          onDragStart={(e) => handleDragStart(e, number.id)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => handleDragOver(e, index)}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e, index)}
                          className={`${isDragging ? styles.dragging : ''} ${isDragOver ? styles.dragOver : ''}`}
                          style={{
                            cursor: campaign?.status === 'pending' ? 'move' : 'default',
                            opacity: isDragging ? 0.5 : 1
                          }}
                        >
                          <td className={styles.dragHandle}>
                            {campaign?.status === 'pending' && (
                              <GripVertical size={18} className={styles.gripIcon} />
                            )}
                          </td>
                          <td>{globalIndex}</td>
                          <td>{number.phone_number}</td>
                          <td>{number.var1 || '-'}</td>
                          <td>{number.var2 || '-'}</td>
                          <td>
                            <span className={`${styles.numberStatus} ${numStatusBadge.class}`}>
                              {numStatusBadge.text}
                            </span>
                          </td>
                          <td>
                            {number.instance_phone ? (
                              <div style={{ fontSize: '0.85rem' }}>
                                <div style={{ fontWeight: '500' }}>{number.instance_phone}</div>
                                {number.instance_id && (
                                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                                    ID: {number.instance_id}
                                  </div>
                                )}
                              </div>
                            ) : '-'}
                          </td>
                          <td>
                            {number.sent_at
                              ? new Date(number.sent_at).toLocaleString('pt-BR')
                              : '-'}
                          </td>
                          {campaign?.status === 'pending' && (
                            <td>
                              <button
                                onClick={() => handleMoveToTop(number.id, number.phone_number)}
                                className={styles.moveToTopBtn}
                                title="Mover para o topo"
                              >
                                <ArrowUpToLine size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {numbersPagination.totalPages > 1 && (
                <Pagination
                  currentPage={numbersPagination.currentPage}
                  totalPages={numbersPagination.totalPages}
                  totalItems={numbersPagination.totalItems}
                  itemsPerPage={numbersPagination.itemsPerPage}
                  onPageChange={handleNumbersPageChange}
                />
              )}
            </>
          ) : (
            <div className={styles.emptyState}>
              {numbersFilter.status !== 'all' || numbersFilter.search ? (
                <>
                  <p>Nenhum número encontrado com os filtros aplicados.</p>
                  <button
                    onClick={() => {
                      setNumbersFilter({ status: 'all', search: '' });
                      setNumbersPagination(prev => ({ ...prev, currentPage: 1 }));
                    }}
                    className={styles.clearFiltersBtn}
                  >
                    Limpar Filtros
                  </button>
                </>
              ) : (
                <p>Carregando números...</p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Move to Top Modal */}
      <MoveToTopModal
        isOpen={showMoveModal}
        onClose={() => {
          setShowMoveModal(false);
          setSelectedNumberToMove(null);
        }}
        onConfirm={confirmMoveToTop}
        phoneNumber={selectedNumberToMove?.phone || ''}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        danger={confirmModal.danger}
      />
    </div>
  );
}

export default CampaignDetails;
