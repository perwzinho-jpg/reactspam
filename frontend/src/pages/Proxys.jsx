import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import {
  Globe,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  RefreshCw
} from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import styles from './Proxys.module.css';

function Proxys() {
  const [proxys, setProxys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingProxy, setEditingProxy] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 12
  });
  const [formData, setFormData] = useState({
    name: '',
    host: '',
    port: '',
    username: '',
    password: '',
    type: 'http'
  });

  useEffect(() => {
    fetchProxys();
  }, [pagination.currentPage]);

  const fetchProxys = async () => {
    try {
      const { data } = await api.get(`/proxys?page=${pagination.currentPage}&limit=12`);
      if (data.success) {
        setProxys(data.proxys);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar proxys');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModal = (proxy = null) => {
    if (proxy) {
      setEditingProxy(proxy);
      setFormData({
        name: proxy.name,
        host: proxy.host,
        port: proxy.port.toString(),
        username: proxy.username || '',
        password: proxy.password || '',
        type: proxy.type
      });
    } else {
      setEditingProxy(null);
      setFormData({
        name: '',
        host: '',
        port: '',
        username: '',
        password: '',
        type: 'http'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingProxy(null);
    setFormData({
      name: '',
      host: '',
      port: '',
      username: '',
      password: '',
      type: 'http'
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingProxy) {
        const { data } = await api.put(`/proxys/${editingProxy.id}`, formData);
        if (data.success) {
          toast.success('Proxy atualizado com sucesso!');
          fetchProxys();
          handleCloseModal();
        }
      } else {
        const { data } = await api.post('/proxys', formData);
        if (data.success) {
          toast.success('Proxy criado com sucesso!');
          fetchProxys();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar proxy');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    try {
      const { data } = await api.delete(`/proxys/${confirmModal.id}`);
      if (data.success) {
        toast.success('Proxy excluído com sucesso!');
        fetchProxys();
      }
    } catch (error) {
      toast.error('Erro ao excluir proxy');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleToggleActive = async (proxy) => {
    try {
      const { data } = await api.patch(`/proxys/${proxy.id}/toggle`);
      if (data.success) {
        toast.success(proxy.is_active ? 'Proxy desativado' : 'Proxy ativado');
        fetchProxys();
      }
    } catch (error) {
      toast.error('Erro ao alterar status do proxy');
    }
  };

  const handleTestProxy = async (id) => {
    try {
      toast.loading('Testando proxy...', { id: 'test-proxy' });
      const { data } = await api.post(`/proxys/${id}/test`);
      toast.dismiss('test-proxy');

      if (data.success) {
        toast.success('Proxy funcionando corretamente!');
      }
    } catch (error) {
      toast.dismiss('test-proxy');
      toast.error(error.response?.data?.message || 'Proxy não está funcionando');
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          
          <p>Gerencie seus proxys para rotação de IP</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.addBtn}>
          <Plus size={20} />
          Adicionar Proxy
        </button>
      </div>

      {/* Proxys Grid */}
      {proxys.length === 0 ? (
        <div className={styles.emptyState}>
          <Globe size={64} />
          <h3>Nenhum proxy configurado</h3>
          <p>Adicione proxys para rotacionar IPs e evitar bloqueios</p>
          <button onClick={() => handleOpenModal()} className={styles.addBtn}>
            <Plus size={20} />
            Adicionar Primeiro Proxy
          </button>
        </div>
      ) : (
        <div className={styles.grid}>
          {proxys.map((proxy) => (
            <div key={proxy.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitle}>
                  <Globe size={20} />
                  <h3>{proxy.name}</h3>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleToggleActive(proxy)}
                    className={`${styles.statusBtn} ${proxy.is_active ? styles.active : ''}`}
                    title={proxy.is_active ? 'Desativar' : 'Ativar'}
                  >
                    {proxy.is_active ? <Check size={16} /> : <X size={16} />}
                  </button>
                  <button
                    onClick={() => handleOpenModal(proxy)}
                    className={styles.editBtn}
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(proxy.id)}
                    className={styles.deleteBtn}
                    title="Excluir"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.cardBody}>
                <div className={styles.info}>
                  <span className={styles.label}>Tipo:</span>
                  <span className={styles.value}>{proxy.type.toUpperCase()}</span>
                </div>
                <div className={styles.info}>
                  <span className={styles.label}>Host:</span>
                  <span className={styles.value}>{proxy.host}</span>
                </div>
                <div className={styles.info}>
                  <span className={styles.label}>Porta:</span>
                  <span className={styles.value}>{proxy.port}</span>
                </div>
                {proxy.username && (
                  <div className={styles.info}>
                    <span className={styles.label}>Usuário:</span>
                    <span className={styles.value}>{proxy.username}</span>
                  </div>
                )}
                <div className={styles.info}>
                  <span className={styles.label}>Usado:</span>
                  <span className={styles.value}>
                    {proxy.last_used ? new Date(proxy.last_used).toLocaleString('pt-BR') : 'Nunca'}
                  </span>
                </div>
              </div>

              <div className={styles.cardFooter}>
                <button
                  onClick={() => handleTestProxy(proxy.id)}
                  className={styles.testBtn}
                >
                  <RefreshCw size={16} />
                  Testar Conexão
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && proxys.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          itemsPerPage={pagination.itemsPerPage}
          onPageChange={handlePageChange}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={handleCloseModal}>
          <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>{editingProxy ? 'Editar Proxy' : 'Adicionar Proxy'}</h2>
              <button onClick={handleCloseModal} className={styles.closeBtn}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.formGroup}>
                <label>Nome *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Proxy Principal"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Tipo *</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="http">HTTP</option>
                  <option value="https">HTTPS</option>
                  <option value="socks4">SOCKS4</option>
                  <option value="socks5">SOCKS5</option>
                </select>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Host *</label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    required
                    placeholder="Ex: 192.168.1.1 ou proxy.com"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Porta *</label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    required
                    placeholder="Ex: 8080"
                    min="1"
                    max="65535"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Usuário (opcional)</label>
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    placeholder="Usuário do proxy"
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Senha (opcional)</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Senha do proxy"
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className={styles.cancelBtn}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingProxy ? 'Atualizar' : 'Criar'} Proxy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, id: null })}
        onConfirm={executeDelete}
        title="Excluir Proxy"
        message="Deseja realmente excluir este proxy?"
        confirmText="Excluir"
        danger={true}
      />
    </div>
  );
}

export default Proxys;
