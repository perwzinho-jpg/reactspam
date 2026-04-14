import { Link } from 'react-router-dom';
import { MessageCircle, Book, Code, Zap, Terminal, Lock, Globe } from 'lucide-react';
import styles from './SimplePage.module.css';

export default function Docs() {
  const sections = [
    {
      icon: Zap,
      title: 'Início Rápido',
      description: 'Comece a usar a plataforma em minutos',
      link: '#quick-start'
    },
    {
      icon: Code,
      title: 'API Reference',
      description: 'Documentação completa da API',
      link: '#api-reference'
    },
    {
      icon: Terminal,
      title: 'Guias e Tutoriais',
      description: 'Aprenda com exemplos práticos',
      link: '#guides'
    },
    {
      icon: Lock,
      title: 'Autenticação',
      description: 'Como autenticar suas requisições',
      link: '#authentication'
    },
    {
      icon: Globe,
      title: 'Webhooks',
      description: 'Receba notificações em tempo real',
      link: '#webhooks'
    },
    {
      icon: Book,
      title: 'SDKs',
      description: 'Bibliotecas para diversas linguagens',
      link: '#sdks'
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
            <Book size={64} />
          </div>
          <h1 className={styles.heroTitle}>
            Documentação
            <span className={styles.gradient}> Completa</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Tudo o que você precisa para integrar e usar nossa plataforma
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.grid}>
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <a key={index} href={section.link} className={styles.card}>
                <div className={styles.iconWrapper}>
                  <Icon size={32} />
                </div>
                <h3 className={styles.cardTitle}>{section.title}</h3>
                <p className={styles.cardDescription}>{section.description}</p>
              </a>
            );
          })}
        </div>

        <div className={styles.codeExample}>
          <h2 className={styles.exampleTitle}>Exemplo Rápido</h2>
          <pre className={styles.codeBlock}>
{`// Instalar o SDK
npm install @reactzapi/sdk

// Importar e inicializar
import { ReactZapi } from '@reactzapi/sdk';

const client = new ReactZapi({
  apiKey: 'sua-api-key-aqui'
});

// Enviar mensagem
await client.messages.send({
  to: '5511999999999',
  message: 'Olá! Esta é uma mensagem de teste.'
});`}
          </pre>
        </div>

        <div className={styles.resources}>
          <h2 className={styles.resourcesTitle}>Recursos Adicionais</h2>
          <div className={styles.resourcesList}>
            <div className={styles.resourceItem}>
              <h3>Changelog</h3>
              <p>Veja as últimas atualizações e melhorias da plataforma</p>
            </div>
            <div className={styles.resourceItem}>
              <h3>Status da API</h3>
              <p>Monitore o status e disponibilidade dos nossos serviços</p>
            </div>
            <div className={styles.resourceItem}>
              <h3>Comunidade</h3>
              <p>Participe das discussões e tire dúvidas com outros desenvolvedores</p>
            </div>
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
