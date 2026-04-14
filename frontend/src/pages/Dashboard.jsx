import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../lib/api';
import {
  LayoutDashboard,
  FileText,
  Smartphone,
  Megaphone,
  Send,
  TrendingUp,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import styles from './Dashboard.module.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const sliderRef = useRef(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = sliderRef.current.offsetWidth;
      sliderRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const fetchDashboardData = async () => {
    try {
      const { data } = await api.get('/dashboard/stats');
      if (data.success) {
        setStats(data.stats);
        setRecentCampaigns(data.recentCampaigns);
      }
    } catch (error) {
      if (!error.handled) {
        toast.error('Erro ao carregar dados do dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total de Campanhas',
      value: stats?.totalCampaigns || 0,
      icon: Megaphone,
      color: '#8B5CF6',
      bgColor: 'rgba(139, 92, 246, 0.1)'
    },
    {
      title: 'Campanhas Ativas',
      value: stats?.activeCampaigns || 0,
      icon: TrendingUp,
      color: '#10B981',
      bgColor: 'rgba(16, 185, 129, 0.1)'
    },
    {
      title: 'Mensagens Hoje',
      value: stats?.messagesToday || 0,
      icon: Send,
      color: '#F59E0B',
      bgColor: 'rgba(245, 158, 11, 0.1)'
    },
    {
      title: 'Instâncias Conectadas',
      value: stats?.connectedInstances || 0,
      icon: Smartphone,
      color: '#3B82F6',
      bgColor: 'rgba(59, 130, 246, 0.1)'
    },
  ];

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
    return (
      <div className={styles.container}>
        <div className={styles.loader}>Carregando...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <div key={index} className={styles.statCard}>
              <div
                className={styles.statIcon}
                style={{ backgroundColor: card.bgColor }}
              >
                <Icon size={24} style={{ color: card.color }} />
              </div>
              <div className={styles.statContent}>
                <p className={styles.statTitle}>{card.title}</p>
                <h3 className={styles.statValue}>{card.value}</h3>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Campaigns */}
      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Campanhas Recentes</h2>
          <div className={styles.headerControls}>
            {recentCampaigns.length > 3 && (
              <div className={styles.sliderControls}>
                <button
                  onClick={() => scrollSlider('left')}
                  className={styles.sliderBtn}
                  aria-label="Anterior"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => scrollSlider('right')}
                  className={styles.sliderBtn}
                  aria-label="Próximo"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            )}
            <Link to="/app/campaigns" className={styles.viewAllLink}>
              Ver todas
            </Link>
          </div>
        </div>

        {recentCampaigns.length === 0 ? (
          <div className={styles.emptyState}>
            <Megaphone size={48} />
            <p>Nenhuma campanha criada ainda</p>
            <Link to="/app/campaigns" className={styles.createBtn}>
              Criar primeira campanha
            </Link>
          </div>
        ) : (
          <div className={styles.campaignsSliderWrapper}>
            <div ref={sliderRef} className={styles.campaignsSlider}>
              {recentCampaigns.map((campaign) => {
              const statusBadge = getStatusBadge(campaign.status);
              const progress = campaign.total_numbers > 0
                ? Math.round((campaign.sent_count / campaign.total_numbers) * 100)
                : 0;

              return (
                <Link
                  key={campaign.id}
                  to={`/app/campaigns/${campaign.id}`}
                  className={styles.campaignCard}
                >
                  <div className={styles.campaignHeader}>
                    <h3>{campaign.name}</h3>
                    <span className={`${styles.statusBadge} ${statusBadge.class}`}>
                      {statusBadge.text}
                    </span>
                  </div>

                  <div className={styles.campaignDetails}>
                    <div className={styles.campaignStat}>
                      <span>Template:</span>
                      <strong>{campaign.template_name || 'N/A'}</strong>
                    </div>
                    <div className={styles.campaignStat}>
                      <span>Total:</span>
                      <strong>{campaign.total_numbers || 0} números</strong>
                    </div>
                    <div className={styles.campaignStat}>
                      <span>Enviadas:</span>
                      <strong>{campaign.sent_count || 0}</strong>
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
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={styles.section}>
        <h2>Ações Rápidas</h2>
        <div className={styles.quickActions}>
          <Link to="/app/templates" className={styles.actionCard}>
            <FileText size={32} />
            <h3>Templates</h3>
            <p>Gerenciar templates de mensagens</p>
          </Link>
          <Link to="/app/instances" className={styles.actionCard}>
            <Smartphone size={32} />
            <h3>Instâncias</h3>
            <p>Conectar WhatsApp</p>
          </Link>
          <Link to="/app/campaigns" className={styles.actionCard}>
            <Megaphone size={32} />
            <h3>Campanhas</h3>
            <p>Criar nova campanha</p>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
