import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Plus, Edit, Trash2, FileText } from 'lucide-react';
import Pagination from '../components/Pagination';
import ConfirmModal from '../components/ConfirmModal';
import styles from './Templates.module.css';

function Templates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [expandedTexts, setExpandedTexts] = useState({});
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });
  const [formData, setFormData] = useState({
    name: '',
    title: '',
    message: '',
    footer: '',
    buttonLabel: '',
    buttonUrl: '',
    imageUrl: ''
  });

  const MAX_TEXT_LENGTH = 200;

  const toggleTextExpansion = (id) => {
    setExpandedTexts(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const renderTextWithExpand = (text, id, isModal = false) => {
    if (!text) return null;
    
    const isExpanded = expandedTexts[id];
    const shouldTruncate = text.length > MAX_TEXT_LENGTH;
    const displayText = shouldTruncate && !isExpanded 
      ? text.substring(0, MAX_TEXT_LENGTH) + '...' 
      : text;

    return (
      <>
        <div className={styles.whatsappText}>
          {displayText}
        </div>
        {shouldTruncate && (
          <button
            type="button"
            className={styles.expandTextBtn}
            onClick={() => toggleTextExpansion(id)}
          >
            {isExpanded ? 'Ver menos' : 'Ver mais'}
          </button>
        )}
      </>
    );
  };

  useEffect(() => {
    fetchTemplates();
  }, [pagination.currentPage]);

  const fetchTemplates = async () => {
    try {
      const { data } = await api.get(`/templates?page=${pagination.currentPage}&limit=10`);
      if (data.success) {
        setTemplates(data.templates);
        if (data.pagination) {
          setPagination(data.pagination);
        }
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar templates');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenModal = (template = null) => {
    if (template) {
      setEditingTemplate(template);
      setFormData({
        name: template.name,
        title: template.title || '',
        message: template.message,
        footer: template.footer || '',
        buttonLabel: template.button_label || '',
        buttonUrl: template.button_url || '',
        imageUrl: template.image_url || ''
      });
    } else {
      setEditingTemplate(null);
      setFormData({
        name: '',
        title: '',
        message: '',
        footer: '',
        buttonLabel: '',
        buttonUrl: '',
        imageUrl: ''
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (editingTemplate) {
        const { data } = await api.put(`/templates/${editingTemplate.id}`, formData);
        if (data.success) {
          toast.success(data.message);
          fetchTemplates();
          handleCloseModal();
        }
      } else {
        const { data } = await api.post('/templates', formData);
        if (data.success) {
          toast.success(data.message);
          fetchTemplates();
          handleCloseModal();
        }
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao salvar template');
    }
  };

  const handleDelete = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const executeDelete = async () => {
    try {
      const { data } = await api.delete(`/templates/${confirmModal.id}`);
      if (data.success) {
        toast.success(data.message);
        fetchTemplates();
      }
    } catch (error) {
      toast.error('Erro ao excluir template');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  if (loading) {
    return <div className={styles.container}><div className={styles.loader}>Carregando...</div></div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          
          <p>Gerencie seus templates de mensagens</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.createBtn}>
          <Plus size={20} />
          Novo Template
        </button>
      </div>

      {templates.length === 0 ? (
        <div className={styles.emptyState}>
          <FileText size={64} />
          <h3>Nenhum template criado</h3>
          <p>Crie seu primeiro template para começar</p>
          <button onClick={() => handleOpenModal()} className={styles.createBtn}>
            <Plus size={20} />
            Criar Template
          </button>
        </div>
      ) : (
        <div className={styles.templateGrid}>
          {templates.map((template) => (
            <div key={template.id} className={styles.templateCard}>
              <div className={styles.templateHeader}>
                <h3>{template.name}</h3>
                <div className={styles.templateActions}>
                  <button
                    onClick={() => handleOpenModal(template)}
                    className={styles.editBtn}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(template.id)}
                    className={styles.deleteBtn}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className={styles.templateBody}>
                {/* Preview WhatsApp */}
                <div className={styles.whatsappPreview}>
                  <div className={styles.whatsappMessage}>
                    {template.title && (
                      <div className={styles.whatsappTitle}>{template.title}</div>
                    )}
                    {renderTextWithExpand(template.message, `card-${template.id}`)}
                    {template.footer && (
                      <div className={styles.whatsappFooter}>{template.footer}</div>
                    )}
                    {template.button_label && (
                      <>
                        <div className={styles.whatsappButton}>
                          {template.button_label}
                        </div>
                        {template.button_url && (
                          <div className={styles.whatsappButtonUrl}>
                            🔗 {template.button_url}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {!loading && templates.length > 0 && (
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
        <div className={styles.modal}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2>{editingTemplate ? 'Editar Template' : 'Novo Template'}</h2>
              <button onClick={handleCloseModal} className={styles.closeBtn}>×</button>
            </div>

            <form onSubmit={handleSubmit} className={styles.form}>
              {/* Preview WhatsApp */}
              {(formData.message || formData.title || formData.buttonLabel) && (
                <div className={styles.formGroup}>
                  <label>Preview</label>
                  <div className={styles.whatsappPreview}>
                    <div className={styles.whatsappMessage}>
                      {formData.title && (
                        <div className={styles.whatsappTitle}>{formData.title}</div>
                      )}
                      {renderTextWithExpand(formData.message, 'modal-preview', true)}
                      {formData.footer && (
                        <div className={styles.whatsappFooter}>{formData.footer}</div>
                      )}
                      {formData.buttonLabel && (
                        <>
                          <div className={styles.whatsappButton}>
                            {formData.buttonLabel}
                          </div>
                          {formData.buttonUrl && (
                            <div className={styles.whatsappButtonUrl}>
                              🔗 {formData.buttonUrl}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className={styles.formGroup}>
                <label>Nome do Template *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Ex: Boas-vindas, Promoção, etc."
                />
              </div>

              <div className={styles.formGroup}>
                <label>Título (opcional)</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Título da mensagem"
                />
              </div>

              <div className={styles.formGroup}>
                <label>Mensagem *</label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  placeholder="Digite sua mensagem. Use {{var1}}, {{var2}}, etc. para variáveis"
                />
                <small>Use variáveis: &#123;&#123;var1&#125;&#125;, &#123;&#123;var2&#125;&#125;, até &#123;&#123;var5&#125;&#125;</small>
              </div>

              <div className={styles.formGroup}>
                <label>Rodapé (opcional)</label>
                <input
                  type="text"
                  name="footer"
                  value={formData.footer}
                  onChange={handleChange}
                  placeholder="Rodapé da mensagem"
                />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Label do Botão</label>
                  <input
                    type="text"
                    name="buttonLabel"
                    value={formData.buttonLabel}
                    onChange={handleChange}
                    placeholder="Ex: Saiba Mais"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>URL do Botão</label>
                  <input
                    type="url"
                    name="buttonUrl"
                    value={formData.buttonUrl}
                    onChange={handleChange}
                    placeholder="https://exemplo.com"
                  />
                </div>
              </div>

              <div className={styles.formActions}>
                <button type="button" onClick={handleCloseModal} className={styles.cancelBtn}>
                  Cancelar
                </button>
                <button type="submit" className={styles.submitBtn}>
                  {editingTemplate ? 'Atualizar' : 'Criar'} Template
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
        title="Excluir Template"
        message="Tem certeza que deseja excluir este template?"
        confirmText="Excluir"
        danger={true}
      />
    </div>
  );
}

export default Templates;
