import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Zap,
  TrendingUp,
  Shield,
  Clock,
  Users,
  BarChart3,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  Bot,
  Smartphone
} from 'lucide-react';
import { useScrollReveal } from '../hooks/useScrollReveal';
import { useCountUp } from '../hooks/useCountUp';
import styles from './LandingPage.module.css';

function LandingPage() {
  // ===== TODOS OS HOOKS NO INÍCIO =====

  // Estados
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [highlightedSection, setHighlightedSection] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Refs
  const chatAreaRef = useRef(null);

  // Scroll reveal hooks
  const [statsRef, statsVisible] = useScrollReveal({ threshold: 0.2 });
  const [featuresRef, featuresVisible] = useScrollReveal({ threshold: 0.1 });
  const [benefitsRef, benefitsVisible] = useScrollReveal({ threshold: 0.2 });
  const [ctaRef, ctaVisible] = useScrollReveal({ threshold: 0.3 });

  // Contadores animados
  const messagesCount = useCountUp(10000, { isVisible: statsVisible, suffix: '+', duration: 2500 });
  const uptimeCount = useCountUp(99.9, { isVisible: statsVisible, decimals: 1, suffix: '%', duration: 2500 });
  const clientsCount = useCountUp(500, { isVisible: statsVisible, suffix: '+', duration: 2500 });
  const deliveryRate = useCountUp(98.5, { isVisible: benefitsVisible, decimals: 1, suffix: '%', duration: 2000 });
  const openRate = useCountUp(87.3, { isVisible: benefitsVisible, decimals: 1, suffix: '%', duration: 2000 });
  const conversionRate = useCountUp(34.2, { isVisible: benefitsVisible, decimals: 1, suffix: '%', duration: 2000 });

  // ===== CONSTANTES E DADOS =====

  // Mensagens que serão enviadas em sequência
  const messageTemplates = [
    { text: 'Olá! Sua sessão de treino começa em 30 minutos 💪', time: '14:30' },
    { text: 'Promoção especial! 50% OFF em todos os planos premium 🎉', time: '14:31' },
    { text: 'Lembrete: Reunião de equipe às 15h', time: '14:32' },
    { text: 'Seu pedido #1234 foi enviado! Rastreie aqui: bit.ly/track', time: '14:33' },
  ];

  // Função para scroll suave com animação e highlight
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      // Adiciona classe de highlight
      setHighlightedSection(sectionId);

      // Scroll suave
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });

      // Remove highlight após animação
      setTimeout(() => {
        setHighlightedSection(null);
      }, 2000);

      // Fecha o menu mobile se estiver aberto
      setMobileMenuOpen(false);
    }
  };

  // Toggle do menu mobile
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Bloqueia scroll quando menu mobile está aberto
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // Auto-scroll quando novas mensagens aparecem
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTo({
        top: chatAreaRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, isTyping]);

  // Simular envio de mensagens do WhatsApp em tempo real
  useEffect(() => {
    const sendNextMessage = () => {
      // Mostra typing indicator
      setIsTyping(true);

      setTimeout(() => {
        // Adiciona a mensagem
        const nextIndex = currentMessageIndex % messageTemplates.length;
        setMessages(prev => {
          // Mantém apenas as últimas 3 mensagens
          const newMessages = [...prev, { ...messageTemplates[nextIndex], id: Date.now() }];
          return newMessages.slice(-3);
        });
        setIsTyping(false);
        setCurrentMessageIndex(prev => prev + 1);
      }, 2000); // Tempo de digitação
    };

    // Envia primeira mensagem após 1s
    const initialTimeout = setTimeout(sendNextMessage, 1000);

    // Continua enviando mensagens a cada 5s
    const interval = setInterval(sendNextMessage, 5000);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, [currentMessageIndex]);

  const features = [
    {
      icon: <Zap size={32} />,
      title: 'Disparo em Massa',
      description: 'Envie milhares de mensagens personalizadas em minutos com nossa tecnologia de alta performance.'
    },
    {
      icon: <Bot size={32} />,
      title: 'Automação com IA',
      description: 'Utilize inteligência artificial para personalizar mensagens e aumentar a taxa de conversão.'
    },
    {
      icon: <BarChart3 size={32} />,
      title: 'Analytics Avançado',
      description: 'Acompanhe métricas em tempo real e otimize suas campanhas com dados precisos.'
    },
    {
      icon: <Shield size={32} />,
      title: 'Anti-Ban Protection',
      description: 'Sistema inteligente que protege suas contas com padrões de envio humanizados.'
    },
    {
      icon: <Clock size={32} />,
      title: 'Agendamento Inteligente',
      description: 'Programe suas campanhas para os melhores horários e maximize o engajamento.'
    },
    {
      icon: <Users size={32} />,
      title: 'Multi-Instâncias',
      description: 'Gerencie múltiplas contas WhatsApp simultaneamente com failover automático.'
    }
  ];

  const benefits = [
    'Integração direta com Z-API',
    'Suporte a imagens e botões',
    'Templates personalizáveis',
    'Sistema de variáveis dinâmicas',
    'Rastreamento de links',
    'Exportação de leads',
    'Suporte 24/7',
    'Atualizações constantes'
  ];

  return (
    <div className={styles.landingPage}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.logo}>
            <MessageCircle className={styles.logoIcon} size={32} />
            <span className={styles.logoText}>ReactZapi</span>
          </div>

          <nav className={styles.navCenter}>
            <a
              href="#features"
              className={styles.navLink}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('features');
              }}
            >
              Recursos
            </a>
            <a
              href="#pricing"
              className={styles.navLink}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection('pricing');
              }}
            >
              Preços
            </a>
          </nav>

          <div className={styles.navRight}>
            <Link to="/login" className={styles.navLink}>Entrar</Link>
            <Link to="/register" className={styles.navButton}>Começar Grátis</Link>
          </div>

          {/* Hamburger Menu Button */}
          <div
            className={`${styles.hamburger} ${mobileMenuOpen ? styles.active : ''}`}
            onClick={toggleMobileMenu}
          >
            <div className={styles.hamburgerLine}></div>
            <div className={styles.hamburgerLine}></div>
            <div className={styles.hamburgerLine}></div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileMenu} ${mobileMenuOpen ? styles.active : ''}`}>
        <a
          href="#features"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('features');
          }}
        >
          Recursos
        </a>
        <a
          href="#pricing"
          onClick={(e) => {
            e.preventDefault();
            scrollToSection('pricing');
          }}
        >
          Preços
        </a>
        <div className={styles.mobileMenuButtons}>
          <Link
            to="/login"
            className={styles.navLink}
            onClick={() => setMobileMenuOpen(false)}
          >
            Entrar
          </Link>
          <Link
            to="/register"
            className={styles.navButton}
            onClick={() => setMobileMenuOpen(false)}
          >
            Começar Grátis
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.heroContainer}>
          <div className={styles.heroContent}>
            <div className={styles.badge}>
              <Sparkles size={16} />
              <span>Powered by AI</span>
            </div>
            <h1 className={styles.heroTitle}>
              Automatize seu Marketing no{' '}
              <span className={styles.gradient}>WhatsApp</span>
            </h1>
            <p className={styles.heroSubtitle}>
              Envie mensagens em massa, gerencie campanhas e aumente suas vendas com a plataforma mais completa de automação para WhatsApp.
            </p>
            <div className={styles.heroButtons}>
              <Link to="/register" className={styles.ctaButton}>
                Começar Agora
                <ArrowRight size={20} />
              </Link>
            </div>
            <div ref={statsRef} className={`${styles.heroStats} ${statsVisible ? styles.visible : ''}`}>
              <div className={styles.stat}>
                <strong>{messagesCount}</strong>
                <span>Mensagens/dia</span>
              </div>
              <div className={styles.stat}>
                <strong>{uptimeCount}</strong>
                <span>Uptime</span>
              </div>
              <div className={styles.stat}>
                <strong>{clientsCount}</strong>
                <span>Clientes</span>
              </div>
            </div>
          </div>
          <div className={styles.heroImage}>
            <div className={styles.whatsappChat}>
              {/* WhatsApp Header */}
              <div className={styles.whatsappHeader}>
                <div className={styles.whatsappHeaderLeft}>
                  <div className={styles.whatsappAvatar}>
                    <Users size={20} />
                  </div>
                  <div className={styles.whatsappHeaderInfo}>
                    <div className={styles.whatsappContactName}>Campanha Marketing</div>
                    <div className={styles.whatsappStatus}>
                      {isTyping ? 'digitando...' : `${messages.length + 150} contatos`}
                    </div>
                  </div>
                </div>
              </div>

              {/* WhatsApp Chat Area */}
              <div ref={chatAreaRef} className={styles.whatsappChatArea}>
                {/* Data Badge */}
                <div className={styles.whatsappDateBadge}>
                  <span>Hoje</span>
                </div>

                {/* Mensagens */}
                {messages.map((msg, index) => (
                  <div key={msg.id} className={styles.whatsappMessageWrapper}>
                    <div className={styles.whatsappMessage}>
                      <div className={styles.whatsappMessageText}>{msg.text}</div>
                      <div className={styles.whatsappMessageMeta}>
                        <span className={styles.whatsappMessageTime}>{msg.time}</span>
                        <div className={styles.whatsappMessageCheck}>
                          <CheckCircle2 size={16} />
                          <CheckCircle2 size={16} />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Typing Indicator */}
                {isTyping && (
                  <div className={styles.whatsappMessageWrapper}>
                    <div className={`${styles.whatsappMessage} ${styles.whatsappTyping}`}>
                      <div className={styles.typingIndicator}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* WhatsApp Stats Footer */}
              <div className={styles.whatsappFooter}>
                <div className={styles.whatsappStat}>
                  <CheckCircle2 size={16} />
                  <span>Agendado para 14:30</span>
                </div>
                <div className={styles.whatsappStat}>
                  <div className={styles.statusDot}></div>
                  <span>Enviando</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        ref={featuresRef}
        className={`${styles.features} ${highlightedSection === 'features' ? styles.highlighted : ''}`}
        id="features"
      >
        <div className={styles.container}>
          <div className={`${styles.sectionHeader} ${featuresVisible ? styles.visible : ''}`}>
            <h2 className={styles.sectionTitle}>
              Recursos <span className={styles.gradient}>Poderosos</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Tudo que você precisa para dominar o marketing no WhatsApp
            </p>
          </div>
          <div className={styles.featuresGrid}>
            {features.map((feature, index) => (
              <div
                key={index}
                className={`${styles.featureCard} ${featuresVisible ? styles.visible : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className={styles.featureIcon}>
                  {feature.icon}
                </div>
                <h3 className={styles.featureTitle}>{feature.title}</h3>
                <p className={styles.featureDescription}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className={styles.benefits}>
        <div className={styles.container}>
          <div className={`${styles.benefitsContent} ${benefitsVisible ? styles.visible : ''}`}>
            <div className={styles.benefitsLeft}>
              <h2 className={styles.benefitsTitle}>
                Por que escolher <span className={styles.gradient}>ReactZapi</span>?
              </h2>
              <p className={styles.benefitsSubtitle}>
                A plataforma mais completa e confiável do mercado
              </p>
              <div className={styles.benefitsList}>
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className={`${styles.benefitItem} ${benefitsVisible ? styles.visible : ''}`}
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <CheckCircle2 size={20} className={styles.checkIcon} />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.benefitsRight}>
              <div className={`${styles.statsCard} ${benefitsVisible ? styles.visible : ''}`}>
                <div className={styles.statsCardHeader}>
                  <TrendingUp size={24} />
                  <span>Performance em Tempo Real</span>
                </div>
                <div className={styles.statsCardBody}>
                  <div className={styles.statsMetric}>
                    <span className={styles.statsLabel}>Taxa de Entrega</span>
                    <span className={styles.statsValue}>{deliveryRate}</span>
                  </div>
                  <div className={styles.statsMetric}>
                    <span className={styles.statsLabel}>Taxa de Abertura</span>
                    <span className={styles.statsValue}>{openRate}</span>
                  </div>
                  <div className={styles.statsMetric}>
                    <span className={styles.statsLabel}>Conversão</span>
                    <span className={styles.statsValue}>{conversionRate}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section
        className={`${styles.pricing} ${highlightedSection === 'pricing' ? styles.highlighted : ''}`}
        id="pricing"
      >
        <div className={styles.container}>
          <div className={styles.pricingHeaderWrapper}>
            <div className={styles.pricingHeaderBadge}>
              <Sparkles size={20} />
              <span>Planos Especiais</span>
            </div>
          </div>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>
              Planos e <span className={styles.gradient}>Preços</span>
            </h2>
            <p className={styles.sectionSubtitle}>
              Escolha o plano ideal para o seu negócio
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {/* Starter Plan */}
            <div className={styles.pricingCard}>
              <h3 className={styles.pricingTitle}>Starter</h3>
              <p className={styles.pricingDescription}>Perfeito para começar</p>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingCurrency}>R$</span>
                <span className={styles.pricingAmount}>97</span>
                <span className={styles.pricingPeriod}>/mês</span>
              </div>
              <ul className={styles.pricingFeatures}>
                <li><CheckCircle2 size={18} /> 5.000 mensagens/mês</li>
                <li><CheckCircle2 size={18} /> 2 instâncias</li>
                <li><CheckCircle2 size={18} /> Analytics básico</li>
                <li><CheckCircle2 size={18} /> Suporte por email</li>
                <li><CheckCircle2 size={18} /> Templates ilimitados</li>
              </ul>
              <Link to="/register" className={styles.pricingButton}>
                Começar Agora
              </Link>
            </div>

            {/* Professional Plan */}
            <div className={`${styles.pricingCard} ${styles.pricingCardPopular}`}>
              <div className={styles.pricingBadge}>Mais Popular</div>
              <h3 className={styles.pricingTitle}>Professional</h3>
              <p className={styles.pricingDescription}>Para empresas em crescimento</p>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingCurrency}>R$</span>
                <span className={styles.pricingAmount}>297</span>
                <span className={styles.pricingPeriod}>/mês</span>
              </div>
              <ul className={styles.pricingFeatures}>
                <li><CheckCircle2 size={18} /> 50.000 mensagens/mês</li>
                <li><CheckCircle2 size={18} /> 10 instâncias</li>
                <li><CheckCircle2 size={18} /> Analytics avançado</li>
                <li><CheckCircle2 size={18} /> Suporte prioritário</li>
                <li><CheckCircle2 size={18} /> Automação com IA</li>
                <li><CheckCircle2 size={18} /> API completa</li>
              </ul>
              <Link to="/register" className={styles.pricingButton}>
                Começar Agora
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className={styles.pricingCard}>
              <h3 className={styles.pricingTitle}>Enterprise</h3>
              <p className={styles.pricingDescription}>Solução completa</p>
              <div className={styles.pricingPrice}>
                <span className={styles.pricingCurrency}>R$</span>
                <span className={styles.pricingAmount}>997</span>
                <span className={styles.pricingPeriod}>/mês</span>
              </div>
              <ul className={styles.pricingFeatures}>
                <li><CheckCircle2 size={18} /> Mensagens ilimitadas</li>
                <li><CheckCircle2 size={18} /> Instâncias ilimitadas</li>
                <li><CheckCircle2 size={18} /> Analytics premium</li>
                <li><CheckCircle2 size={18} /> Suporte 24/7</li>
                <li><CheckCircle2 size={18} /> Gerente de conta</li>
                <li><CheckCircle2 size={18} /> Personalização total</li>
              </ul>
              <Link to="/register" className={styles.pricingButton}>
                Começar Agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section ref={ctaRef} className={styles.cta}>
        <div className={styles.container}>
          <div className={`${styles.ctaContent} ${ctaVisible ? styles.visible : ''}`}>
            <h2 className={styles.ctaTitle}>
              Pronto para revolucionar seu marketing?
            </h2>
            <p className={styles.ctaSubtitle}>
              Junte-se a centenas de empresas que já automatizaram suas vendas
            </p>
            <Link to="/register" className={styles.ctaButtonLarge}>
              Criar Conta Grátis
              <ArrowRight size={24} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <div className={styles.container}>
          <div className={styles.footerContent}>
            <div className={styles.footerBrand}>
              <div className={styles.footerLogo}>
                <MessageCircle size={28} />
                <span>ReactZapi</span>
              </div>
              <p className={styles.footerDescription}>
                A plataforma definitiva para automação de marketing no WhatsApp
              </p>
            </div>
            <div className={styles.footerLinks}>
              <div className={styles.footerColumn}>
                <h4>Produto</h4>
                <Link to="/resources">Recursos</Link>
                <Link to="/pricing">Preços</Link>
                <Link to="/docs">Documentação</Link>
              </div>
              <div className={styles.footerColumn}>
                <h4>Empresa</h4>
                <Link to="/about">Sobre</Link>
                <Link to="/blog">Blog</Link>
                <Link to="/contact">Contato</Link>
              </div>
              <div className={styles.footerColumn}>
                <h4>Legal</h4>
                <Link to="/privacy">Privacidade</Link>
                <Link to="/terms">Termos</Link>
                <Link to="/compliance">Compliance</Link>
              </div>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <p>&copy; 2025 ReactZapi. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
