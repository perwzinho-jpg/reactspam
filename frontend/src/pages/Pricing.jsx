import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MessageCircle,
  Check,
  X,
  Zap,
  TrendingUp,
  Rocket
} from 'lucide-react';
import styles from './Pricing.module.css';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = [
    {
      name: 'Starter',
      icon: Zap,
      description: 'Perfeito para começar',
      monthlyPrice: 97,
      yearlyPrice: 970,
      features: [
        { text: '5.000 mensagens/mês', included: true },
        { text: '2 instâncias', included: true },
        { text: 'Analytics básico', included: true },
        { text: 'Suporte por email', included: true },
        { text: 'Templates ilimitados', included: true },
        { text: 'API básica', included: true },
        { text: 'Automação com IA', included: false },
        { text: 'Suporte prioritário', included: false },
        { text: 'Gerente de conta', included: false }
      ],
      popular: false
    },
    {
      name: 'Professional',
      icon: TrendingUp,
      description: 'Para empresas em crescimento',
      monthlyPrice: 297,
      yearlyPrice: 2970,
      features: [
        { text: '50.000 mensagens/mês', included: true },
        { text: '10 instâncias', included: true },
        { text: 'Analytics avançado', included: true },
        { text: 'Suporte prioritário', included: true },
        { text: 'Templates ilimitados', included: true },
        { text: 'API completa', included: true },
        { text: 'Automação com IA', included: true },
        { text: 'Webhooks', included: true },
        { text: 'Gerente de conta', included: false }
      ],
      popular: true
    },
    {
      name: 'Enterprise',
      icon: Rocket,
      description: 'Solução completa',
      monthlyPrice: 997,
      yearlyPrice: 9970,
      features: [
        { text: 'Mensagens ilimitadas', included: true },
        { text: 'Instâncias ilimitadas', included: true },
        { text: 'Analytics premium', included: true },
        { text: 'Suporte 24/7', included: true },
        { text: 'Templates ilimitados', included: true },
        { text: 'API completa + SDKs', included: true },
        { text: 'Automação com IA', included: true },
        { text: 'Webhooks', included: true },
        { text: 'Gerente de conta dedicado', included: true }
      ],
      popular: false
    }
  ];

  const comparison = [
    {
      category: 'Envio de Mensagens',
      features: [
        { name: 'Mensagens por mês', starter: '5.000', professional: '50.000', enterprise: 'Ilimitado' },
        { name: 'Agendamento', starter: true, professional: true, enterprise: true },
        { name: 'Disparo em massa', starter: true, professional: true, enterprise: true },
        { name: 'Prioridade de envio', starter: false, professional: true, enterprise: true }
      ]
    },
    {
      category: 'Automação',
      features: [
        { name: 'Templates', starter: 'Ilimitado', professional: 'Ilimitado', enterprise: 'Ilimitado' },
        { name: 'Chatbot com IA', starter: false, professional: true, enterprise: true },
        { name: 'Respostas automáticas', starter: false, professional: true, enterprise: true },
        { name: 'Fluxos personalizados', starter: false, professional: true, enterprise: true }
      ]
    },
    {
      category: 'Analytics',
      features: [
        { name: 'Relatórios básicos', starter: true, professional: true, enterprise: true },
        { name: 'Relatórios avançados', starter: false, professional: true, enterprise: true },
        { name: 'Exportação de dados', starter: false, professional: true, enterprise: true },
        { name: 'Dashboard customizado', starter: false, professional: false, enterprise: true }
      ]
    },
    {
      category: 'Suporte',
      features: [
        { name: 'Email', starter: true, professional: true, enterprise: true },
        { name: 'Chat prioritário', starter: false, professional: true, enterprise: true },
        { name: 'Suporte 24/7', starter: false, professional: false, enterprise: true },
        { name: 'Gerente de conta', starter: false, professional: false, enterprise: true }
      ]
    }
  ];

  const getPrice = (plan) => {
    return billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = () => {
    return billingCycle === 'yearly' ? '20% de desconto' : null;
  };

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
            Escolha o plano ideal para
            <span className={styles.gradient}> seu negócio</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Sem taxas ocultas. Cancele quando quiser. Upgrade ou downgrade a qualquer momento.
          </p>

          {/* Billing Toggle */}
          <div className={styles.billingToggle}>
            <button
              className={billingCycle === 'monthly' ? styles.active : ''}
              onClick={() => setBillingCycle('monthly')}
            >
              Mensal
            </button>
            <button
              className={billingCycle === 'yearly' ? styles.active : ''}
              onClick={() => setBillingCycle('yearly')}
            >
              Anual
              <span className={styles.savingsBadge}>-20%</span>
            </button>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className={styles.pricingSection}>
        <div className={styles.pricingGrid}>
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <div
                key={index}
                className={`${styles.pricingCard} ${plan.popular ? styles.popular : ''}`}
              >
                {plan.popular && (
                  <div className={styles.popularBadge}>Mais Popular</div>
                )}
                <div className={styles.cardHeader}>
                  <div className={styles.iconWrapper}>
                    <Icon size={32} />
                  </div>
                  <h3 className={styles.planName}>{plan.name}</h3>
                  <p className={styles.planDescription}>{plan.description}</p>
                </div>

                <div className={styles.priceWrapper}>
                  <div className={styles.price}>
                    <span className={styles.currency}>R$</span>
                    <span className={styles.amount}>{getPrice(plan)}</span>
                    <span className={styles.period}>/{billingCycle === 'monthly' ? 'mês' : 'ano'}</span>
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className={styles.savings}>
                      Economize R${plan.monthlyPrice * 12 - plan.yearlyPrice}/ano
                    </div>
                  )}
                </div>

                <Link to="/register" className={styles.selectPlan}>
                  Começar Agora
                </Link>

                <ul className={styles.featuresList}>
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className={feature.included ? '' : styles.notIncluded}>
                      {feature.included ? (
                        <Check size={18} className={styles.checkIcon} />
                      ) : (
                        <X size={18} className={styles.xIcon} />
                      )}
                      <span>{feature.text}</span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* Comparison Table */}
      <section className={styles.comparisonSection}>
        <h2 className={styles.comparisonTitle}>Comparação Detalhada</h2>
        <div className={styles.tableWrapper}>
          <table className={styles.comparisonTable}>
            <thead>
              <tr>
                <th>Recursos</th>
                <th>Starter</th>
                <th className={styles.popularColumn}>Professional</th>
                <th>Enterprise</th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((section, idx) => (
                <>
                  <tr key={`cat-${idx}`} className={styles.categoryRow}>
                    <td colSpan={4}>{section.category}</td>
                  </tr>
                  {section.features.map((feature, fIdx) => (
                    <tr key={`feat-${idx}-${fIdx}`}>
                      <td>{feature.name}</td>
                      <td>
                        {typeof feature.starter === 'boolean' ? (
                          feature.starter ? (
                            <Check size={20} className={styles.checkIcon} />
                          ) : (
                            <X size={20} className={styles.xIcon} />
                          )
                        ) : (
                          feature.starter
                        )}
                      </td>
                      <td className={styles.popularColumn}>
                        {typeof feature.professional === 'boolean' ? (
                          feature.professional ? (
                            <Check size={20} className={styles.checkIcon} />
                          ) : (
                            <X size={20} className={styles.xIcon} />
                          )
                        ) : (
                          feature.professional
                        )}
                      </td>
                      <td>
                        {typeof feature.enterprise === 'boolean' ? (
                          feature.enterprise ? (
                            <Check size={20} className={styles.checkIcon} />
                          ) : (
                            <X size={20} className={styles.xIcon} />
                          )
                        ) : (
                          feature.enterprise
                        )}
                      </td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ Section */}
      <section className={styles.faqSection}>
        <h2 className={styles.faqTitle}>Perguntas Frequentes</h2>
        <div className={styles.faqGrid}>
          <div className={styles.faqItem}>
            <h3>Posso mudar de plano depois?</h3>
            <p>Sim! Você pode fazer upgrade ou downgrade do seu plano a qualquer momento.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Como funciona o período de teste?</h3>
            <p>Oferecemos 7 dias de teste grátis em todos os planos, sem necessidade de cartão de crédito.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Quais são as formas de pagamento?</h3>
            <p>Aceitamos cartão de crédito, PIX e boleto bancário.</p>
          </div>
          <div className={styles.faqItem}>
            <h3>Posso cancelar a qualquer momento?</h3>
            <p>Sim, você pode cancelar sua assinatura a qualquer momento sem multas.</p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaContent}>
          <h2 className={styles.ctaTitle}>Pronto para começar?</h2>
          <p className={styles.ctaSubtitle}>
            Experimente gratuitamente por 7 dias. Não é necessário cartão de crédito.
          </p>
          <Link to="/register" className={styles.ctaButton}>
            Começar Teste Grátis
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
