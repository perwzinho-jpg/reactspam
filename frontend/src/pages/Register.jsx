import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import {
  Loader2,
  MessageCircle,
  Lock,
  User,
  Mail,
  ArrowRight,
  Sparkles,
  UserPlus,
  Check,
  X
} from 'lucide-react';
import styles from './AuthModern.module.css';

function Register() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    adminCode: '',
    honeypot: '' // Bot protection
  });
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    label: 'Muito fraca'
  });

  const calculatePasswordStrength = (password) => {
    let score = 0;
    if (!password) return { score: 0, label: 'Muito fraca' };

    // Length
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;

    // Complexity
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    // Label
    let label = 'Muito fraca';
    if (score >= 4) label = 'Forte';
    else if (score >= 3) label = 'Média';
    else if (score >= 2) label = 'Fraca';

    return { score, label };
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Calculate password strength
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value));
    }

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Nome completo é obrigatório';
    } else if (formData.fullName.trim().split(' ').length < 2) {
      newErrors.fullName = 'Digite nome e sobrenome';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Usuário é obrigatório';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Usuário deve ter no mínimo 3 caracteres';
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      newErrors.username = 'Usuário só pode conter letras, números e underscore';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    } else if (passwordStrength.score < 2) {
      newErrors.password = 'Senha muito fraca. Use letras, números e símbolos';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Confirme sua senha';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Bot protection
    if (formData.honeypot) {
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      // include adminCode only if provided
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName
      };
      if (formData.adminCode) {
        payload.adminCode = formData.adminCode;
      }

      const { data } = await api.post('/auth/register', payload);

      if (data.success) {
        setAuth(data.token, data.user);
        toast.success(data.message);
        navigate('/app/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao criar conta');
    } finally {
      setLoading(false);
    }
  };

  const getStrengthClass = () => {
    if (passwordStrength.score >= 4) return 'strong';
    if (passwordStrength.score >= 2) return 'medium';
    return 'weak';
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.authBackground}>
        <div className={styles.gradientOrb1}></div>
        <div className={styles.gradientOrb2}></div>
        <div className={styles.gradientOrb3}></div>
      </div>

      <div className={styles.authContent}>
        {/* Left Side - Branding */}
        <div className={styles.authBranding}>
          <Link to="/" className={styles.brandLogo}>
            <MessageCircle size={40} />
            <span>ReactZapi</span>
          </Link>
          <h1 className={styles.brandTitle}>
            Comece gratuitamente no{' '}
            <span className={styles.gradient}>ReactZapi</span>
          </h1>
          <p className={styles.brandSubtitle}>
            Crie sua conta em segundos e comece a automatizar suas campanhas de WhatsApp hoje mesmo.
          </p>
          <div className={styles.brandFeatures}>
            <div className={styles.brandFeature}>
              <Check size={20} />
              <span>Sem cartão de crédito</span>
            </div>
            <div className={styles.brandFeature}>
              <Check size={20} />
              <span>Configuração em 2 minutos</span>
            </div>
            <div className={styles.brandFeature}>
              <Check size={20} />
              <span>Suporte gratuito incluído</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className={styles.authFormContainer}>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <h2>Criar sua conta</h2>
              <p>Preencha os dados abaixo para começar</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.authForm}>
              {/* Honeypot */}
              <input
                type="text"
                name="honeypot"
                value={formData.honeypot}
                onChange={handleChange}
                className={styles.honeypot}
                tabIndex={-1}
                autoComplete="off"
              />

              <div className={styles.formGroup}>
                <label>
                  <UserPlus size={18} />
                  Nome Completo
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Digite seu nome completo"
                  disabled={loading}
                  className={errors.fullName ? styles.inputError : ''}
                />
                {errors.fullName && (
                  <span className={styles.errorMessage}>{errors.fullName}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  <User size={18} />
                  Nome de Usuário
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Escolha um nome de usuário"
                  disabled={loading}
                  className={errors.username ? styles.inputError : ''}
                />
                {errors.username && (
                  <span className={styles.errorMessage}>{errors.username}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  <Mail size={18} />
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Digite seu email"
                  disabled={loading}
                  className={errors.email ? styles.inputError : ''}
                />
                {errors.email && (
                  <span className={styles.errorMessage}>{errors.email}</span>
                )}
              </div>

              {/* Admin code - optional, hidden by default */}
              <div className={styles.formGroup}>
                <label>
                  <Sparkles size={18} />
                  Código de administrador (opcional)
                </label>
                <input
                  type="text"
                  name="adminCode"
                  value={formData.adminCode}
                  onChange={handleChange}
                  placeholder="Se você tiver código de admin"
                  disabled={loading}
                />
              </div>

              <div className={styles.formGroup}>
                <label>
                  <Lock size={18} />
                  Senha
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Crie uma senha forte"
                  disabled={loading}
                  className={errors.password ? styles.inputError : ''}
                />
                {formData.password && (
                  <div className={styles.passwordStrength}>
                    <div className={styles.strengthBar}>
                      <div className={`${styles.strengthSegment} ${passwordStrength.score >= 1 ? styles.active : ''} ${styles[getStrengthClass()]}`}></div>
                      <div className={`${styles.strengthSegment} ${passwordStrength.score >= 2 ? styles.active : ''} ${styles[getStrengthClass()]}`}></div>
                      <div className={`${styles.strengthSegment} ${passwordStrength.score >= 3 ? styles.active : ''} ${styles[getStrengthClass()]}`}></div>
                      <div className={`${styles.strengthSegment} ${passwordStrength.score >= 4 ? styles.active : ''} ${styles[getStrengthClass()]}`}></div>
                    </div>
                    <span className={`${styles.strengthText} ${styles[getStrengthClass()]}`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                )}
                {errors.password && (
                  <span className={styles.errorMessage}>{errors.password}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  <Lock size={18} />
                  Confirmar Senha
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Digite a senha novamente"
                  disabled={loading}
                  className={errors.confirmPassword ? styles.inputError : ''}
                />
                {errors.confirmPassword && (
                  <span className={styles.errorMessage}>{errors.confirmPassword}</span>
                )}
              </div>

              <button
                type="submit"
                className={styles.submitBtn}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className={styles.spinner} />
                    Criando conta...
                  </>
                ) : (
                  <>
                    Criar Conta Grátis
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <div className={styles.divider}>
                <span>ou</span>
              </div>

              <p className={styles.authLink}>
                Já tem uma conta?{' '}
                <Link to="/login">Fazer login</Link>
              </p>
            </form>
          </div>

          <p className={styles.authFooter}>
            Ao criar uma conta, você concorda com nossos{' '}
            <Link to="/terms" target="_blank">Termos de Serviço</Link> e{' '}
            <Link to="/privacy" target="_blank">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
