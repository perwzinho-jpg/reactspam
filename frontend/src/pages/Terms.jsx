import { Link } from 'react-router-dom';
import { MessageCircle, FileText, AlertTriangle, CheckCircle, XCircle, Scale } from 'lucide-react';
import styles from './LegalPage.module.css';

function Terms() {
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
            <Scale size={48} />
          </div>
          <h1>Termos de Serviço</h1>
          <p>Última atualização: Janeiro de 2025</p>
        </div>
      </section>

      {/* Content */}
      <main className={styles.content}>
        <div className={styles.container}>
          <div className={styles.sidebar}>
            <nav className={styles.tableOfContents}>
              <h3>Índice</h3>
              <a href="#acceptance">Aceitação</a>
              <a href="#services">Serviços</a>
              <a href="#account">Conta de Usuário</a>
              <a href="#acceptable-use">Uso Aceitável</a>
              <a href="#prohibited">Usos Proibidos</a>
              <a href="#intellectual-property">Propriedade Intelectual</a>
              <a href="#payment">Pagamento</a>
              <a href="#termination">Rescisão</a>
              <a href="#liability">Limitação de Responsabilidade</a>
              <a href="#changes">Alterações</a>
            </nav>
          </div>

          <div className={styles.mainContent}>
            <section id="acceptance" className={styles.section}>
              <div className={styles.sectionIcon}>
                <FileText size={24} />
              </div>
              <h2>1. Aceitação dos Termos</h2>
              <p>
                Bem-vindo ao ReactZapi. Ao acessar e usar nossa plataforma de automação de marketing
                para WhatsApp, você concorda em cumprir e estar vinculado aos seguintes Termos de
                Serviço.
              </p>
              <p>
                Se você não concordar com qualquer parte destes termos, não deverá usar nossos serviços.
                Estes termos se aplicam a todos os visitantes, usuários e outras pessoas que acessam
                ou usam o serviço.
              </p>
              <div className={styles.alert}>
                <AlertTriangle size={20} />
                <p>
                  Ao criar uma conta ou utilizar nossos serviços, você confirma que leu, entendeu
                  e concorda com estes Termos de Serviço e nossa Política de Privacidade.
                </p>
              </div>
            </section>

            <section id="services" className={styles.section}>
              <div className={styles.sectionIcon}>
                <CheckCircle size={24} />
              </div>
              <h2>2. Descrição dos Serviços</h2>
              <p>
                A ReactZapi fornece uma plataforma de software como serviço (SaaS) que permite aos
                usuários automatizar o envio de mensagens em massa através do WhatsApp.
              </p>

              <h3>2.1 Funcionalidades Principais</h3>
              <ul>
                <li>Criação e gerenciamento de campanhas de mensagens</li>
                <li>Integração com Z-API para envio via WhatsApp</li>
                <li>Templates personalizáveis de mensagens</li>
                <li>Gerenciamento de múltiplas instâncias WhatsApp</li>
                <li>Analytics e relatórios de desempenho</li>
                <li>Sistema de agendamento inteligente</li>
              </ul>

              <h3>2.2 Disponibilidade</h3>
              <p>
                Embora nos esforcemos para manter o serviço disponível 24/7, não garantimos que
                o serviço estará ininterrupto ou livre de erros. Reservamo-nos o direito de
                modificar, suspender ou descontinuar o serviço a qualquer momento.
              </p>
            </section>

            <section id="account" className={styles.section}>
              <div className={styles.sectionIcon}>
                <FileText size={24} />
              </div>
              <h2>3. Conta de Usuário</h2>

              <h3>3.1 Criação de Conta</h3>
              <p>
                Para usar nossos serviços, você deve criar uma conta fornecendo informações
                precisas, completas e atualizadas. Você é responsável por:
              </p>
              <ul>
                <li>Manter a confidencialidade das suas credenciais de acesso</li>
                <li>Todas as atividades que ocorrem sob sua conta</li>
                <li>Notificar-nos imediatamente sobre qualquer uso não autorizado</li>
              </ul>

              <h3>3.2 Elegibilidade</h3>
              <p>
                Você deve ter pelo menos 18 anos de idade e capacidade legal para celebrar
                contratos vinculativos para usar nossos serviços.
              </p>

              <h3>3.3 Conta Empresarial</h3>
              <p>
                Se você estiver criando uma conta em nome de uma empresa, você declara ter
                autoridade para vincular essa entidade a estes termos.
              </p>
            </section>

            <section id="acceptable-use" className={styles.section}>
              <div className={styles.sectionIcon}>
                <CheckCircle size={24} />
              </div>
              <h2>4. Política de Uso Aceitável</h2>
              <p>Ao usar a ReactZapi, você concorda em:</p>

              <ul>
                <li>Utilizar o serviço apenas para fins legítimos e legais</li>
                <li>Respeitar todas as leis e regulamentações aplicáveis</li>
                <li>Cumprir os Termos de Serviço do WhatsApp e da Z-API</li>
                <li>Respeitar os direitos de privacidade dos destinatários</li>
                <li>Obter consentimento apropriado antes de enviar mensagens de marketing</li>
                <li>Fornecer mecanismo de opt-out em mensagens comerciais</li>
                <li>Não exceder limites razoáveis de envio para evitar bloqueios</li>
                <li>Manter a segurança das suas credenciais de API</li>
              </ul>
            </section>

            <section id="prohibited" className={styles.section}>
              <div className={styles.sectionIcon}>
                <XCircle size={24} />
              </div>
              <h2>5. Usos Proibidos</h2>
              <p>
                Você <strong>NÃO</strong> deve usar nossa plataforma para:
              </p>

              <div className={styles.prohibitedList}>
                <div className={styles.prohibitedItem}>
                  <XCircle size={20} />
                  <div>
                    <strong>Spam e Mensagens Não Solicitadas</strong>
                    <p>Enviar mensagens em massa para pessoas que não consentiram em recebê-las</p>
                  </div>
                </div>

                <div className={styles.prohibitedItem}>
                  <XCircle size={20} />
                  <div>
                    <strong>Conteúdo Ilegal</strong>
                    <p>Compartilhar conteúdo que viole leis locais, nacionais ou internacionais</p>
                  </div>
                </div>

                <div className={styles.prohibitedItem}>
                  <XCircle size={20} />
                  <div>
                    <strong>Fraude e Phishing</strong>
                    <p>Tentar enganar, defraudar ou roubar informações de outras pessoas</p>
                  </div>
                </div>

                <div className={styles.prohibitedItem}>
                  <XCircle size={20} />
                  <div>
                    <strong>Malware e Vírus</strong>
                    <p>Distribuir software malicioso, vírus ou código prejudicial</p>
                  </div>
                </div>

                <div className={styles.prohibitedItem}>
                  <XCircle size={20} />
                  <div>
                    <strong>Assédio e Abuso</strong>
                    <p>Assediar, ameaçar, intimidar ou abusar de outros usuários</p>
                  </div>
                </div>

                <div className={styles.prohibitedItem}>
                  <XCircle size={20} />
                  <div>
                    <strong>Violação de Propriedade Intelectual</strong>
                    <p>Infringir direitos autorais, marcas registradas ou outros direitos de propriedade</p>
                  </div>
                </div>

                <div className={styles.prohibitedItem}>
                  <XCircle size={20} />
                  <div>
                    <strong>Conteúdo Ofensivo</strong>
                    <p>Compartilhar conteúdo difamatório, obsceno, pornográfico ou discriminatório</p>
                  </div>
                </div>

                <div className={styles.prohibitedItem}>
                  <XCircle size={20} />
                  <div>
                    <strong>Engenharia Reversa</strong>
                    <p>Tentar fazer engenharia reversa, descompilar ou hackear nossa plataforma</p>
                  </div>
                </div>
              </div>

              <div className={styles.alert}>
                <AlertTriangle size={20} />
                <p>
                  Violações desta política podem resultar em suspensão ou cancelamento imediato
                  da sua conta, sem reembolso, e possível ação legal.
                </p>
              </div>
            </section>

            <section id="intellectual-property" className={styles.section}>
              <div className={styles.sectionIcon}>
                <FileText size={24} />
              </div>
              <h2>6. Propriedade Intelectual</h2>

              <h3>6.1 Propriedade da ReactZapi</h3>
              <p>
                Todos os direitos de propriedade intelectual relacionados à plataforma ReactZapi,
                incluindo código-fonte, design, marcas, logos e conteúdo, são de propriedade
                exclusiva da ReactZapi ou de seus licenciadores.
              </p>

              <h3>6.2 Licença de Uso</h3>
              <p>
                Concedemos a você uma licença limitada, não exclusiva, não transferível e
                revogável para usar nossa plataforma de acordo com estes termos.
              </p>

              <h3>6.3 Seu Conteúdo</h3>
              <p>
                Você mantém todos os direitos sobre o conteúdo que cria ou carrega na plataforma
                (campanhas, templates, listas de contatos). Ao usar nosso serviço, você nos
                concede uma licença para processar e armazenar esse conteúdo conforme necessário
                para fornecer os serviços.
              </p>
            </section>

            <section id="payment" className={styles.section}>
              <div className={styles.sectionIcon}>
                <CheckCircle size={24} />
              </div>
              <h2>7. Pagamento e Assinaturas</h2>

              <h3>7.1 Planos e Preços</h3>
              <p>
                A ReactZapi oferece diferentes planos de assinatura. Os preços estão sujeitos
                a alterações mediante aviso prévio de 30 dias.
              </p>

              <h3>7.2 Faturamento</h3>
              <p>
                As assinaturas são cobradas de forma recorrente (mensal ou anual) usando o
                método de pagamento fornecido. Você autoriza cobranças automáticas.
              </p>

              <h3>7.3 Cancelamento e Reembolsos</h3>
              <p>
                Você pode cancelar sua assinatura a qualquer momento. O cancelamento entrará
                em vigor no final do período de faturamento atual. Não oferecemos reembolsos
                proporcionais, exceto quando exigido por lei.
              </p>

              <h3>7.4 Inadimplência</h3>
              <p>
                Se o pagamento não for recebido, podemos suspender ou cancelar sua conta após
                notificação adequada.
              </p>
            </section>

            <section id="termination" className={styles.section}>
              <div className={styles.sectionIcon}>
                <XCircle size={24} />
              </div>
              <h2>8. Rescisão</h2>

              <h3>8.1 Rescisão por Você</h3>
              <p>
                Você pode encerrar sua conta a qualquer momento através das configurações da
                plataforma ou entrando em contato com nosso suporte.
              </p>

              <h3>8.2 Rescisão por Nós</h3>
              <p>
                Podemos suspender ou encerrar sua conta imediatamente, sem aviso prévio, se:
              </p>
              <ul>
                <li>Você violar estes Termos de Serviço</li>
                <li>Você usar o serviço de forma fraudulenta ou ilegal</li>
                <li>Seu pagamento falhar ou sua conta estiver inadimplente</li>
                <li>Formos obrigados por lei ou ordem judicial</li>
              </ul>

              <h3>8.3 Efeitos da Rescisão</h3>
              <p>
                Após o encerramento da conta:
              </p>
              <ul>
                <li>Seu acesso à plataforma será imediatamente revogado</li>
                <li>Seus dados serão retidos por 30 dias e depois permanentemente excluídos</li>
                <li>Você permanece responsável por quaisquer taxas pendentes</li>
                <li>Backup de dados é sua responsabilidade antes do cancelamento</li>
              </ul>
            </section>

            <section id="liability" className={styles.section}>
              <div className={styles.sectionIcon}>
                <AlertTriangle size={24} />
              </div>
              <h2>9. Limitação de Responsabilidade</h2>

              <h3>9.1 Isenção de Garantias</h3>
              <p>
                O serviço é fornecido "como está" e "conforme disponível", sem garantias de
                qualquer tipo, expressas ou implícitas. Não garantimos que:
              </p>
              <ul>
                <li>O serviço atenderá suas necessidades específicas</li>
                <li>O serviço será ininterrupto, oportuno ou livre de erros</li>
                <li>Os resultados obtidos serão precisos ou confiáveis</li>
                <li>Defeitos serão corrigidos</li>
              </ul>

              <h3>9.2 Limitação de Danos</h3>
              <p>
                Em nenhuma circunstância a ReactZapi será responsável por quaisquer danos
                indiretos, incidentais, especiais, consequenciais ou punitivos, incluindo
                perda de lucros, dados, uso ou outras perdas intangíveis.
              </p>

              <h3>9.3 Limite Máximo</h3>
              <p>
                Nossa responsabilidade total por quaisquer reivindicações relacionadas aos
                serviços não excederá o valor pago por você nos 12 meses anteriores ao
                evento que deu origem à reivindicação.
              </p>

              <h3>9.4 Responsabilidade do Usuário</h3>
              <p>
                Você é exclusivamente responsável por:
              </p>
              <ul>
                <li>Seu uso da plataforma e cumprimento das leis aplicáveis</li>
                <li>Conteúdo que você envia ou transmite</li>
                <li>Backup de seus dados</li>
                <li>Conformidade com políticas do WhatsApp e Z-API</li>
              </ul>
            </section>

            <section id="changes" className={styles.section}>
              <div className={styles.sectionIcon}>
                <FileText size={24} />
              </div>
              <h2>10. Alterações nos Termos</h2>
              <p>
                Reservamo-nos o direito de modificar estes Termos de Serviço a qualquer momento.
                Notificaremos você sobre alterações significativas através de:
              </p>
              <ul>
                <li>E-mail para o endereço cadastrado</li>
                <li>Notificação na plataforma</li>
                <li>Atualização da data de "Última atualização" neste documento</li>
              </ul>
              <p>
                O uso continuado dos serviços após as alterações constitui aceitação dos
                novos termos. Se você não concordar com as alterações, deve cancelar sua conta.
              </p>

              <h3>Contato</h3>
              <p>
                Para questões sobre estes Termos de Serviço, entre em contato:
              </p>
              <div className={styles.contactInfo}>
                <p><strong>E-mail:</strong> legal@reactzapi.com</p>
                <p><strong>Suporte:</strong> suporte@reactzapi.com</p>
              </div>
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

export default Terms;
