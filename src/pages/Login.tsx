import { useState, useRef, useEffect, type MouseEvent, type ComponentType, type CSSProperties } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Sparkles, DollarSign, CreditCard, PiggyBank, TrendingUp, Shield, BarChart3 } from "lucide-react";

// Floating 3D icon component
function Float3DIcon({ icon: Icon, className, style }: { icon: ComponentType<{ className?: string }>; className?: string; style?: CSSProperties }) {
  return (
    <div className={`absolute pointer-events-none ${className}`} style={style}>
      <div className="relative animate-float-3d">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{
            background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--accent) / 0.1))",
            border: "1px solid hsl(var(--primary) / 0.2)",
            boxShadow: "0 8px 32px -4px hsl(var(--primary) / 0.15), inset 0 1px 0 hsl(var(--foreground) / 0.05)",
            backdropFilter: "blur(12px)",
            transformStyle: "preserve-3d",
          }}
        >
          <Icon className="h-6 w-6 text-primary/70" />
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [appName, setAppName] = useState("Continhas da Duda");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{email?: string; password?: string; name?: string; general?: string}>({});
  const cardRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const navigate = useNavigate();

  useEffect(() => {
    const storedAppName = localStorage.getItem('appName');
    if (storedAppName && storedAppName.trim()) {
      setAppName(storedAppName);
    }

    const token = sessionStorage.getItem('token') || localStorage.getItem('token');
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      if (!payload.exp || Date.now() / 1000 > payload.exp) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('user');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }
      // already authenticated
      if (payload.id === 1) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch {
      // invalid token - do nothing and stay on login
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }, [navigate]);

  // Cleanup animation frames on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);


  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    // Cancel previous animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Schedule new animation frame
    animationFrameRef.current = requestAnimationFrame(() => {
      const rect = cardRef.current!.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const x = ((e.clientY - centerY) / (rect.height / 2)) * -10;
      const y = ((e.clientX - centerX) / (rect.width / 2)) * 10;

      setRotation({ x, y });
      setMousePos({
        x: ((e.clientX - rect.left) / rect.width) * 100,
        y: ((e.clientY - rect.top) / rect.height) * 100,
      });
    });
  };

  const handleMouseLeave = () => {
    // Cancel any pending animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setRotation({ x: 0, y: 0 });
    setIsHovering(false);
  };

  const validate = () => {
    const errs: typeof errors = {};
    if (!email.includes("@")) errs.email = "Email inválido";
    if (password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (isSignUp && name.trim().length < 2) errs.name = "Nome obrigatório";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const endpoint = isSignUp ? '/api/register' : '/api/login';
      const payload = isSignUp
        ? { username: name, email, password }
        : { email, password };

      console.log('[Login] request', endpoint, payload);
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('[Login] response status', response.status, response.statusText, 'body', responseText);

      let data: { token?: string; user?: { id?: number } } | null = null;
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('Falha ao parsear JSON de resposta:', parseError, 'texto:', responseText);
      }

      if (!response.ok) {
        const errorMessage = data?.error || `Erro ${response.status}: ${response.statusText}`;
        setErrors({ general: errorMessage });
        return;
      }

      if (!data || !data.token) {
        setErrors({ general: 'Resposta inválida do servidor, tente novamente.' });
        return;
      }

      // Store token and user data in session storage (limpa ao fechar aba)
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect based on user role (admin is user id 1)
      if (data.user.id === 1) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (error) {
      console.error('Erro na autenticação:', error);
      setErrors({ general: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[15%] left-[10%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: "4s" }} />
        <div className="absolute bottom-[5%] right-[5%] w-[400px] h-[400px] bg-accent/6 rounded-full blur-[140px] animate-pulse" style={{ animationDuration: "6s", animationDelay: "1s" }} />
        <div className="absolute top-[50%] left-[50%] w-[300px] h-[300px] bg-primary/4 rounded-full blur-[100px] animate-pulse" style={{ animationDuration: "5s", animationDelay: "2s" }} />
      </div>

      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.35] keyboard-grid" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 15% 20%, rgba(112, 211, 255, 0.16), transparent 35%), radial-gradient(circle at 80% 80%, rgba(167, 139, 250, 0.14), transparent 40%)' }} />

      {/* Floating 3D icons */}
      <Float3DIcon icon={DollarSign} className="top-[12%] left-[8%] hidden md:block" style={{ animationDelay: "0s" }} />
      <Float3DIcon icon={CreditCard} className="top-[8%] right-[12%] hidden md:block" style={{ animationDelay: "0.8s" }} />
      <Float3DIcon icon={PiggyBank} className="bottom-[20%] left-[12%] hidden md:block" style={{ animationDelay: "1.6s" }} />
      <Float3DIcon icon={TrendingUp} className="bottom-[15%] right-[8%] hidden md:block" style={{ animationDelay: "2.4s" }} />
      <Float3DIcon icon={Shield} className="top-[45%] left-[4%] hidden lg:block" style={{ animationDelay: "3.2s" }} />
      <Float3DIcon icon={BarChart3} className="top-[35%] right-[4%] hidden lg:block" style={{ animationDelay: "4s" }} />

      <div className="w-full max-w-[1100px] grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-up relative z-10 px-4 sm:px-6" style={{ perspective: "1200px" }}>
        <div className="bg-4d rounded-3xl border border-primary/25 backdrop-blur-sm p-6 sm:p-8 shadow-2xl shadow-primary/30 min-h-[80vh] md:min-h-[90vh] animate-4d">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg shadow-primary/30">
              <Sparkles className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white leading-tight">Finanças Pessoais</h1>
              <p className="text-sm text-muted-foreground">Controle simples e seguro para você organizar gastos, receitas e metas.</p>
            </div>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Plataforma feita para pessoas que querem ver saldo real, planejar próximas despesas e manter a saúde financeira sob controle.
          </p>

          <ul className="space-y-3 text-sm">
            <li className="flex gap-3 items-start text-slate-200">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" />
              <span>Login rápido e seguro com token, sessão de navegação protegida</span>
            </li>
            <li className="flex gap-3 items-start text-slate-200">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" />
              <span>Dados criptografados na transmissão e autenticação contínua</span>
            </li>
            <li className="flex gap-3 items-start text-slate-200">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" />
              <span>Resumo instantâneo de contas, categorias e orçamentos</span>
            </li>
            <li className="flex gap-3 items-start text-slate-200">
              <span className="mt-1 inline-flex h-2 w-2 rounded-full bg-primary" />
              <span>Metas de economia + alertas de limite para despesas</span>
            </li>
          </ul>

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-4">
            <h2 className="text-base font-semibold text-white">Sobre o sistema</h2>
            <p className="text-sm text-muted-foreground">Nome do App: <strong>{appName}</strong></p>
            <p className="text-sm text-muted-foreground">Segmento: Finanças Pessoais</p>
            <p className="text-sm text-muted-foreground">Stack: React + Express + PostgreSQL/Mock</p>
            <p className="text-xs text-muted-foreground/70 mt-2">© {new Date().getFullYear()} Gabriel Ribeiro Ramos. Todos os direitos reservados.</p>
          </div>

          <div className="relative mt-6 h-36 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900/70 via-sky-700/40 to-violet-800/60 border border-primary/20">
            <div className="absolute inset-0 opacity-70 blur-xl" style={{ background: 'radial-gradient(circle at 20% 20%, rgba(36, 152, 255, 0.35), transparent 300px), radial-gradient(circle at 80% 30%, rgba(145, 90, 255, 0.22), transparent 250px)' }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-20 h-20 rounded-full border border-primary/30 animate-pulse" />
              <div className="absolute w-32 h-32 border border-cyan-300/30 rounded-full animate-spin-slow" />
            </div>
            <p className="relative z-10 text-xs text-white/90 text-center font-medium">Gestão financeira pessoal clara, prática e segura para sua rotina</p>
          </div>
        </div>

        <div className="relative flex justify-center items-center px-4 sm:px-6">
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={handleMouseLeave}
            className="relative rounded-3xl transition-transform duration-300 ease-out w-full max-w-md sm:max-w-lg"
            style={{
              transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
              transformStyle: "preserve-3d",
            }}
          >
            <div
              className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-primary/35 via-transparent to-accent/35 blur-xl transition-opacity duration-500"
              style={{ opacity: isHovering ? 0.7 : 0.25 }}
            />

            <div className="relative glass-card rounded-2xl p-8 border border-border/60" style={{
              transformStyle: "preserve-3d",
              background: "linear-gradient(145deg, hsl(230 10% 15% / 0.92), hsl(235 9% 10% / 0.98))",
              boxShadow: isHovering
                ? "0 30px 70px -18px rgba(56,189,248,0.3), 0 10px 24px -8px rgba(0,0,0,0.48), inset 0 1px 0 rgba(255,255,255,0.08)"
                : "0 14px 40px -12px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.05)",
            }}>
              <div
                className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
                style={{
                  background: `radial-gradient(circle at ${mousePos.x}% ${mousePos.y}%, hsl(var(--primary) / 0.10) 0%, transparent 50%)`,
                }}
              />
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(12)].map((_, idx) => (
                  <span
                    key={idx}
                    className="particle"
                    style={{
                      left: `${Math.random() * 90 + 5}%`,
                      top: `${Math.random() * 80 + 5}%`,
                      animationDelay: `${Math.random() * 1.8}s`,
                      animationDuration: `${Math.random() * 2 + 3}s`,
                      width: `${(Math.random() * 3) + 2}px`,
                      height: `${(Math.random() * 3) + 2}px`,
                    }}
                  />
                ))}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5 relative" style={{ transform: "translateZ(30px)" }}>
                {isSignUp && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Nome</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome completo"
                      className="w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all backdrop-blur-sm" />
                    {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com"
                    className="w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all backdrop-blur-sm" />
                  {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-1.5 block">Senha</label>
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                      className="w-full px-4 py-3 bg-muted/40 border border-border/40 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all pr-10 backdrop-blur-sm" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
                </div>

                {!isSignUp && (
                  <div className="text-right">
                    <button type="button" className="text-xs text-primary hover:underline">Esqueceu a senha?</button>
                  </div>
                )}

                {errors.general && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                    <p className="text-sm text-destructive">{errors.general}</p>
                  </div>
                )}

                <button type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm transition-all active:scale-[0.97] relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--accent)))",
                    boxShadow: "0 8px 24px -6px hsl(var(--primary) / 0.4)",
                  }}>
                  <span className="relative z-10 text-primary-foreground flex items-center gap-2">
                    {loading ? "Carregando..." : (isSignUp ? "Criar Conta" : "Entrar")}
                    {!loading && <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </form>

              <div className="mt-5 pt-5 border-t border-border/30 text-center relative" style={{ transform: "translateZ(15px)" }}>
                <button onClick={() => { setIsSignUp(!isSignUp); setErrors({}); }}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  {isSignUp ? "Já tem uma conta? " : "Não tem conta? "}
                  <span className="font-semibold text-primary">{isSignUp ? "Entrar" : "Criar agora"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground/50 mt-6">
          Suas finanças seguras e organizadas 🔒
        </p>
      </div>
    </div>
  );
}
