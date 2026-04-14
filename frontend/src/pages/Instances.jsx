import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Plus, Smartphone, QrCode, RefreshCw, Trash2, CheckCircle, XCircle, Edit, Phone, Activity, TrendingUp, Zap, BarChart3, MessageSquare, Clock, Target, Hash } from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import styles from './Instances.module.css';

function Instances() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQRCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [connectionType, setConnectionType] = useState('qrcode'); // 'qrcode' or 'phone'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [editingInstance, setEditingInstance] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, action: null, id: null });
  const [loadingActions, setLoadingActions] = useState(new Set()); // Track loading state per instance
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [formData, setFormData] = useState({
    instanceName: '',
    instanceId: '',
    instanceToken: '',
    clientToken: ''
  });

  useEffect(() => {
    fetchInstances();
    const interval = setInterval(checkAllStatuses, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [pagination.currentPage]);

  // Auto-refresh QR Code every 20 seconds when modal is open
  useEffect(() => {
    if (showQR && connectionType === 'qrcode' && selectedInstance) {
      const qrInterval = setInterval(async () => {
        try {
          const { data } = await api.get(`/instances/${selectedInstance}/qrcode`);
          if (data.success) {
            setQRCode(data.qrCode);
          }
        } catch (error) {
        }
      }, 20000); // Refresh every 20 seconds

      return () => clearInterval(qrInterval);
    }
  }, [showQR, connectionType, selectedInstance]);

  const fetchInstances = async () => {
    try {
      const { data } = await api.get(`/instances?page=${pagination.currentPage}&limit=10`);
      if (data.success) {
        setInstances(data.instances);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar instâncias');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const checkAllStatuses = async () => {
    for (const instance of instances) {
      if (instance.status !== 'connected') {
        await checkStatus(instance.id, false);
      }
    }
  };

  const handleOpenCreateModal = () => {
    setEditingInstance(null);
    setFormData({
      instanceName: '',
      instanceId: '',
      instanceToken: '',
      clientToken: ''
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (instance) => {
    setEditingInstance(instance);
    setFormData({
      instanceName: instance.instance_name || '',
      instanceId: instance.instance_id || '',
      instanceToken: instance.instance_token || '',
      clientToken: instance.client_token || '',
      resetWarmup: false
    });
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingInstance(null);
    setFormData({
      instanceName: '',
      instanceId: '',
      instanceToken: '',
      clientToken: ''
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const loadingId = 'save-instance';

    try {
      toast.loading(editingInstance ? 'Atualizando...' : 'Criando instância...', { id: loadingId });

      if (editingInstance) {
        const { data } = await api.put(`/instances/${editingInstance.id}`, formData);
        if (data.success) {
          toast.success(data.message, { id: loadingId });
          fetchInstances();
          handleCloseModal();
        }
      } else {
        // Validate required fields for new instance
        if (!formData.instanceName?.trim() || !formData.instanceId?.trim() ||
            !formData.instanceToken?.trim() || !formData.clientToken?.trim()) {
          toast.error('Todos os campos são obrigatórios. Cada instância deve ter um ID, Token e Client Token únicos.', { id: loadingId });
          return;
        }

        const { data } = await api.post('/instances', formData);
        if (data.success) {
          toast.success(data.message, { id: loadingId });
          fetchInstances();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar instância', { id: loadingId });
    }
  };

  const handleConnect = async (instanceId, type = 'qrcode') => {
    const loadingId = `connect-${instanceId}`;

    try {
      setLoadingActions(prev => new Set(prev).add(loadingId));
      toast.loading('Conectando...', { id: loadingId });

      setConnectionType(type);
      setSelectedInstance(instanceId);

      if (type === 'qrcode') {
        // Fetch initial QR Code
        const { data } = await api.get(`/instances/${instanceId}/qrcode`);
        if (data.success) {
          setQRCode(data.qrCode);
          setShowQR(true);
          startStatusCheck(instanceId);
          toast.success('QR Code gerado!', { id: loadingId });
        }
      } else if (type === 'phone') {
        // Will be handled by handleGetPhoneCode
        setShowQR(true);
        toast.dismiss(loadingId);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao conectar instância', { id: loadingId });
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingId);
        return newSet;
      });
    }
  };

  const handleGetPhoneCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Por favor, informe o número de telefone');
      return;
    }

    const loadingId = `phone-code-${selectedInstance}`;

    try {
      toast.loading('Gerando código...', { id: loadingId });

      const { data } = await api.get(`/instances/${selectedInstance}/phone-code`, {
        params: { phone: phoneNumber }
      });
      if (data.success) {
        setPhoneCode(data.code);
        startStatusCheck(selectedInstance);
        toast.success('Código gerado!', { id: loadingId });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao obter código de telefone', { id: loadingId });
    }
  };

  const startStatusCheck = (instanceId) => {
    // Check status every 3 seconds
    const interval = setInterval(async () => {
      try {
        const { data: statusData } = await api.get(`/instances/${instanceId}/status`);
        if (statusData.success && statusData.connected) {
          clearInterval(interval);
          setShowQR(false);
          setPhoneCode('');
          setPhoneNumber('');
          toast.success('WhatsApp conectado com sucesso!');
          fetchInstances();
        }
      } catch (error) {
        // Continue checking even if there's an error
      }
    }, 3000);

    // Stop checking after 5 minutes
    setTimeout(() => clearInterval(interval), 300000);
  };

  const handleGetQR = async (instanceId) => {
    await handleConnect(instanceId, 'qrcode');
  };

  const checkStatus = async (instanceId, showToast = true) => {
    const loadingId = `status-${instanceId}`;

    try {
      setLoadingActions(prev => new Set(prev).add(loadingId));

      if (showToast) {
        toast.loading('Verificando status...', { id: loadingId });
      }

      const { data } = await api.get(`/instances/${instanceId}/status`);
      if (data.success) {
        if (showToast) {
          toast.success(data.connected ? 'Conectado!' : 'Desconectado', { id: loadingId });
        }
        fetchInstances();
      }
    } catch (error) {
      if (showToast) {
        toast.error('Erro ao verificar status', { id: loadingId });
      }
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingId);
        return newSet;
      });
    }
  };

  const handleDisconnect = (instanceId) => {
    setConfirmModal({
      isOpen: true,
      action: 'disconnect',
      id: instanceId
    });
  };

  const handleDelete = (instanceId) => {
    setConfirmModal({
      isOpen: true,
      action: 'delete',
      id: instanceId
    });
  };

  const executeAction = async () => {
    const { action, id } = confirmModal;
    const loadingId = `${action}-${id}`;

    try {
      setLoadingActions(prev => new Set(prev).add(loadingId));
      setConfirmModal({ isOpen: false, action: null, id: null });

      if (action === 'disconnect') {
        toast.loading('Desconectando...', { id: loadingId });
        const { data } = await api.post(`/instances/${id}/disconnect`);
        if (data.success) {
          toast.success(data.message, { id: loadingId });
          fetchInstances();
        }
      } else if (action === 'delete') {
        toast.loading('Excluindo...', { id: loadingId });
        const { data } = await api.delete(`/instances/${id}`);
        if (data.success) {
          toast.success(data.message, { id: loadingId });
          fetchInstances();
        }
      }
    } catch (error) {
      if (action === 'disconnect') {
        toast.error('Erro ao desconectar instância', { id: loadingId });
      } else {
        toast.error('Erro ao excluir instância', { id: loadingId });
      }
    } finally {
      setLoadingActions(prev => {
        const newSet = new Set(prev);
        newSet.delete(loadingId);
        return newSet;
      });
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'connected':
        return { icon: CheckCircle, text: 'Conectado', class: styles.statusConnected };
      case 'disconnected':
        return { icon: XCircle, text: 'Desconectado', class: styles.statusDisconnected };
      default:
        return { icon: RefreshCw, text: 'Pendente', class: styles.statusPending };
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loader}>Carregando...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          
          <p>Gerencie suas conexões do WhatsApp</p>
        </div>
        <button onClick={handleOpenCreateModal} className={styles.createBtn}>
          <Plus size={20} />
          Nova Instância
        </button>
      </div>

      {instances.length === 0 ? (
        <div className={styles.emptyState}>
          <Smartphone size={64} />
          <h3>Nenhuma instância conectada</h3>
          <p>Conecte seu primeiro WhatsApp para começar</p>
          <button onClick={handleOpenCreateModal} className={styles.createBtn}>
            <Plus size={20} />
            Conectar WhatsApp
          </button>
        </div>
      ) : (
        <div className={styles.instanceGrid}>
          {instances.map((instance) => {
            const statusBadge = getStatusBadge(instance.status);
            const StatusIcon = statusBadge.icon;

            return (
              <div key={instance.id} className={styles.instanceCard}>
                <div className={styles.instanceHeader}>
                  <Smartphone size={32} />
                  <div className={styles.headerActions}>
                    <span className={`${styles.statusBadge} ${statusBadge.class}`}>
                      <StatusIcon size={14} />
                      {statusBadge.text}
                    </span>
                    <button
                      onClick={() => handleOpenEditModal(instance)}
                      className={styles.editCardBtn}
                      title="Editar instância"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(instance.id)}
                      className={styles.deleteCardBtn}
                      title="Excluir instância"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className={styles.instanceBody}>
                  <h3>{instance.instance_name}</h3>
                  {instance.phone_number && (
                    <p className={styles.phoneNumber}>
                      <Phone size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: '4px' }} />
                      +{instance.phone_number}
                    </p>
                  )}

                  <div className={styles.statsGrid}>
                    <div className={styles.statBox}>
                      <div className={styles.statValue}>{instance.messages_sent_today || 0}</div>
                      <div className={styles.statLabel}>Hoje</div>
                    </div>
                    <div className={styles.statBox}>
                      <div className={styles.statValue}>{instance.messages_sent_hour || 0}</div>
                      <div className={styles.statLabel}>Última Hora</div>
                    </div>
                    <div className={styles.statBox}>
                      <div className={styles.statValue}>{instance.warmup_messages_sent || 0}</div>
                      <div className={styles.statLabel}>Warm-up</div>
                    </div>
                  </div>

                  {/* Warm-up Progress */}
                  <div className={styles.warmupSection}>
                    <div className={styles.warmupHeader}>
                      <span>Fase Warm-up: {instance.warmup_phase || 1}/3</span>
                      <span className={styles.warmupPercentage}>
                        {Math.round(((instance.warmup_phase || 1) / 3) * 100)}%
                      </span>
                    </div>
                    <div className={styles.warmupBar}>
                      <div
                        className={styles.warmupFill}
                        style={{ width: `${((instance.warmup_phase || 1) / 3) * 100}%` }}
                      />
                    </div>
                    <div className={styles.warmupLabels}>
                      <span className={instance.warmup_phase >= 1 ? styles.active : ''}>Fase 1</span>
                      <span className={instance.warmup_phase >= 2 ? styles.active : ''}>Fase 2</span>
                      <span className={instance.warmup_phase >= 3 ? styles.active : ''}>Fase 3</span>
                    </div>
                  </div>

                  {instance.last_message_time && (
                    <div className={styles.lastMessage}>
                      <span className={styles.lastMessageLabel}>Última mensagem:</span>
                      <span className={styles.lastMessageTime}>
                        {new Date(instance.last_message_time).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  )}
                </div>

                <div className={styles.instanceActions}>
                  {instance.status !== 'connected' ? (
                    <div className={styles.connectButtons}>
                      <button
                        onClick={() => handleConnect(instance.id, 'qrcode')}
                        className={styles.connectBtn}
                        title="Conectar com QR Code"
                      >
                        <QrCode size={16} />
                        QR Code
                      </button>
                      <button
                        onClick={() => handleConnect(instance.id, 'phone')}
                        className={styles.connectBtn}
                        title="Conectar com código de telefone"
                      >
                        <Phone size={16} />
                        Código
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleDisconnect(instance.id)}
                      className={styles.disconnectBtn}
                    >
                      Desconectar
                    </button>
                  )}
                  <button
                    onClick={() => checkStatus(instance.id)}
                    className={styles.refreshBtn}
                    title="Atualizar Status"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {!loading && instances.length > 0 && (
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
              <h2>{editingInstance ? 'Editar Instância' : 'Nova Instância WhatsApp'}</h2>
              <button onClick={handleCloseModal} className={styles.closeBtn}>×</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome da Instância *</label>
                <input
                  type="text"
                  name="instanceName"
                  value={formData.instanceName}
                  onChange={handleChange}
                  required
                  placeholder="Ex: WhatsApp Principal"
                />
              </div>

              {!editingInstance && (
                <>
                  <div className={styles.formGroup}>
                    <label>Instance ID (Z-API) *</label>
                    <input
                      type="text"
                      name="instanceId"
                      value={formData.instanceId}
                      onChange={handleChange}
                      required
                      placeholder="ID único da instância Z-API"
                    />
                    <small>Obrigatório. Cada instância deve ter um ID único e diferente.</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Instance Token (Z-API) *</label>
                    <input
                      type="text"
                      name="instanceToken"
                      value={formData.instanceToken}
                      onChange={handleChange}
                      required
                      placeholder="Token único da instância Z-API"
                    />
                    <small>Obrigatório. Cada instância deve ter um Token único e diferente.</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Client Token (Z-API) *</label>
                    <input
                      type="text"
                      name="clientToken"
                      value={formData.clientToken}
                      onChange={handleChange}
                      required
                      placeholder="Client Token único da Z-API"
                    />
                    <small>Obrigatório. Cada instância deve ter um Client Token único e diferente.</small>
                  </div>
                </>
              )}
              {editingInstance && (
                <>
                  <div className={styles.formGroup}>
                    <label>Instance ID (Z-API)</label>
                    <input
                      type="text"
                      name="instanceId"
                      value={formData.instanceId}
                      onChange={handleChange}
                      placeholder="ID da instância Z-API"
                    />
                    <small>Altere apenas se precisar trocar a instância Z-API</small>
                  </div>

                  <div className={styles.formGroup}>
                    <label>Instance Token (Z-API)</label>
                    <input
                      type="text"
                      name="instanceToken"
                      value={formData.instanceToken}
                      onChange={handleChange}
                      placeholder="Token da instância Z-API"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Client Token (Z-API)</label>
                    <input
                      type="text"
                      name="clientToken"
                      value={formData.clientToken}
                      onChange={handleChange}
                      placeholder="Client Token da Z-API"
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        name="resetWarmup"
                        checked={formData.resetWarmup || false}
                        onChange={handleChange}
                      />
                      <span>Resetar histórico de mensagens enviadas</span>
                    </label>
                    <small>Zera os contadores de mensagens e reinicia o warm-up da fase 1</small>
                  </div>
                </>
              )}

              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseModal} className={styles.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingInstance ? 'Salvar Alterações' : 'Criar Instância'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connection Modal (QR Code or Phone Code) */}
      {showQR && (
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>
                {connectionType === 'qrcode' ? 'Conectar com QR Code' : 'Conectar com Código de Telefone'}
              </h2>
              <button 
                onClick={() => {
                  setShowQR(false);
                  setQRCode('');
                  setPhoneCode('');
                  setPhoneNumber('');
                  setConnectionType('qrcode');
                  setSelectedInstance(null);
                }} 
                className={styles.closeBtn}
              >
                ×
              </button>
            </div>

            <div className={styles.connectionContainer}>
              {/* Connection Type Selector */}
              <div className={styles.connectionTypeSelector}>
                <button
                  onClick={() => {
                    setConnectionType('qrcode');
                    setPhoneCode('');
                    setPhoneNumber('');
                    if (selectedInstance) {
                      handleConnect(selectedInstance, 'qrcode');
                    }
                  }}
                  className={connectionType === 'qrcode' ? styles.activeType : ''}
                >
                  <QrCode size={20} />
                  QR Code
                </button>
                <button
                  onClick={() => {
                    setConnectionType('phone');
                    setQRCode('');
                    setPhoneCode('');
                  }}
                  className={connectionType === 'phone' ? styles.activeType : ''}
                >
                  <Phone size={20} />
                  Código de Telefone
                </button>
              </div>

              {/* QR Code Section */}
              {connectionType === 'qrcode' && qrCode && (
                <div className={styles.qrContainer}>
                  <p>Abra o WhatsApp no seu celular e escaneie este QR Code:</p>
                  <img src={qrCode} alt="QR Code" className={styles.qrImage} />
                  <div className={styles.qrInstructions}>
                    <p><strong>1.</strong> Abra o WhatsApp no seu celular</p>
                    <p><strong>2.</strong> Toque em <strong>Menu</strong> ou <strong>Configurações</strong></p>
                    <p><strong>3.</strong> Toque em <strong>Aparelhos conectados</strong></p>
                    <p><strong>4.</strong> Toque em <strong>Conectar um aparelho</strong></p>
                    <p><strong>5.</strong> Aponte seu celular para esta tela para capturar o código</p>
                  </div>
                  <small>O QR Code expira a cada 20 segundos e será atualizado automaticamente.</small>
                </div>
              )}

              {/* Phone Code Section */}
              {connectionType === 'phone' && (
                <div className={styles.phoneCodeContainer}>
                  {!phoneCode ? (
                    <>
                      <p>Digite o número de telefone (com código do país) para gerar o código de conexão:</p>
                      <div className={styles.formGroup}>
                        <label>Número de Telefone *</label>
                        <input
                          type="tel"
                          value={phoneNumber}
                          onChange={(e) => setPhoneNumber(e.target.value)}
                          placeholder="Ex: 5511999999999"
                          className={styles.phoneInput}
                        />
                        <small>Formato: código do país + DDD + número (ex: 5511999999999)</small>
                      </div>
                      <button
                        onClick={handleGetPhoneCode}
                        className={styles.submitBtn}
                        disabled={!phoneNumber.trim()}
                      >
                        Gerar Código
                      </button>
                    </>
                  ) : (
                    <>
                      <p>Use este código para conectar seu WhatsApp:</p>
                      <div className={styles.codeDisplay}>
                        <div className={styles.codeValue}>{phoneCode}</div>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(phoneCode);
                            toast.success('Código copiado!');
                          }}
                          className={styles.copyBtn}
                        >
                          Copiar Código
                        </button>
                      </div>
                      <div className={styles.phoneCodeInstructions}>
                        <p><strong>1.</strong> Abra o WhatsApp no seu celular</p>
                        <p><strong>2.</strong> Toque em <strong>Menu</strong> ou <strong>Configurações</strong></p>
                        <p><strong>3.</strong> Toque em <strong>Aparelhos conectados</strong></p>
                        <p><strong>4.</strong> Toque em <strong>Conectar um aparelho</strong></p>
                        <p><strong>5.</strong> Toque em <strong>"Conectar com número de telefone"</strong></p>
                        <p><strong>6.</strong> Digite o código acima quando solicitado</p>
                      </div>
                      <button
                        onClick={() => {
                          setPhoneCode('');
                          setPhoneNumber('');
                        }}
                        className={styles.cancelBtn}
                      >
                        Gerar Novo Código
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, action: null, id: null })}
        onConfirm={executeAction}
        title={confirmModal.action === 'delete' ? 'Excluir Instância' : 'Desconectar Instância'}
        message={confirmModal.action === 'delete' 
          ? 'Tem certeza que deseja excluir esta instância?'
          : 'Deseja desconectar esta instância?'}
        confirmText={confirmModal.action === 'delete' ? 'Excluir' : 'Desconectar'}
        danger={confirmModal.action === 'delete'}
      />
    </div>
  );
}

export default Instances;
