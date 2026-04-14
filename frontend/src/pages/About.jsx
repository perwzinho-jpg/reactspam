import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Users,
  Target,
  Zap,
  Heart,
  Trophy,
  TrendingUp,
  Globe
} from 'lucide-react';
import styles from './AboutPage.module.css';

function About() {
  const stats = [
    { icon: <Users size={32} />, value: '500+', label: 'Clientes Ativos' },
    { icon: <TrendingUp size={32} />, value: '10M+', label: 'Mensagens Enviadas' },
    { icon: <Globe size={32} />, value: '99.9%', label: 'Uptime' },
    { icon: <Trophy size={32} />, value: '4.9/5', label: 'Avaliação' }
  ];

  const values = [
    {
      icon: <Target size={32} />,
      title: 'Foco no Cliente',
      description: 'Colocamos as necessidades dos nossos clientes em primeiro lugar, sempre.'
    },
    {
      icon: <Zap size={32} />,
      title: 'Inovação Constante',
      description: 'Buscamos continuamente novas formas de melhorar e inovar nossa plataforma.'
    },
    {
      icon: <Heart size={32} />,
      title: 'Transparência',
      description: 'Acreditamos em comunicação clara e honesta com nossos usuários.'
    },
    {
      icon: <Trophy size={32} />,
      title: 'Excelência',
      description: 'Comprometidos em entregar a melhor experiência e resultados.'
    }
  ];

  return (
    <div className={styles.aboutPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link to="/" className={styles.logo}>
            <MessageCircle size={32} />
            <span>ReactZapi</span>
          </Link>
          <nav className={styles.nav}>
            <Link to="/" className={styles.navLink}>Início</Link>
            <Link to="/pricing" className={styles.navLink}>Preços</Link>
            <Link to="/login" className={styles.navLink}>Entrar</Link>
            <Link to="/register" className={styles.navButton}>Começar Grátis</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.badge}>
            <Heart size={16} />
            <span>Sobre Nós</span>
          </div>
          <h1>Revolucionando o Marketing no WhatsApp</h1>
          <p>
            Somos uma plataforma inovadora que ajuda empresas a automatizar e escalar suas
            campanhas de marketing no WhatsApp com eficiência e segurança.
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className={styles.stats}>
        <div className={styles.container}>
          <div className={styles.statsGrid}>
            {stats.map((stat, index) => (
              <div key={index} className={styles.statCard}>
                <div className={styles.statIcon}>{stat.icon}</div>
                <h3>{stat.value}</h3>
                <p>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section className={styles.mission}>
        <div className={styles.container}>
          <div className={styles.missionContent}>
            <div className={styles.missionText}>
              <div className={styles.sectionBadge}>Nossa Missão</div>
              <h2>Democratizar o Acesso ao Marketing de WhatsApp</h2>
              <p>
                Nossa missão é tornar o marketing de WhatsApp acessível e eficaz para empresas
                de todos os tamanhos. Acreditamos que toda empresa merece ter acesso a
                ferramentas poderosas de automação sem complexidade desnecessária.
              </p>
              <p>
                Através da ReactZapi, eliminamos as barreiras técnicas e fornecemos uma
                plataforma intuitiva que permite que você se concentre no que realmente
                importa: conectar-se com seus clientes e fazer seu negócio crescer.
              </p>
            </div>
            <div className={styles.missionImage}>
              <div className={styles.imageCard}>
                <MessageCircle size={120} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className={styles.values}>
        <div className={styles.container}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Nossos Valores</div>
            <h2>O Que Nos Guia</h2>
            <p>Princípios fundamentais que direcionam tudo que fazemos</p>
          </div>
          <div className={styles.valuesGrid}>
            {values.map((value, index) => (
              <div key={index} className={styles.valueCard}>
                <div className={styles.valueIcon}>{value.icon}</div>
                <h3>{value.title}</h3>
                <p>{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className={styles.story}>
        <div className={styles.container}>
          <div className={styles.storyContent}>
            <div className={styles.sectionBadge}>Nossa História</div>
            <h2>Como Tudo Começou</h2>
            <div className={styles.timeline}>
              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <Zap size={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h3>2023 - A Ideia</h3>
                  <p>
                    Percebemos a dificuldade que empresas enfrentavam para automatizar
                    mensagens no WhatsApp de forma eficiente e decidimos criar uma solução.
                  </p>
                </div>
              </div>

              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <Target size={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h3>2024 - Desenvolvimento</h3>
                  <p>
                    Após meses de desenvolvimento intenso, lançamos a primeira versão da
                    ReactZapi com funcionalidades essenciais de automação.
                  </p>
                </div>
              </div>

              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <Trophy size={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h3>2024 - Crescimento</h3>
                  <p>
                    Rapidamente conquistamos centenas de clientes satisfeitos e expandimos
                    nossa plataforma com novos recursos baseados em feedback real.
                  </p>
                </div>
              </div>

              <div className={styles.timelineItem}>
                <div className={styles.timelineIcon}>
                  <TrendingUp size={24} />
                </div>
                <div className={styles.timelineContent}>
                  <h3>2025 - Expansão</h3>
                  <p>
                    Continuamos inovando com IA, analytics avançados e integrações,
                    consolidando nossa posição como líder em automação de WhatsApp.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.container}>
          <div className={styles.ctaContent}>
            <h2>Pronto para Começar?</h2>
            <p>Junte-se a centenas de empresas que já transformaram seu marketing</p>
            <div className={styles.ctaButtons}>
              <Link to="/register" className={styles.ctaButton}>
                Criar Conta Grátis
              </Link>
              <Link to="/contact" className={styles.ctaButtonSecondary}>
                Falar com Vendas
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; 2025 ReactZapi. Todos os direitos reservados.</p>
          <div className={styles.footerLinks}>
            <Link to="/about">Sobre</Link>
            <Link to="/privacy">Privacidade</Link>
            <Link to="/terms">Termos</Link>
            <Link to="/contact">Contato</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default About;
