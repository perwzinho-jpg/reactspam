import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';
import api from '../lib/api';
import { Loader2, MessageCircle, Lock, User, ArrowRight, Sparkles, Eye, EyeOff } from 'lucide-react';
import styles from './AuthModern.module.css';

function Login() {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    honeypot: '' // Bot protection
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Clear error for this field
    if (errors[name]) {
      setErrors({ ...errors, [name]: '' });
    }
  };

  const validate = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Usuário ou email é obrigatório';
    }

    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Bot protection: check honeypot
    if (formData.honeypot) {
      return;
    }

    if (!validate()) {
      return;
    }

    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', {
        username: formData.username,
        password: formData.password
      });

      if (data.success) {
        setAuth(data.token, data.user);
        toast.success(data.message);
        navigate('/app/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
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
            Bem-vindo de volta ao{' '}
            <span className={styles.gradient}>ReactZapi</span>
          </h1>
          <p className={styles.brandSubtitle}>
            Automatize suas campanhas de WhatsApp e alcance milhares de clientes com apenas alguns cliques.
          </p>
          <div className={styles.brandFeatures}>
            <div className={styles.brandFeature}>
              <Sparkles size={20} />
              <span>Disparo em Massa com IA</span>
            </div>
            <div className={styles.brandFeature}>
              <Sparkles size={20} />
              <span>Analytics em Tempo Real</span>
            </div>
            <div className={styles.brandFeature}>
              <Sparkles size={20} />
              <span>Anti-Ban Protection</span>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className={styles.authFormContainer}>
          <div className={styles.authCard}>
            <div className={styles.authHeader}>
              <h2>Entrar na sua conta</h2>
              <p>Digite suas credenciais para acessar</p>
            </div>

            <form onSubmit={handleSubmit} className={styles.authForm}>
              {/* Honeypot field - hidden from users, bots will fill it */}
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
                  <User size={18} />
                  Usuário ou Email
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Digite seu usuário ou email"
                  disabled={loading}
                  className={errors.username ? styles.inputError : ''}
                />
                {errors.username && (
                  <span className={styles.errorMessage}>{errors.username}</span>
                )}
              </div>

              <div className={styles.formGroup}>
                <label>
                  <Lock size={18} />
                  Senha
                </label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Digite sua senha"
                    disabled={loading}
                    className={errors.password ? styles.inputError : ''}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <span className={styles.errorMessage}>{errors.password}</span>
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
                    Entrando...
                  </>
                ) : (
                  <>
                    Entrar
                    <ArrowRight size={20} />
                  </>
                )}
              </button>

              <div className={styles.divider}>
                <span>ou</span>
              </div>

              <p className={styles.authLink}>
                Não tem uma conta?{' '}
                <Link to="/register">Criar conta grátis</Link>
              </p>
            </form>
          </div>

          <p className={styles.authFooter}>
            Ao continuar, você concorda com nossos{' '}
            <Link to="/terms" target="_blank">Termos de Serviço</Link> e{' '}
            <Link to="/privacy" target="_blank">Política de Privacidade</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
