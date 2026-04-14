import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { IMGUR_CONFIG } from '../config/imgur';
import {
  User,
  Mail,
  Lock,
  Save,
  Camera,
  Shield,
  Bell,
  Globe,
  Eye,
  EyeOff,
  Calendar,
  CreditCard,
  Activity,
  Loader,
  X
} from 'lucide-react';
import styles from './Profile.module.css';

function Profile() {
  const { user, updateUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Personal Info
  const [personalInfo, setPersonalInfo] = useState({
    username: ''
  });

  // Password Change
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Notifications Settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    campaignAlerts: true,
    instanceAlerts: true,
    systemUpdates: false
  });

  // Account Stats
  const [accountStats, setAccountStats] = useState(null);

  useEffect(() => {
    loadProfileData();
    loadAccountStats();
  }, []);

  useEffect(() => {
    if (user?.avatar) {
      setAvatarUrl(user.avatar);
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      const { data } = await api.get('/user/profile');
      if (data.success) {
        setPersonalInfo({
          username: data.user.username || ''
        });
        if (data.user.avatar) {
          setAvatarUrl(data.user.avatar);
        }
      }
    } catch (error) {
      // Use current user data if API fails
      setPersonalInfo({
        username: user?.username || ''
      });
    }
  };

  const loadAccountStats = async () => {
    try {
      const { data } = await api.get('/user/stats');
      if (data.success) {
        setAccountStats(data.stats);
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar estatísticas da conta');
      }
    }
  };

  const handlePersonalInfoChange = (e) => {
    setPersonalInfo({
      ...personalInfo,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleNotificationChange = (setting) => {
    setNotificationSettings({
      ...notificationSettings,
      [setting]: !notificationSettings[setting]
    });
  };

  const handleSavePersonalInfo = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.put('/user/profile', personalInfo);
      if (data.success) {
        updateUser(data.user);
        toast.success('Perfil atualizado com sucesso!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.put('/user/password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword
      });

      if (data.success) {
        toast.success('Senha alterada com sucesso!');
        setPasswordData({
          oldPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNotifications = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await api.put('/user/notifications', notificationSettings);
      if (data.success) {
        toast.success('Configurações de notificações atualizadas!');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar configurações');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!IMGUR_CONFIG.ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato não suportado. Use JPEG, PNG, GIF ou WebP');
      return;
    }

    // Validate file size
    if (file.size > IMGUR_CONFIG.MAX_FILE_SIZE) {
      toast.error('A imagem deve ter no máximo 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload to Imgur
    await uploadToImgur(file);
  };

  const uploadToImgur = async (file) => {
    setUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(IMGUR_CONFIG.UPLOAD_URL, {
        method: 'POST',
        headers: {
          Authorization: `Client-ID ${IMGUR_CONFIG.CLIENT_ID}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        const imageUrl = data.data.link;
        setAvatarUrl(imageUrl);

        // Save to backend
        await saveAvatar(imageUrl);

        toast.success('Foto de perfil atualizada com sucesso!');
      } else {
        throw new Error(data.data?.error || 'Erro ao fazer upload da imagem');
      }
    } catch (error) {
      toast.error('Erro ao fazer upload da imagem. Tente novamente.');
      setAvatarPreview(null);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveAvatar = async (avatarUrl) => {
    try {
      const { data } = await api.put('/user/avatar', { avatar: avatarUrl });
      if (data.success) {
        updateUser({ avatar: avatarUrl });
      }
    } catch (error) {
      // If backend save fails, still keep the imgur URL locally
      updateUser({ avatar: avatarUrl });
    }
  };

  const removeAvatar = async () => {
    setAvatarUrl(null);
    setAvatarPreview(null);

    try {
      const { data } = await api.put('/user/avatar', { avatar: null });
      if (data.success) {
        updateUser({ avatar: null });
        toast.success('Foto de perfil removida');
      }
    } catch (error) {
      updateUser({ avatar: null });
      toast.success('Foto de perfil removida');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const tabs = [
    { id: 'personal', label: 'Informações Pessoais', icon: User },
    { id: 'security', label: 'Segurança', icon: Shield },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'account', label: 'Conta', icon: Activity }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Meu Perfil</h1>
        <p>Gerencie suas informações e configurações</p>
      </div>

      {/* Profile Card */}
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <div className={styles.avatarWrapper}>
            <div className={styles.avatar}>
              {uploadingAvatar ? (
                <Loader size={48} className={styles.spinner} />
              ) : (avatarPreview || avatarUrl) ? (
                <img src={avatarPreview || avatarUrl} alt="Avatar" className={styles.avatarImage} />
              ) : (
                <User size={48} />
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <button
              className={styles.avatarUpload}
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              title="Alterar foto"
            >
              <Camera size={16} />
            </button>
            {(avatarUrl || avatarPreview) && !uploadingAvatar && (
              <button
                className={styles.avatarRemove}
                onClick={removeAvatar}
                title="Remover foto"
              >
                <X size={16} />
              </button>
            )}
          </div>
          <div className={styles.profileInfo}>
            <h2>{personalInfo.username}</h2>
            <p>{user?.email}</p>
            <span className={styles.accountType}>{user?.account_type || 'Free'}</span>
          </div>
        </div>

        {accountStats && (
          <div className={styles.statsGrid}>
            <div className={styles.statItem}>
              <Activity size={20} />
              <div>
                <span className={styles.statValue}>{accountStats.totalCampaigns}</span>
                <span className={styles.statLabel}>Campanhas</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <Mail size={20} />
              <div>
                <span className={styles.statValue}>{accountStats.totalMessages.toLocaleString()}</span>
                <span className={styles.statLabel}>Mensagens Enviadas</span>
              </div>
            </div>
            <div className={styles.statItem}>
              <Calendar size={20} />
              <div>
                <span className={styles.statValue}>{formatDate(accountStats.accountCreated)}</span>
                <span className={styles.statLabel}>Membro desde</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {/* Personal Information Tab */}
        {activeTab === 'personal' && (
          <form onSubmit={handleSavePersonalInfo} className={styles.form}>
            <div className={styles.section}>
              <h3>Informações Pessoais</h3>
              <p className={styles.sectionDesc}>
                Atualize seu nome de usuário. Email e outras informações não podem ser alterados.
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Nome de Usuário</label>
                  <div className={styles.inputWrapper}>
                    <User size={18} />
                    <input
                      type="text"
                      name="username"
                      value={personalInfo.username}
                      onChange={handlePersonalInfoChange}
                      placeholder="Seu nome de usuário"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Email (não editável)</label>
                  <div className={`${styles.inputWrapper} ${styles.disabled}`}>
                    <Mail size={18} />
                    <input
                      type="email"
                      value={user?.email || ''}
                      placeholder="seu@email.com"
                      disabled
                      readOnly
                    />
                  </div>
                  <span className={styles.helpText}>
                    Entre em contato com o suporte para alterar o email
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
              >
                <Save size={18} />
                {loading ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <form onSubmit={handleChangePassword} className={styles.form}>
            <div className={styles.section}>
              <h3>Alterar Senha</h3>
              <p className={styles.sectionDesc}>
                Mantenha sua conta segura com uma senha forte
              </p>

              <div className={styles.formGrid}>
                <div className={styles.formGroup}>
                  <label>Senha Atual</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} />
                    <input
                      type={showOldPassword ? 'text' : 'password'}
                      name="oldPassword"
                      value={passwordData.oldPassword}
                      onChange={handlePasswordChange}
                      placeholder="Digite sua senha atual"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowOldPassword(!showOldPassword)}
                    >
                      {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Nova Senha</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Digite sua nova senha"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Confirmar Nova Senha</label>
                  <div className={styles.inputWrapper}>
                    <Lock size={18} />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Confirme sua nova senha"
                      required
                    />
                    <button
                      type="button"
                      className={styles.togglePassword}
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
              >
                <Save size={18} />
                {loading ? 'Alterando...' : 'Alterar Senha'}
              </button>
            </div>
          </form>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <form onSubmit={handleSaveNotifications} className={styles.form}>
            <div className={styles.section}>
              <h3>Preferências de Notificação</h3>
              <p className={styles.sectionDesc}>
                Escolha como deseja receber notificações
              </p>

              <div className={styles.settingsList}>
                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h4>Notificações por Email</h4>
                    <p>Receba atualizações importantes por email</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.emailNotifications}
                      onChange={() => handleNotificationChange('emailNotifications')}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h4>Alertas de Campanha</h4>
                    <p>Notificações sobre o status das suas campanhas</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.campaignAlerts}
                      onChange={() => handleNotificationChange('campaignAlerts')}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h4>Alertas de Instância</h4>
                    <p>Notificações sobre conexões e desconexões</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.instanceAlerts}
                      onChange={() => handleNotificationChange('instanceAlerts')}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>

                <div className={styles.settingItem}>
                  <div className={styles.settingInfo}>
                    <h4>Atualizações do Sistema</h4>
                    <p>Novidades e melhorias da plataforma</p>
                  </div>
                  <label className={styles.toggle}>
                    <input
                      type="checkbox"
                      checked={notificationSettings.systemUpdates}
                      onChange={() => handleNotificationChange('systemUpdates')}
                    />
                    <span className={styles.toggleSlider}></span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className={styles.saveBtn}
                disabled={loading}
              >
                <Save size={18} />
                {loading ? 'Salvando...' : 'Salvar Preferências'}
              </button>
            </div>
          </form>
        )}

        {/* Account Tab */}
        {activeTab === 'account' && (
          <div className={styles.section}>
            <h3>Informações da Conta</h3>
            <p className={styles.sectionDesc}>
              Detalhes e estatísticas da sua conta
            </p>

            <div className={styles.accountInfo}>
              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <CreditCard size={24} />
                </div>
                <div className={styles.infoContent}>
                  <h4>Tipo de Conta</h4>
                  <p className={styles.infoValue}>{user?.accountType || 'Free'}</p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Calendar size={24} />
                </div>
                <div className={styles.infoContent}>
                  <h4>Membro Desde</h4>
                  <p className={styles.infoValue}>
                    {accountStats && formatDate(accountStats.accountCreated)}
                  </p>
                </div>
              </div>

              <div className={styles.infoCard}>
                <div className={styles.infoIcon}>
                  <Activity size={24} />
                </div>
                <div className={styles.infoContent}>
                  <h4>Último Acesso</h4>
                  <p className={styles.infoValue}>
                    {accountStats && formatDate(accountStats.lastLogin)}
                  </p>
                </div>
              </div>
            </div>

            <div className={styles.dangerZone}>
              <h4>Zona de Perigo</h4>
              <p>Ações irreversíveis da conta</p>
              <button className={styles.dangerBtn}>Excluir Conta</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Profile;
