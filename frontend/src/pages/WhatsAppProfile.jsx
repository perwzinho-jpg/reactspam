import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import {
  UserCircle,
  Upload,
  Edit2,
  Save,
  X,
  RefreshCw,
  Smartphone
} from 'lucide-react';
import DropdownMenu from '../components/DropdownMenu';
import styles from './WhatsAppProfile.module.css';

function WhatsAppProfile() {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingProfiles, setLoadingProfiles] = useState(new Set());
  const [editingInstance, setEditingInstance] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    status: '',
    photoFile: null,
    photoPreview: null,
    photoUrl: '' // Add URL option
  });

  useEffect(() => {
    fetchInstances();
  }, []);

  const fetchInstances = async () => {
    try {
      const { data } = await api.get('/instances');
      if (data.success) {
        // Filter only connected instances
        const connectedInstances = data.instances.filter(i => i.status === 'connected');
        setInstances(connectedInstances);

        // Fetch profile info for each instance in parallel
        const profilePromises = connectedInstances.map(instance => 
          fetchProfileInfo(instance.id).catch(error => {
            return null; // Return null on error to not break Promise.all
          })
        );

        await Promise.all(profilePromises);
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar instâncias');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchProfileInfo = async (instanceId, showLoading = false) => {
    try {
      if (showLoading) {
        setLoadingProfiles(prev => new Set(prev).add(instanceId));
      }

      // Add cache-busting to force fresh data from WhatsApp
      const timestamp = Date.now();
      const { data } = await api.get(`/instances/${instanceId}/profile?_t=${timestamp}`);

      if (data.success && data.profile) {
        // Add cache-busting to profile picture URL
        const profile = { ...data.profile };
        if (profile.profilePictureUrl && !profile.profilePictureUrl.includes('_t=')) {
          const separator = profile.profilePictureUrl.includes('?') ? '&' : '?';
          profile.profilePictureUrl = `${profile.profilePictureUrl}${separator}_t=${timestamp}`;
        }

        setInstances(prev => prev.map(inst =>
          inst.id === instanceId
            ? { ...inst, profile: profile }
            : inst
        ));
        return profile;
      } else {
        // Set empty profile to show that we tried to fetch
        setInstances(prev => prev.map(inst =>
          inst.id === instanceId
            ? { ...inst, profile: null }
            : inst
        ));
        return null;
      }
    } catch (error) {
      // Set empty profile on error
      setInstances(prev => prev.map(inst =>
        inst.id === instanceId
          ? { ...inst, profile: null }
          : inst
      ));

      // Show error message
      const errorMessage = error.response?.data?.message || 'Erro ao buscar perfil';
      if (error.response?.status !== 404) {
        toast.error(errorMessage);
      }

      return null;
    } finally {
      if (showLoading) {
        setLoadingProfiles(prev => {
          const newSet = new Set(prev);
          newSet.delete(instanceId);
          return newSet;
        });
      }
    }
  };

  const handleStartEdit = (instance) => {
    setEditingInstance(instance.id);
    setFormData({
      name: instance.profile?.pushname || instance.instance_name || '',
      status: instance.profile?.status || '',
      photoFile: null,
      photoPreview: instance.profile?.profilePictureUrl || null,
      photoUrl: ''
    });
  };

  const handleCancelEdit = () => {
    setEditingInstance(null);
    setFormData({
      name: '',
      status: '',
      photoFile: null,
      photoPreview: null,
      photoUrl: ''
    });
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photoFile: file,
          photoPreview: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateProfile = async (instanceId) => {
    try {
      const updates = {};

      // Only include name if it's not empty
      if (formData.name && formData.name.trim()) {
        updates.name = formData.name.trim();
      }

      // Only include status if it's provided (can be empty string to clear)
      if (formData.status !== undefined && formData.status !== null) {
        updates.status = formData.status;
      }

      // Handle photo - prioritize URL over file
      if (formData.photoUrl && formData.photoUrl.trim()) {
        // Use URL directly
        updates.photo = formData.photoUrl.trim();
        await updateProfile(instanceId, updates);
      } else if (formData.photoFile) {
        // Convert file to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          try {
            const base64 = reader.result.split(',')[1];
            updates.photo = base64;
            await updateProfile(instanceId, updates);
          } catch (error) {
            toast.error('Erro ao processar imagem');
          }
        };
        reader.onerror = () => {
          toast.error('Erro ao ler arquivo de imagem');
        };
        reader.readAsDataURL(formData.photoFile);
      } else {
        // No photo to upload, proceed with other updates
        await updateProfile(instanceId, updates);
      }
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    }
  };

  const updateProfile = async (instanceId, updates) => {
    try {
      // Check if there are any updates to send
      if (Object.keys(updates).length === 0) {
        toast.error('Nenhuma alteração foi feita');
        return;
      }

      const { data } = await api.put(`/instances/${instanceId}/profile`, updates);

      if (data.success) {
        toast.success('Perfil atualizado com sucesso!');
        handleCancelEdit();

        // If photo was updated, wait for backend to get the new URL
        if (updates.photo) {
          toast.loading('Aguardando WhatsApp processar nova foto...', { id: 'photo-refresh' });
          // Backend will retry multiple times to get the new photo
          // Wait enough time for the retries (10 attempts × 2 seconds = 20 seconds max)
          await new Promise(resolve => setTimeout(resolve, 5000));
        }

        // Force refresh profile info from WhatsApp (not cache)
        await fetchProfileInfo(instanceId, true);

        if (updates.photo) {
          toast.success('Foto atualizada! Se não aparecer, aguarde alguns segundos e clique em Refresh.', {
            id: 'photo-refresh',
            duration: 6000
          });
        }
      } else {
        toast.error(data.message || 'Erro ao atualizar perfil');
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(errorMessage);
    }
  };

  const handleRefresh = async (instanceId) => {
    try {
      toast.loading('Atualizando perfil...', { id: 'refresh' });
      const profile = await fetchProfileInfo(instanceId, true);
      toast.dismiss('refresh');
      
      if (profile) {
        toast.success('Perfil atualizado com sucesso!');
      } else {
        toast.error('Não foi possível atualizar o perfil');
      }
    } catch (error) {
      toast.dismiss('refresh');
      const errorMessage = error.response?.data?.message || 'Erro ao atualizar perfil';
      toast.error(errorMessage);
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

        </div>
      </div>

      {/* Instances Grid */}
      {instances.length === 0 ? (
        <div className={styles.emptyState}>
          <UserCircle size={64} />
          <h3>Nenhuma instância conectada</h3>
          <p>Conecte uma instância do WhatsApp para gerenciar o perfil</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {instances.map((instance) => {
            const isEditing = editingInstance === instance.id;
            const profile = instance.profile || {};

            return (
              <div key={instance.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div className={styles.cardTitle}>
                    <Smartphone size={20} />
                    <h3>{instance.instance_name}</h3>
                  </div>
                  <div className={styles.cardActions}>
                    {!isEditing ? (
                      <>
                        <button
                          onClick={() => handleRefresh(instance.id)}
                          className={styles.refreshBtn}
                          title="Atualizar"
                          disabled={loadingProfiles.has(instance.id)}
                        >
                          <RefreshCw 
                            size={16} 
                            className={loadingProfiles.has(instance.id) ? styles.spinning : ''}
                          />
                        </button>
                        <DropdownMenu
                          items={[
                            {
                              label: 'Editar',
                              icon: <Edit2 size={16} />,
                              onClick: () => handleStartEdit(instance)
                            }
                          ]}
                        />
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleUpdateProfile(instance.id)}
                          className={styles.saveBtn}
                          title="Salvar"
                        >
                          <Save size={16} />
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className={styles.cancelBtn}
                          title="Cancelar"
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className={styles.cardBody}>
                  {/* Profile Photo */}
                  <div className={styles.photoSection}>
                    <div className={styles.photoContainer}>
                      {(isEditing ? formData.photoPreview : profile.profilePictureUrl) ? (
                        <img
                          src={isEditing ? formData.photoPreview : profile.profilePictureUrl}
                          alt="Profile"
                          className={styles.photo}
                        />
                      ) : (
                        <div className={styles.photoPlaceholder}>
                          <UserCircle size={64} />
                        </div>
                      )}
                    </div>

                    {isEditing && (
                      <div className={styles.photoUpload}>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          id={`photo-${instance.id}`}
                          style={{ display: 'none' }}
                        />
                        <label htmlFor={`photo-${instance.id}`} className={styles.uploadBtn}>
                          <Upload size={16} />
                          Enviar Arquivo
                        </label>
                        <span className={styles.orText}>ou</span>
                        <input
                          type="url"
                          value={formData.photoUrl}
                          onChange={(e) => {
                            setFormData(prev => ({
                              ...prev,
                              photoUrl: e.target.value,
                              photoPreview: e.target.value || instance.profile?.profilePictureUrl
                            }));
                          }}
                          placeholder="https://exemplo.com/foto.jpg"
                          className={styles.urlInput}
                        />
                      </div>
                    )}
                  </div>

                  {/* Profile Info */}
                  <div className={styles.infoSection}>
                    <div className={styles.infoGroup}>
                      <label>Nome do Perfil</label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                          placeholder="Nome do perfil"
                          className={styles.input}
                        />
                      ) : (
                        <p className={styles.value}>{profile.pushname || 'Não definido'}</p>
                      )}
                    </div>

                    <div className={styles.infoGroup}>
                      <label>Número</label>
                      <p className={styles.value}>{profile.wid || instance.instance_id}</p>
                    </div>

                    <div className={styles.infoGroup}>
                      <label>Status (Recado)</label>
                      {isEditing ? (
                        <textarea
                          value={formData.status}
                          onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                          placeholder="Digite seu status"
                          className={styles.textarea}
                          rows={3}
                        />
                      ) : (
                        <p className={styles.value}>{profile.status || 'Sem status'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default WhatsAppProfile;
