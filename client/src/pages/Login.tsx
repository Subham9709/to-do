import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckSquare, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginSchema = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const sessionExpired = searchParams.get('expired') === 'true';

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginSchema) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || 'Invalid credentials. Please try again.');
    } finally {
      setSubmitting(false);
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

          {/* Google Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="w-full py-3.5 bg-card hover:bg-secondary/40 border border-border/80 hover:border-primary/20 text-foreground font-semibold rounded-2xl transition-all duration-300 flex justify-center items-center gap-3 disabled:opacity-75 disabled:pointer-events-none shadow-sm"
          >
            {/* Google SVG */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
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
            <span>Google Account</span>
          </button>

          <p className="text-sm text-center text-muted-foreground mt-8">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-bold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
