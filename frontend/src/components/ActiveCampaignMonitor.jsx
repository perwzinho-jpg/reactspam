import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import socketService from '../lib/socket';
import { Megaphone, Play, Pause, X, Maximize2, Minimize2, RefreshCw, ChevronDown, ChevronUp, RotateCcw, Download } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import styles from './ActiveCampaignMonitor.module.css';

function ActiveCampaignMonitor() {
  const navigate = useNavigate();
  const [activeCampaigns, setActiveCampaigns] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [isClosed, setIsClosed] = useState(() => {
    return localStorage.getItem('campaignMonitorClosed') === 'true';
  });
  const [progress, setProgress] = useState({});
  const [collapsedCampaigns, setCollapsedCampaigns] = useState(new Set());
  const [expandedCampaign, setExpandedCampaign] = useState(null);
  const prevCampaignsRef = useRef([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    danger: false
  });

  // Socket event handlers with useCallback
  const handleProgressUpdate = useCallback((data) => {
    // Update progress state immediately
    setProgress(prev => ({
      ...prev,
      [data.campaignId]: {
        total: data.total,
        sent: data.sent,
        failed: data.failed,
        success: data.success,
        pending: data.pending,
        percentage: data.percentage
      }
    }));

    // Also update the campaign stats and status in the list
    setActiveCampaigns(prev => prev.map(campaign =>
      campaign.id === data.campaignId
        ? {
            ...campaign,
            sent_count: data.sent || 0,
            success_count: data.success || 0,
            failed_count: data.failed || 0,
            total_numbers: data.total || campaign.total_numbers,
            status: data.status || campaign.status
          }
        : campaign
    ));
  }, []);

  const handleMessageUpdate = useCallback((data) => {
  }, []);

  const handleInstanceDisconnected = useCallback((data) => {
    toast.error(
      `Instância "${data.instanceName}" desconectou. ${data.remainingInstances > 0 ? `Continuando com ${data.remainingInstances} instância(s).` : 'Campanha pausada.'}`,
      { duration: 5000, icon: '⚠️' }
    );
  }, []);

  const handleInstanceReconnected = useCallback((data) => {
    toast.success(
      `Instância "${data.instanceName}" reconectou!`,
      { duration: 3000, icon: '✅' }
    );
  }, []);

  const handleCampaignCompleted = useCallback((data) => {
    // Update status to completed instead of removing immediately
    // This allows the user to see the Recreate and Download buttons
    setActiveCampaigns(prev => prev.map(c =>
      c.id === data.campaignId ? { ...c, status: 'completed' } : c
    ));
  }, []);

  const handleCampaignPaused = useCallback((data) => {
    setActiveCampaigns(prev => prev.map(c =>
      c.id === data.campaignId ? { ...c, status: 'paused' } : c
    ));
  }, []);

  const handleCampaignStatusChanged = useCallback((data) => {
    setActiveCampaigns(prev => prev.map(c =>
      c.id === data.campaignId ? { ...c, status: data.status } : c
    ));

    // Remove only if cancelled (completed campaigns stay for Recreate/Download buttons)
    if (data.status === 'cancelled') {
      setTimeout(() => {
        setActiveCampaigns(prev => prev.filter(c => c.id !== data.campaignId));
        setProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[data.campaignId];
          return newProgress;
        });
      }, 2000);
    }
  }, []);

  useEffect(() => {
    fetchActiveCampaigns();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActiveCampaigns, 30000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Separate useEffect for socket listeners
  useEffect(() => {
    socketService.on('campaign-progress', handleProgressUpdate);
    socketService.on('campaign-completed', handleCampaignCompleted);
    socketService.on('campaign-auto-paused', handleCampaignPaused);
    socketService.on('campaign-status-changed', handleCampaignStatusChanged);
    socketService.on('message-sent', handleMessageUpdate);
    socketService.on('message-failed', handleMessageUpdate);
    socketService.on('instance-disconnected', handleInstanceDisconnected);
    socketService.on('instance-reconnected', handleInstanceReconnected);

    return () => {
      socketService.off('campaign-progress', handleProgressUpdate);
      socketService.off('campaign-completed', handleCampaignCompleted);
      socketService.off('campaign-auto-paused', handleCampaignPaused);
      socketService.off('campaign-status-changed', handleCampaignStatusChanged);
      socketService.off('message-sent', handleMessageUpdate);
      socketService.off('message-failed', handleMessageUpdate);
      socketService.off('instance-disconnected', handleInstanceDisconnected);
      socketService.off('instance-reconnected', handleInstanceReconnected);
    };
  }, [handleProgressUpdate, handleCampaignCompleted, handleCampaignPaused, handleCampaignStatusChanged, handleMessageUpdate, handleInstanceDisconnected, handleInstanceReconnected]);

  // Join campaign rooms when active campaigns change
  useEffect(() => {
    activeCampaigns.forEach(campaign => {
      socketService.joinCampaign(campaign.id);
    });

    return () => {
      activeCampaigns.forEach(campaign => {
        socketService.leaveCampaign(campaign.id);
      });
    };
  }, [activeCampaigns.map(c => c.id).join(',')]);

  // Auto-expand new campaigns and collapse others
  useEffect(() => {
    const prevIds = prevCampaignsRef.current.map(c => c.id);
    const currentIds = activeCampaigns.map(c => c.id);

    // Find new campaigns
    const newCampaigns = currentIds.filter(id => !prevIds.includes(id));

    if (newCampaigns.length > 0) {
      // Expand only the newest campaign
      setExpandedCampaign(newCampaigns[newCampaigns.length - 1]);
    } else if (activeCampaigns.length === 1 && expandedCampaign === null) {
      // If only one campaign and nothing expanded, expand it
      setExpandedCampaign(activeCampaigns[0].id);
    }

    prevCampaignsRef.current = activeCampaigns;
  }, [activeCampaigns]);

  const fetchActiveCampaigns = async () => {
    try {
      const { data } = await api.get('/campaigns/active');
      if (data.success) {
        setActiveCampaigns(data.campaigns || []);

        // Fetch initial progress for each campaign
        data.campaigns?.forEach(campaign => {
          fetchCampaignProgress(campaign.id);
        });
      }
    } catch (error) {
    }
  };

  const fetchCampaignProgress = async (campaignId) => {
    try {
      const { data } = await api.get(`/campaigns/${campaignId}/progress`);
      if (data.success) {
        setProgress(prev => ({
          ...prev,
          [campaignId]: data.progress
        }));
      }
    } catch (error) {
    }
  };

  const handlePause = async (campaignId, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/campaigns/${campaignId}/pause`);
      if (data.success) {
        setActiveCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, status: 'paused' } : c
        ));
      }
    } catch (error) {
    }
  };

  const handleResume = async (campaignId, e) => {
    e.stopPropagation();
    try {
      const { data } = await api.post(`/campaigns/${campaignId}/resume`);
      if (data.success) {
        setActiveCampaigns(prev => prev.map(c =>
          c.id === campaignId ? { ...c, status: 'processing' } : c
        ));
      }
    } catch (error) {
    }
  };

  const handleCancel = (campaignId, e) => {
    e.stopPropagation();
    setConfirmModal({
      isOpen: true,
      title: 'Cancelar Campanha',
      message: 'Deseja cancelar esta campanha?',
      onConfirm: async () => {
        setConfirmModal({ ...confirmModal, isOpen: false });
        try {
          const { data } = await api.post(`/campaigns/${campaignId}/cancel`);
          if (data.success) {
            setActiveCampaigns(prev => prev.filter(c => c.id !== campaignId));
            setProgress(prev => {
              const newProgress = { ...prev };
              delete newProgress[campaignId];
              return newProgress;
            });
          }
        } catch (error) {
        }
      },
      danger: true
    });
  };

  const handleRefresh = (e) => {
    e.stopPropagation();
    fetchActiveCampaigns();
  };

  const handleRecreate = (campaignId, e) => {
    e.stopPropagation();
    // Navigate to campaigns page with recreate parameter
    navigate(`/app/campaigns?recreate=${campaignId}`);
  };

  const handleDownloadLeads = async (campaignId, e) => {
    e.stopPropagation();
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
    } catch (error) {
    }
  };

  const navigateToCampaign = (campaignId) => {
    navigate(`/app/campaigns/${campaignId}`);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setIsClosed(true);
    localStorage.setItem('campaignMonitorClosed', 'true');
  };

  const toggleCampaignExpand = (campaignId, e) => {
    e.stopPropagation();
    setExpandedCampaign(prev => prev === campaignId ? null : campaignId);
  };

  // Expose open function via custom event
  useEffect(() => {
    const handleOpen = () => {
      setIsClosed(false);
      localStorage.setItem('campaignMonitorClosed', 'false');
    };

    window.addEventListener('openCampaignMonitor', handleOpen);
    return () => {
      window.removeEventListener('openCampaignMonitor', handleOpen);
    };
  }, []);

  if (activeCampaigns.length === 0 || isClosed) {
    return null;
  }

  return (
    <div className={`${styles.monitor} ${isMinimized ? styles.minimized : ''}`}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Megaphone size={18} />
          <span>Campanhas Ativas ({activeCampaigns.length})</span>
        </div>
        <div className={styles.headerActions}>
          <button
            onClick={handleRefresh}
            className={styles.iconBtn}
            title="Atualizar"
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={styles.iconBtn}
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={handleClose}
            className={styles.iconBtn}
            title="Fechar"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <div className={styles.content}>
          {activeCampaigns.map(campaign => {
            const prog = progress[campaign.id] || {
              total: campaign.total_numbers || 0,
              sent: campaign.sent_count || 0,
              success: campaign.success_count || 0,
              failed: campaign.failed_count || 0,
              pending: (campaign.total_numbers || 0) - (campaign.sent_count || 0),
              percentage: 0
            };

            const isExpanded = expandedCampaign === campaign.id;

            return (
              <div
                key={campaign.id}
                className={`${styles.campaignItem} ${!isExpanded ? styles.collapsed : ''}`}
              >
                <div
                  className={styles.campaignHeader}
                  onClick={() => isExpanded && navigateToCampaign(campaign.id)}
                  style={{ cursor: isExpanded ? 'pointer' : 'default' }}
                >
                  <h4>{campaign.name}</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className={`${styles.status} ${styles[campaign.status]}`}>
                      {campaign.status === 'processing' ? 'Em Andamento' :
                       campaign.status === 'completed' ? 'Concluída' : 'Pausada'}
                    </span>
                    <button
                      onClick={(e) => toggleCampaignExpand(campaign.id, e)}
                      className={styles.collapseBtn}
                      title={isExpanded ? 'Recolher' : 'Expandir'}
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className={styles.campaignDetails} onClick={() => navigateToCampaign(campaign.id)}>
                    <div className={styles.stats}>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>Total:</span>
                        <strong>{prog.total}</strong>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>Enviadas:</span>
                        <strong className={styles.success}>{prog.success}</strong>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>Falhas:</span>
                        <strong className={styles.danger}>{prog.failed}</strong>
                      </div>
                      <div className={styles.stat}>
                        <span className={styles.statLabel}>Pendentes:</span>
                        <strong className={styles.warning}>{prog.pending}</strong>
                      </div>
                    </div>

                    <div className={styles.progressBar}>
                      <div
                        className={styles.progressFill}
                        style={{ width: `${prog.percentage || 0}%` }}
                      />
                    </div>
                    <span className={styles.percentage}>{Math.round(prog.percentage || 0)}%</span>

                    {campaign.status !== 'completed' ? (
                      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        {campaign.status === 'processing' && (
                          <button
                            onClick={(e) => handlePause(campaign.id, e)}
                            className={`${styles.actionBtn} ${styles.pauseBtn}`}
                            title="Pausar"
                          >
                            <Pause size={14} />
                            Pausar
                          </button>
                        )}
                        {campaign.status === 'paused' && (
                          <button
                            onClick={(e) => handleResume(campaign.id, e)}
                            className={`${styles.actionBtn} ${styles.resumeBtn}`}
                            title="Retomar"
                          >
                            <Play size={14} />
                            Retomar
                          </button>
                        )}
                        <button
                          onClick={(e) => handleCancel(campaign.id, e)}
                          className={`${styles.actionBtn} ${styles.cancelBtn}`}
                          title="Cancelar"
                        >
                          <X size={14} />
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className={styles.actions} onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleRecreate(campaign.id, e)}
                          className={`${styles.actionBtn} ${styles.recreateBtn}`}
                          title="Recriar Campanha"
                        >
                          <RotateCcw size={14} />
                          Recriar
                        </button>
                        <button
                          onClick={(e) => handleDownloadLeads(campaign.id, e)}
                          className={`${styles.actionBtn} ${styles.downloadBtn}`}
                          title="Baixar Leads"
                        >
                          <Download size={14} />
                          Baixar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCampaigns(prev => prev.filter(c => c.id !== campaign.id));
                          }}
                          className={`${styles.actionBtn} ${styles.dismissBtn}`}
                          title="Dispensar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

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

export default ActiveCampaignMonitor;
