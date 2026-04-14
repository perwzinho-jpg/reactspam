import { Link } from 'react-router-dom';
import { MessageCircle, Shield, Lock, Eye, Database, FileText } from 'lucide-react';
import styles from './LegalPage.module.css';

function Privacy() {
  return (
    <div className={styles.legalPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <Link to="/" className={styles.logo}>
            <MessageCircle size={32} />
            <span>ReactZapi</span>
          </Link>
          <nav className={styles.nav}>
            <Link to="/login" className={styles.navLink}>Entrar</Link>
            <Link to="/register" className={styles.navButton}>Começar Grátis</Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className={styles.hero}>
        <div className={styles.heroContent}>
          <div className={styles.iconWrapper}>
            <Shield size={48} />
          </div>
          <h1>Política de Privacidade</h1>
          <p>Última atualização: Janeiro de 2025</p>
        </div>
      </section>

      {/* Content */}
      <main className={styles.content}>
        <div className={styles.container}>
          <div className={styles.sidebar}>
            <nav className={styles.tableOfContents}>
              <h3>Índice</h3>
              <a href="#introduction">Introdução</a>
              <a href="#data-collection">Dados Coletados</a>
              <a href="#data-usage">Uso dos Dados</a>
              <a href="#data-sharing">Compartilhamento</a>
              <a href="#data-security">Segurança</a>
              <a href="#cookies">Cookies</a>
              <a href="#rights">Seus Direitos</a>
              <a href="#contact">Contato</a>
            </nav>
          </div>

          <div className={styles.mainContent}>
            <section id="introduction" className={styles.section}>
              <div className={styles.sectionIcon}>
                <FileText size={24} />
              </div>
              <h2>1. Introdução</h2>
              <p>
                Bem-vindo à ReactZapi. Esta Política de Privacidade descreve como coletamos, usamos,
                armazenamos e protegemos suas informações pessoais quando você utiliza nossa plataforma
                de automação de marketing para WhatsApp.
              </p>
              <p>
                Ao utilizar nossos serviços, você concorda com as práticas descritas nesta política.
                Recomendamos que você leia este documento cuidadosamente para entender como tratamos
                suas informações.
              </p>
            </section>

            <section id="data-collection" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Database size={24} />
              </div>
              <h2>2. Dados Coletados</h2>
              <p>Coletamos as seguintes categorias de informações:</p>

              <h3>2.1 Informações de Conta</h3>
              <ul>
                <li>Nome completo e nome de usuário</li>
                <li>Endereço de e-mail</li>
                <li>Senha (armazenada com criptografia)</li>
                <li>Data de criação da conta</li>
              </ul>

              <h3>2.2 Dados de Uso</h3>
              <ul>
                <li>Informações sobre campanhas criadas</li>
                <li>Templates de mensagens</li>
                <li>Números de telefone para envio de mensagens</li>
                <li>Estatísticas de envio e entrega</li>
                <li>Logs de atividade na plataforma</li>
              </ul>

              <h3>2.3 Informações Técnicas</h3>
              <ul>
                <li>Endereço IP</li>
                <li>Tipo de navegador e dispositivo</li>
                <li>Sistema operacional</li>
                <li>Informações de cookies e tecnologias similares</li>
              </ul>

              <h3>2.4 Dados de WhatsApp</h3>
              <ul>
                <li>Credenciais de instâncias Z-API</li>
                <li>Números de telefone conectados</li>
                <li>Status de conexão das instâncias</li>
              </ul>
            </section>

            <section id="data-usage" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Eye size={24} />
              </div>
              <h2>3. Uso dos Dados</h2>
              <p>Utilizamos suas informações para:</p>

              <ul>
                <li><strong>Fornecer o serviço:</strong> Processar suas campanhas, enviar mensagens e gerenciar suas instâncias WhatsApp</li>
                <li><strong>Melhorar a plataforma:</strong> Analisar padrões de uso para aprimorar funcionalidades e corrigir problemas</li>
                <li><strong>Comunicação:</strong> Enviar notificações importantes sobre sua conta, atualizações do serviço e suporte técnico</li>
                <li><strong>Segurança:</strong> Detectar e prevenir fraudes, abusos e violações de segurança</li>
                <li><strong>Conformidade legal:</strong> Cumprir obrigações legais e regulatórias</li>
                <li><strong>Analytics:</strong> Gerar estatísticas agregadas e anônimas sobre o uso da plataforma</li>
              </ul>
            </section>

            <section id="data-sharing" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Shield size={24} />
              </div>
              <h2>4. Compartilhamento de Dados</h2>
              <p>
                Não vendemos suas informações pessoais a terceiros. Podemos compartilhar seus dados
                apenas nas seguintes situações:
              </p>

              <h3>4.1 Provedores de Serviço</h3>
              <p>
                Compartilhamos dados com prestadores de serviços confiáveis que nos auxiliam na
                operação da plataforma, incluindo:
              </p>
              <ul>
                <li><strong>Z-API:</strong> Para processamento e envio de mensagens WhatsApp</li>
                <li><strong>Hospedagem:</strong> Serviços de armazenamento em nuvem e infraestrutura</li>
                <li><strong>Analytics:</strong> Ferramentas de análise de uso e performance</li>
              </ul>

              <h3>4.2 Requisitos Legais</h3>
              <p>
                Podemos divulgar informações quando exigido por lei, ordem judicial ou processo
                legal, ou para proteger direitos, propriedade ou segurança da ReactZapi,
                de nossos usuários ou do público.
              </p>

              <h3>4.3 Transferências Empresariais</h3>
              <p>
                Em caso de fusão, aquisição ou venda de ativos, suas informações podem ser
                transferidas para a entidade sucessora.
              </p>
            </section>

            <section id="data-security" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Lock size={24} />
              </div>
              <h2>5. Segurança dos Dados</h2>
              <p>
                Implementamos medidas técnicas e organizacionais adequadas para proteger suas
                informações contra acesso não autorizado, alteração, divulgação ou destruição:
              </p>

              <ul>
                <li><strong>Criptografia:</strong> Senhas são criptografadas usando bcrypt com salt</li>
                <li><strong>HTTPS:</strong> Todas as comunicações utilizam protocolo SSL/TLS</li>
                <li><strong>Controle de acesso:</strong> Sistemas de autenticação e autorização robustos</li>
                <li><strong>Monitoramento:</strong> Logs de auditoria e detecção de atividades suspeitas</li>
                <li><strong>Backups:</strong> Backups regulares com retenção segura</li>
                <li><strong>Atualizações:</strong> Manutenção constante de segurança e patches</li>
              </ul>

              <div className={styles.alert}>
                <Shield size={20} />
                <p>
                  Embora implementemos medidas de segurança robustas, nenhum sistema é 100% seguro.
                  Recomendamos que você utilize senhas fortes e únicas, e nunca compartilhe suas
                  credenciais de acesso.
                </p>
              </div>
            </section>

            <section id="cookies" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Database size={24} />
              </div>
              <h2>6. Cookies e Tecnologias Similares</h2>
              <p>
                Utilizamos cookies e tecnologias similares para melhorar sua experiência na plataforma:
              </p>

              <h3>6.1 Cookies Essenciais</h3>
              <p>
                Necessários para o funcionamento básico da plataforma, incluindo autenticação
                e segurança da sessão.
              </p>

              <h3>6.2 Cookies de Preferências</h3>
              <p>
                Armazenam suas preferências de configuração, tema e idioma.
              </p>

              <h3>6.3 Cookies Analíticos</h3>
              <p>
                Nos ajudam a entender como você utiliza a plataforma para melhorarmos nossos serviços.
              </p>

              <p>
                Você pode gerenciar cookies através das configurações do seu navegador, mas isso
                pode afetar a funcionalidade de alguns recursos.
              </p>
            </section>

            <section id="rights" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Shield size={24} />
              </div>
              <h2>7. Seus Direitos (LGPD)</h2>
              <p>
                De acordo com a Lei Geral de Proteção de Dados (LGPD), você tem os seguintes direitos:
              </p>

              <ul>
                <li><strong>Acesso:</strong> Solicitar uma cópia dos seus dados pessoais</li>
                <li><strong>Correção:</strong> Corrigir dados incompletos, inexatos ou desatualizados</li>
                <li><strong>Exclusão:</strong> Solicitar a exclusão dos seus dados pessoais</li>
                <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado e legível</li>
                <li><strong>Revogação:</strong> Revogar o consentimento para tratamento de dados</li>
                <li><strong>Oposição:</strong> Opor-se ao tratamento de dados em certas circunstâncias</li>
                <li><strong>Informação:</strong> Obter informações sobre o tratamento dos seus dados</li>
              </ul>

              <p>
                Para exercer qualquer um desses direitos, entre em contato conosco através do
                e-mail: <a href="mailto:privacy@reactzapi.com">privacy@reactzapi.com</a>
              </p>
            </section>

            <section id="contact" className={styles.section}>
              <div className={styles.sectionIcon}>
                <MessageCircle size={24} />
              </div>
              <h2>8. Contato</h2>
              <p>
                Se você tiver dúvidas, preocupações ou solicitações relacionadas a esta Política
                de Privacidade, entre em contato conosco:
              </p>

              <div className={styles.contactInfo}>
                <p><strong>E-mail:</strong> privacy@reactzapi.com</p>
                <p><strong>Suporte:</strong> suporte@reactzapi.com</p>
                <p><strong>Endereço:</strong> [Seu endereço comercial]</p>
              </div>

              <p className={styles.lastUpdate}>
                Esta Política de Privacidade foi atualizada pela última vez em Janeiro de 2025.
                Reservamo-nos o direito de modificar esta política a qualquer momento. Quaisquer
                alterações serão publicadas nesta página com a data de atualização revisada.
              </p>
            </section>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <p>&copy; 2025 ReactZapi. Todos os direitos reservados.</p>
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

export default Privacy;
