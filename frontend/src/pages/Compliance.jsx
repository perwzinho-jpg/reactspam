import { Link } from 'react-router-dom';
import { MessageCircle, Shield, CheckCircle, FileCheck, Lock, Globe } from 'lucide-react';
import styles from './LegalPage.module.css';

function Compliance() {
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
            <FileCheck size={48} />
          </div>
          <h1>Compliance e Segurança</h1>
          <p>Nosso compromisso com segurança, privacidade e conformidade regulatória</p>
        </div>
      </section>

      {/* Content */}
      <main className={styles.content}>
        <div className={styles.container}>
          <div className={styles.sidebar}>
            <nav className={styles.tableOfContents}>
              <h3>Índice</h3>
              <a href="#overview">Visão Geral</a>
              <a href="#lgpd">LGPD</a>
              <a href="#security">Segurança de Dados</a>
              <a href="#whatsapp">WhatsApp Business</a>
              <a href="#certifications">Certificações</a>
              <a href="#audits">Auditorias</a>
              <a href="#incident">Resposta a Incidentes</a>
            </nav>
          </div>

          <div className={styles.mainContent}>
            <section id="overview" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Shield size={24} />
              </div>
              <h2>1. Visão Geral de Compliance</h2>
              <p>
                Na ReactZapi, levamos a segurança e a conformidade muito a sério. Nossa plataforma
                foi projetada desde o início com proteção de dados, privacidade e segurança como
                prioridades fundamentais.
              </p>
              <p>
                Este documento descreve nosso compromisso com as melhores práticas de segurança,
                conformidade regulatória e proteção de dados dos nossos usuários.
              </p>
            </section>

            <section id="lgpd" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Globe size={24} />
              </div>
              <h2>2. Conformidade com LGPD</h2>
              <p>
                A ReactZapi está em total conformidade com a Lei Geral de Proteção de Dados
                (Lei nº 13.709/2018), garantindo que todos os dados pessoais sejam tratados
                de acordo com os princípios e requisitos estabelecidos pela legislação brasileira.
              </p>

              <h3>2.1 Princípios Aplicados</h3>
              <ul>
                <li><strong>Finalidade:</strong> Dados coletados para propósitos legítimos, específicos e informados</li>
                <li><strong>Adequação:</strong> Tratamento compatível com as finalidades informadas</li>
                <li><strong>Necessidade:</strong> Limitação ao mínimo necessário para as finalidades</li>
                <li><strong>Transparência:</strong> Informações claras e acessíveis sobre o tratamento</li>
                <li><strong>Segurança:</strong> Medidas técnicas e administrativas de proteção</li>
                <li><strong>Prevenção:</strong> Medidas preventivas de danos e incidentes</li>
                <li><strong>Não discriminação:</strong> Impossibilidade de tratamento discriminatório</li>
                <li><strong>Responsabilização:</strong> Demonstração da eficácia das medidas adotadas</li>
              </ul>

              <h3>2.2 Base Legal para Tratamento</h3>
              <p>O tratamento de dados pessoais na ReactZapi baseia-se nas seguintes hipóteses legais:</p>
              <ul>
                <li>Consentimento do titular dos dados</li>
                <li>Execução de contrato ou procedimentos preliminares</li>
                <li>Legítimo interesse do controlador</li>
                <li>Cumprimento de obrigação legal ou regulatória</li>
              </ul>

              <h3>2.3 Direitos dos Titulares</h3>
              <p>Garantimos o exercício de todos os direitos previstos na LGPD:</p>
              <ul>
                <li>Confirmação da existência de tratamento</li>
                <li>Acesso aos dados</li>
                <li>Correção de dados incompletos, inexatos ou desatualizados</li>
                <li>Anonimização, bloqueio ou eliminação de dados desnecessários</li>
                <li>Portabilidade dos dados a outro fornecedor</li>
                <li>Eliminação dos dados tratados com consentimento</li>
                <li>Informação sobre compartilhamento de dados</li>
                <li>Revogação do consentimento</li>
              </ul>

              <h3>2.4 Encarregado de Proteção de Dados (DPO)</h3>
              <div className={styles.contactInfo}>
                <p><strong>Nome:</strong> [Nome do DPO]</p>
                <p><strong>E-mail:</strong> dpo@reactzapi.com</p>
                <p><strong>Função:</strong> Ponto de contato para questões relacionadas à proteção de dados</p>
              </div>
            </section>

            <section id="security" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Lock size={24} />
              </div>
              <h2>3. Segurança de Dados</h2>

              <h3>3.1 Criptografia</h3>
              <ul>
                <li><strong>Em Trânsito:</strong> TLS 1.3 para todas as comunicações HTTPS</li>
                <li><strong>Em Repouso:</strong> Criptografia AES-256 para dados sensíveis armazenados</li>
                <li><strong>Senhas:</strong> Hash bcrypt com salt de 12 rounds</li>
                <li><strong>Tokens:</strong> JWT com assinatura HMAC SHA-256</li>
              </ul>

              <h3>3.2 Controle de Acesso</h3>
              <ul>
                <li>Autenticação multifator (MFA) disponível</li>
                <li>Princípio do menor privilégio aplicado</li>
                <li>Segregação de ambientes (produção, desenvolvimento, testes)</li>
                <li>Logs de auditoria de acessos e operações</li>
                <li>Revisão periódica de permissões de acesso</li>
              </ul>

              <h3>3.3 Infraestrutura</h3>
              <ul>
                <li>Hospedagem em data centers certificados</li>
                <li>Firewalls de aplicação web (WAF)</li>
                <li>Proteção DDoS</li>
                <li>Backups automatizados diários</li>
                <li>Retenção de backups por 30 dias</li>
                <li>Testes de recuperação de desastres trimestrais</li>
              </ul>

              <h3>3.4 Desenvolvimento Seguro</h3>
              <ul>
                <li>Análise estática de código (SAST)</li>
                <li>Análise dinâmica de segurança (DAST)</li>
                <li>Revisão de código com foco em segurança</li>
                <li>Testes de penetração anuais por terceiros</li>
                <li>Gestão de vulnerabilidades e patches</li>
              </ul>
            </section>

            <section id="whatsapp" className={styles.section}>
              <div className={styles.sectionIcon}>
                <MessageCircle size={24} />
              </div>
              <h2>4. Conformidade WhatsApp Business</h2>
              <p>
                A ReactZapi opera em total conformidade com as políticas do WhatsApp Business
                e utiliza a Z-API como provedor oficial de integração.
              </p>

              <h3>4.1 Políticas Aplicadas</h3>
              <ul>
                <li>Respeito aos Termos de Serviço do WhatsApp</li>
                <li>Conformidade com políticas de mensagens comerciais</li>
                <li>Proteção contra spam e abuso</li>
                <li>Limites de taxa de envio respeitados</li>
                <li>Mecanismos de opt-out implementados</li>
              </ul>

              <h3>4.2 Boas Práticas</h3>
              <ul>
                <li>Orientação aos usuários sobre uso responsável</li>
                <li>Detecção automática de padrões de spam</li>
                <li>Sistema de rate limiting inteligente</li>
                <li>Rotação de instâncias para proteção anti-ban</li>
                <li>Monitoramento de saúde das instâncias</li>
              </ul>
            </section>

            <section id="certifications" className={styles.section}>
              <div className={styles.sectionIcon}>
                <CheckCircle size={24} />
              </div>
              <h2>5. Certificações e Padrões</h2>

              <h3>5.1 Padrões de Segurança</h3>
              <ul>
                <li><strong>OWASP Top 10:</strong> Proteção contra vulnerabilidades mais críticas</li>
                <li><strong>CWE/SANS Top 25:</strong> Mitigação de erros de software perigosos</li>
                <li><strong>ISO 27001:</strong> Sistema de gestão de segurança da informação (em processo)</li>
              </ul>

              <h3>5.2 Privacidade</h3>
              <ul>
                <li><strong>LGPD:</strong> Conformidade total com legislação brasileira</li>
                <li><strong>Privacy by Design:</strong> Privacidade incorporada desde a concepção</li>
                <li><strong>Privacy by Default:</strong> Configurações padrão voltadas à privacidade</li>
              </ul>
            </section>

            <section id="audits" className={styles.section}>
              <div className={styles.sectionIcon}>
                <FileCheck size={24} />
              </div>
              <h2>6. Auditorias e Avaliações</h2>

              <h3>6.1 Auditorias Internas</h3>
              <ul>
                <li>Revisões trimestrais de segurança</li>
                <li>Auditorias de logs e acessos mensais</li>
                <li>Avaliação de conformidade LGPD semestral</li>
                <li>Revisão de políticas de segurança anual</li>
              </ul>

              <h3>6.2 Auditorias Externas</h3>
              <ul>
                <li>Testes de penetração anuais por empresas especializadas</li>
                <li>Avaliação de vulnerabilidades por terceiros</li>
                <li>Auditoria de conformidade LGPD por consultoria externa</li>
              </ul>

              <h3>6.3 Relatórios de Transparência</h3>
              <p>
                Publicamos relatórios anuais de transparência incluindo:
              </p>
              <ul>
                <li>Estatísticas de incidentes de segurança</li>
                <li>Solicitações de acesso a dados por autoridades</li>
                <li>Exercício de direitos dos titulares de dados</li>
                <li>Melhorias implementadas em segurança e privacidade</li>
              </ul>
            </section>

            <section id="incident" className={styles.section}>
              <div className={styles.sectionIcon}>
                <Shield size={24} />
              </div>
              <h2>7. Resposta a Incidentes</h2>

              <h3>7.1 Processo de Resposta</h3>
              <p>
                Mantemos um processo estruturado de resposta a incidentes de segurança:
              </p>
              <ul>
                <li><strong>Detecção:</strong> Monitoramento contínuo e alertas automatizados</li>
                <li><strong>Contenção:</strong> Isolamento imediato para limitar impacto</li>
                <li><strong>Investigação:</strong> Análise forense para determinar causa raiz</li>
                <li><strong>Erradicação:</strong> Remoção da ameaça e vulnerabilidades</li>
                <li><strong>Recuperação:</strong> Restauração de sistemas e dados</li>
                <li><strong>Lições Aprendidas:</strong> Documentação e melhorias</li>
              </ul>

              <h3>7.2 Comunicação de Incidentes</h3>
              <p>
                Em caso de incidente de segurança que afete dados pessoais:
              </p>
              <ul>
                <li>Notificação à ANPD em até 72 horas quando aplicável</li>
                <li>Comunicação aos titulares afetados quando houver risco</li>
                <li>Transparência sobre natureza e extensão do incidente</li>
                <li>Orientações sobre medidas de mitigação</li>
              </ul>

              <h3>7.3 Contato para Incidentes</h3>
              <div className={styles.contactInfo}>
                <p><strong>E-mail de Segurança:</strong> security@reactzapi.com</p>
                <p><strong>Resposta:</strong> 24 horas em dias úteis</p>
                <p><strong>PGP Key:</strong> Disponível mediante solicitação</p>
              </div>

              <div className={styles.alert}>
                <Shield size={20} />
                <p>
                  Se você descobrir uma vulnerabilidade de segurança em nossa plataforma,
                  pedimos que nos reporte de forma responsável através do e-mail
                  security@reactzapi.com. Investigaremos todas as reportagens legítimas e
                  faremos o possível para corrigir rapidamente o problema.
                </p>
              </div>
            </section>

            <section className={styles.section}>
              <h2>Compromisso Contínuo</h2>
              <p>
                A conformidade e a segurança são processos contínuos, não destinos finais.
                Estamos comprometidos em:
              </p>
              <ul>
                <li>Manter e melhorar continuamente nossos controles de segurança</li>
                <li>Adaptar-nos a novas regulamentações e melhores práticas</li>
                <li>Investir em tecnologias e treinamento de segurança</li>
                <li>Manter transparência com nossos usuários</li>
                <li>Responder prontamente a preocupações e incidentes</li>
              </ul>
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

export default Compliance;
