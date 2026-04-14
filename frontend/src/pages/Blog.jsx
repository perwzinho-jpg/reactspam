import { Link } from 'react-router-dom';
import { MessageCircle, Calendar, User, ArrowRight } from 'lucide-react';
import styles from './SimplePage.module.css';

export default function Blog() {
  const posts = [
    {
      title: 'Como Aumentar suas Vendas com WhatsApp Marketing',
      excerpt: 'Descubra as melhores estratégias para converter mais leads através do WhatsApp',
      author: 'Maria Silva',
      date: '15 de Dezembro, 2024',
      readTime: '5 min',
      category: 'Marketing'
    },
    {
      title: '10 Dicas para Evitar Bloqueios no WhatsApp',
      excerpt: 'Práticas essenciais para manter suas contas seguras e ativas',
      author: 'João Santos',
      date: '10 de Dezembro, 2024',
      readTime: '7 min',
      category: 'Segurança'
    },
    {
      title: 'Automação Inteligente: O Futuro do Atendimento',
      excerpt: 'Como a IA está transformando a forma de se comunicar com clientes',
      author: 'Ana Costa',
      date: '5 de Dezembro, 2024',
      readTime: '6 min',
      category: 'Tecnologia'
    },
    {
      title: 'Cases de Sucesso: Como Triplicamos o ROI',
      excerpt: 'Histórias reais de empresas que transformaram seus resultados',
      author: 'Carlos Mendes',
      date: '1 de Dezembro, 2024',
      readTime: '8 min',
      category: 'Cases'
    },
    {
      title: 'Guia Completo de Mensagens em Massa',
      excerpt: 'Tudo que você precisa saber sobre disparos em massa no WhatsApp',
      author: 'Paula Oliveira',
      date: '28 de Novembro, 2024',
      readTime: '10 min',
      category: 'Guias'
    },
    {
      title: 'Métricas que Importam no WhatsApp Marketing',
      excerpt: 'Aprenda a medir e otimizar seus resultados',
      author: 'Roberto Lima',
      date: '25 de Novembro, 2024',
      readTime: '6 min',
      category: 'Analytics'
    }
  ];

  return (
    <div className={styles.container}>
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

      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.iconLarge}>
            <MessageCircle size={64} />
          </div>
          <h1 className={styles.heroTitle}>
            Blog
            <span className={styles.gradient}> ReactZapi</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Dicas, tutoriais e novidades sobre WhatsApp Marketing
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.blogGrid}>
          {posts.map((post, index) => (
            <article key={index} className={styles.blogCard}>
              <div className={styles.categoryBadge}>{post.category}</div>
              <h3 className={styles.blogTitle}>{post.title}</h3>
              <p className={styles.blogExcerpt}>{post.excerpt}</p>
              <div className={styles.blogMeta}>
                <div className={styles.blogAuthor}>
                  <User size={16} />
                  <span>{post.author}</span>
                </div>
                <div className={styles.blogDate}>
                  <Calendar size={16} />
                  <span>{post.date}</span>
                </div>
              </div>
              <div className={styles.blogFooter}>
                <span className={styles.readTime}>{post.readTime} de leitura</span>
                <a href="#" className={styles.readMore}>
                  Ler mais <ArrowRight size={16} />
                </a>
              </div>
            </article>
          ))}
        </div>

        <div className={styles.newsletter}>
          <h2>Receba novidades por email</h2>
          <p>Inscreva-se para receber artigos e dicas exclusivas</p>
          <div className={styles.newsletterForm}>
            <input type="email" placeholder="Seu melhor email" />
            <button>Inscrever-se</button>
          </div>
        </div>
      </section>

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
