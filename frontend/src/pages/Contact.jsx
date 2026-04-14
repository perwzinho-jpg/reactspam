import { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Mail, Phone, MapPin, Send } from 'lucide-react';
import styles from './SimplePage.module.css';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    // Handle form submission
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

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
            <Mail size={64} />
          </div>
          <h1 className={styles.heroTitle}>
            Entre em
            <span className={styles.gradient}> Contato</span>
          </h1>
          <p className={styles.heroSubtitle}>
            Estamos aqui para ajudar. Envie sua mensagem e responderemos em breve.
          </p>
        </div>
      </section>

      <section className={styles.content}>
        <div className={styles.contactLayout}>
          <div className={styles.contactInfo}>
            <h2>Informações de Contato</h2>
            <p>Escolha a melhor forma de entrar em contato conosco</p>

            <div className={styles.contactMethods}>
              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <Mail size={24} />
                </div>
                <div>
                  <h3>Email</h3>
                  <p>contato@reactzapi.com</p>
                </div>
              </div>

              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <Phone size={24} />
                </div>
                <div>
                  <h3>Telefone</h3>
                  <p>+55 11 9 9999-9999</p>
                </div>
              </div>

              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <MessageCircle size={24} />
                </div>
                <div>
                  <h3>WhatsApp</h3>
                  <p>+55 11 9 9999-9999</p>
                </div>
              </div>

              <div className={styles.contactMethod}>
                <div className={styles.contactIcon}>
                  <MapPin size={24} />
                </div>
                <div>
                  <h3>Endereço</h3>
                  <p>São Paulo, SP - Brasil</p>
                </div>
              </div>
            </div>

            <div className={styles.businessHours}>
              <h3>Horário de Atendimento</h3>
              <p>Segunda a Sexta: 9h às 18h</p>
              <p>Sábado: 9h às 13h</p>
              <p>Domingo: Fechado</p>
            </div>
          </div>

          <div className={styles.contactForm}>
            <h2>Envie sua Mensagem</h2>
            <form onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="name">Nome Completo</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Seu nome"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="seu@email.com"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="subject">Assunto</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  placeholder="Como podemos ajudar?"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="message">Mensagem</label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  placeholder="Descreva sua dúvida ou solicitação..."
                />
              </div>

              <button type="submit" className={styles.submitBtn}>
                <Send size={20} />
                Enviar Mensagem
              </button>
            </form>
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
