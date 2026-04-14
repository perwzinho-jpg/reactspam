import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Zap,
  BarChart3,
  Shield,
  Clock,
  Users,
  Bot,
  FileText,
  Code,
  Smartphone,
  TrendingUp,
  Lock
} from 'lucide-react';
import styles from './Resources.module.css';

export default function Resources() {
  const resources = [
    {
      icon: Zap,
      title: 'Disparo em Massa',
      description: 'Envie milhares de mensagens de forma rápida e segura, com controle total sobre o processo.',
      features: [
        'Envio ilimitado de mensagens',
        'Controle de velocidade',
        'Agendamento inteligente',
        'Filtros avançados'
      ]
    },
    {
      icon: Bot,
      title: 'Automação com IA',
      description: 'Utilize inteligência artificial para automatizar respostas e interações com seus clientes.',
      features: [
        'Chatbot inteligente',
        'Respostas automáticas',
        'Aprendizado contínuo',
        'Personalização avançada'
      ]
    },
    {
      icon: BarChart3,
      title: 'Analytics Avançado',
      description: 'Acompanhe métricas detalhadas e tome decisões baseadas em dados reais.',
      features: [
        'Relatórios em tempo real',
        'Métricas de engajamento',
        'Taxa de conversão',
        'Exportação de dados'
      ]
    },
    {
      icon: Shield,
      title: 'Anti-Ban Protection',
      description: 'Sistema de proteção avançado para evitar bloqueios e manter suas contas seguras.',
      features: [
        'Rotação de IPs',
        'Comportamento humanizado',
        'Delays inteligentes',
        'Monitoramento 24/7'
      ]
    },
    {
      icon: Clock,
      title: 'Agendamento Inteligente',
      description: 'Programe suas campanhas para o momento ideal, aumentando a taxa de abertura.',
      features: [
        'Agendamento por timezone',
        'Melhor horário automático',
        'Campanhas recorrentes',
        'Calendário visual'
      ]
    },
    {
      icon: Users,
      title: 'Multi-Instâncias',
      description: 'Gerencie múltiplas contas do WhatsApp a partir de uma única plataforma.',
      features: [
        'Contas ilimitadas',
        'Gerenciamento centralizado',
        'Sincronização automática',
        'Dashboard unificado'
      ]
    },
    {
      icon: FileText,
      title: 'Templates Personalizados',
      description: 'Crie e gerencie templates de mensagens para agilizar seu trabalho.',
      features: [
        'Editor visual',
        'Variáveis dinâmicas',
        'Biblioteca de templates',
        'Versionamento'
      ]
    },
    {
      icon: Code,
      title: 'API Completa',
      description: 'Integre nossa plataforma com seus sistemas através de uma API robusta.',
      features: [
        'REST API completa',
        'Webhooks em tempo real',
        'SDKs em várias linguagens',
        'Documentação detalhada'
      ]
    },
    {
      icon: Smartphone,
      title: 'App Mobile',
      description: 'Gerencie suas campanhas de qualquer lugar através do nosso app mobile.',
      features: [
        'iOS e Android',
        'Notificações push',
        'Interface otimizada',
        'Modo offline'
      ]
    },
    {
      icon: TrendingUp,
      title: 'CRM Integrado',
      description: 'Gerencie seus contatos e leads de forma organizada e eficiente.',
      features: [
        'Gestão de contatos',
        'Segmentação avançada',
        'Histórico completo',
        'Tags e categorias'
      ]
    },
    {
      icon: Lock,
      title: 'Segurança Avançada',
      description: 'Seus dados protegidos com os mais altos padrões de segurança.',
      features: [
        'Criptografia end-to-end',
        'Backup automático',
        'Conformidade LGPD',
        'Auditoria completa'
      ]
    },
    {
      icon: MessageCircle,
      title: 'Suporte Dedicado',
      description: 'Conte com nossa equipe especializada para ajudar no que você precisar.',
      features: [
        'Suporte 24/7',
        'Chat em tempo real',
        'Base de conhecimento',
        'Treinamento completo'
      ]
    }
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <nav className={styles.nav}>
          <Link to="/" className={styles.logo}>
            <MessageCircle size={32} />
            <span>ReactZapi</span>
          </Link>
          <div className={styles.navLinks}>
            <Link to="/login" className={styles.loginBtn}>Entrar</Link>
            <Link to="/register" className={styles.ctaBtn}>Começar Grátis</Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTitle}>
            Recursos Poderosos para
            <span className={styles.gradient}> Impulsionar seu Negócio</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Descubra todas as ferramentas e funcionalidades que vão transformar
            sua estratégia de marketing no WhatsApp
          </p>
        </div>
      </section>

      {/* Resources Grid */}
      <section className={styles.resourcesSection}>
        <div className={styles.resourcesGrid}>
          {resources.map((resource, index) => {
            const Icon = resource.icon;
            return (
              <div key={index} className={styles.resourceCard}>
                <div className={styles.iconWrapper}>
                  <Icon size={32} />
                </div>
                <h3 className={styles.resourceTitle}>{resource.title}</h3>
                <p className={styles.resourceDescription}>{resource.description}</p>
                <ul className={styles.featureList}>
                  {resource.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Pronto para começar?</h2>
          <p className={styles.ctaSubtitle}>
            Experimente gratuitamente e veja como nossos recursos podem transformar seu negócio
          </p>
          <Link to="/register" className={styles.ctaButton}>
            Começar Agora Grátis
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; 2024 ReactZapi. Todos os direitos reservados.</p>
          <div className={styles.footerLinks}>
            <Link to="/privacy">Privacidade</Link>
            <Link to="/terms">Termos</Link>
            <Link to="/compliance">Compliance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
