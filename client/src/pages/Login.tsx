import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckSquare, Mail, Lock, AlertCircle, Eye, EyeOff, RefreshCw, X } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, loginWithGoogle, loginWithApple, forgotPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Reset Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetSubmitting, setResetSubmitting] = useState(false);

  const sessionExpired = searchParams.get('expired') === 'true';

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  // Captcha Generator & Drawer
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(code);
    setCaptchaInput('');
    setTimeout(() => drawCaptcha(code), 50);
  };

  const drawCaptcha = (code: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#111827';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.stroke();
    }

    ctx.textBaseline = 'middle';
    ctx.font = 'bold 22px "Plus Jakarta Sans", sans-serif';
    const space = canvas.width / (code.length + 1);

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      ctx.fillStyle = `hsl(${Math.random() * 360}, 80%, 70%)`;
      
      ctx.save();
      const x = space * (i + 1) + (Math.random() * 4 - 2);
      const y = canvas.height / 2 + (Math.random() * 6 - 3);
      ctx.translate(x, y);
      const angle = (Math.random() * 30 - 15) * Math.PI / 180;
      ctx.rotate(angle);
      ctx.fillText(char, -8, 0);
      ctx.restore();
    }
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const onSubmit = async (data: LoginSchema) => {
    if (captchaInput.trim().toUpperCase() !== captchaCode) {
      setApiError('Incorrect Captcha code. Please try again.');
      generateCaptcha();
      return;
    }

    setSubmitting(true);
    setApiError(null);
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setApiError(err.message || 'Invalid credentials. Please try again.');
      generateCaptcha();
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setResetError('Email address is required.');
      return;
    }
    setResetSubmitting(true);
    setResetError(null);
    try {
      await forgotPassword(resetEmail.trim());
      setResetSent(true);
    } catch (err: any) {
      console.error(err);
      setResetError(err.message || 'Failed to send password reset email. Make sure the email is registered.');
    } finally {
      setResetSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    setApiError(null);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || err.message || 'Google sign-in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAppleLogin = () => {
    setApiError('Sign in with Apple is currently in sandbox mode (requires an Apple Developer Program membership). Please use Google Account or Email instead!');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute top-[-20%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-20%] w-[50vw] h-[50vw] rounded-full bg-accent/5 blur-[120px] pointer-events-none animate-pulse-slow"></div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        {/* Brand */}
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
            <CheckSquare className="w-9 h-9 text-primary" />
          </div>
          <h2 className="font-extrabold text-3xl tracking-tight bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Welcome to TaskSync
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Sign in to access your projects, tasks, and streaks.
          </p>
        </div>

        {/* Card */}
        <div className="glass border border-border/80 rounded-3xl p-8 shadow-2xl relative z-10">
          {sessionExpired && (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Your session has expired. Please log in again to continue.</span>
            </div>
          )}

          {apiError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 px-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="name@example.com"
                  className={`
                    w-full pl-12 pr-4 py-3.5 rounded-2xl bg-secondary/30 border text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300
                    ${errors.email ? 'border-destructive' : 'border-border/60'}
                  `}
                  {...registerField('email')}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-destructive flex items-center gap-1.5 px-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.email.message}</span>
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-sm font-semibold text-foreground/80">Password</label>
                <button
                  type="button"
                  onClick={() => {
                    setResetEmail('');
                    setResetSent(false);
                    setResetError(null);
                    setShowResetModal(true);
                  }}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className={`
                    w-full pl-12 pr-12 py-3.5 rounded-2xl bg-secondary/30 border text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300
                    ${errors.password ? 'border-destructive' : 'border-border/60'}
                  `}
                  {...registerField('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1.5 px-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Captcha Field */}
            <div className="space-y-2 border-t border-border/40 pt-4 mt-4">
              <label className="text-sm font-semibold text-foreground/80 px-1">Security Verification</label>
              <div className="flex items-center gap-3 bg-secondary/20 border border-border/60 rounded-2xl p-3">
                <canvas
                  ref={canvasRef}
                  width="130"
                  height="46"
                  className="rounded-xl border border-border bg-slate-950 pointer-events-none select-none"
                  title="Captcha Image"
                />
                <button
                  type="button"
                  onClick={generateCaptcha}
                  className="p-2.5 rounded-xl hover:bg-secondary/60 text-muted-foreground hover:text-foreground transition-colors"
                  title="Refresh Captcha"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
                <input
                  type="text"
                  placeholder="Enter code"
                  required
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-secondary/30 border border-border text-sm font-bold uppercase tracking-wider text-center focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submitting}
              className={`
                w-full py-4 bg-primary text-primary-foreground font-bold rounded-2xl
                shadow-lg shadow-primary/25 hover:shadow-primary/35 hover:scale-[1.01] active:scale-[0.99]
                transition-all duration-300 flex justify-center items-center gap-3 mt-6
                disabled:opacity-75 disabled:pointer-events-none
              `}
            >
              {submitting ? (
                <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          {/* Separator */}
          <div className="relative my-6 flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-border/80"></div>
            </div>
            <span className="relative px-3 text-xs uppercase text-muted-foreground bg-background font-bold tracking-wider">
              or continue with
            </span>
          </div>

          {/* OAuth Providers Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Google Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={submitting}
              className="py-3 bg-card hover:bg-secondary/40 border border-border/80 hover:border-primary/20 text-foreground font-semibold rounded-2xl transition-all duration-300 flex justify-center items-center gap-2.5 disabled:opacity-75 disabled:pointer-events-none shadow-sm text-sm"
            >
              <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Google</span>
            </button>

            {/* Apple Button */}
            <button
              type="button"
              onClick={handleAppleLogin}
              disabled={submitting}
              className="py-3 bg-card hover:bg-secondary/40 border border-border/80 hover:border-primary/20 text-foreground font-semibold rounded-2xl transition-all duration-300 flex justify-center items-center gap-2.5 disabled:opacity-75 disabled:pointer-events-none shadow-sm text-sm"
            >
              <svg className="w-5 h-5 flex-shrink-0 fill-current" viewBox="0 0 24 24">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.83-.98 2.94.1.08.2.12.31.12.9 0 2.05-.59 2.5-1.45z"/>
              </svg>
              <span>Apple</span>
            </button>
          </div>

          <p className="text-sm text-center text-muted-foreground mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>

      {/* Forgot Password Modal Overlay */}
      <AnimatePresence>
        {showResetModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md bg-background rounded-3xl border border-border p-6 shadow-2xl space-y-4 relative"
            >
              {/* Header */}
              <div className="flex justify-between items-center border-b border-border/60 pb-3">
                <h3 className="text-lg font-bold text-foreground">Reset Password</h3>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="p-1.5 hover:bg-secondary rounded-xl text-muted-foreground transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Reset Form */}
              {resetSent ? (
                <div className="text-center py-4 space-y-3">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full w-12 h-12 flex items-center justify-center mx-auto">
                    <CheckSquare className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base text-foreground">Check Your Email</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                    A password reset link has been sent to **{resetEmail}**. Please check your inbox and spam folder to finish resetting your password.
                  </p>
                  <button
                    onClick={() => setShowResetModal(false)}
                    className="px-6 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-lg hover:shadow-primary/20 transition-all w-full mt-2"
                  >
                    Back to Login
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4">
                  <p className="text-xs text-muted-foreground">
                    Enter your registered email address below, and we will request a secure password reset link from Firebase.
                  </p>

                  {resetError && (
                    <div className="p-3 bg-destructive/10 border border-destructive/20 text-destructive rounded-xl flex items-start gap-2.5 text-xs">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{resetError}</span>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground/80 px-1">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-muted-foreground" />
                      <input
                        type="email"
                        required
                        placeholder="name@example.com"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-secondary/30 border border-border text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={resetSubmitting}
                    className="w-full py-3 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-lg hover:shadow-primary/25 transition-all flex justify-center items-center gap-2"
                  >
                    {resetSubmitting ? (
                      <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      'Send Reset Link'
                    )}
                  </button>
                </form>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
