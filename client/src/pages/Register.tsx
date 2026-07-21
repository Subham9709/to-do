import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckSquare, User, Mail, Lock, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be under 50 characters'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterSchema = z.infer<typeof registerSchema>;

export const Register: React.FC = () => {
  const { register: signUp, loginWithGoogle, loginWithApple } = useAuth();
  const navigate = useNavigate();
  const [apiError, setApiError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register: registerField,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterSchema) => {
    setSubmitting(true);
    setApiError(null);
    try {
      await signUp(data.name, data.email, data.password);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      setApiError(err.response?.data?.message || 'Failed to register. Email may already be in use.');
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
            Create Account
          </h2>
          <p className="text-sm text-muted-foreground text-center">
            Sign up to build habits, organize tasks, and hit your goals.
          </p>
        </div>

        {/* Card */}
        <div className="glass border border-border/80 rounded-3xl p-8 shadow-2xl relative z-10">
          {apiError && (
            <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-start gap-3 text-xs">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>{apiError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 px-1">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="John Doe"
                  className={`
                    w-full pl-12 pr-4 py-3.5 rounded-2xl bg-secondary/30 border text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300
                    ${errors.name ? 'border-destructive' : 'border-border/60'}
                  `}
                  {...registerField('name')}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-destructive flex items-center gap-1.5 px-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.name.message}</span>
                </p>
              )}
            </div>

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
              <label className="text-sm font-semibold text-foreground/80 px-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`
                    w-full pl-12 pr-4 py-3.5 rounded-2xl bg-secondary/30 border text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300
                    ${errors.password ? 'border-destructive' : 'border-border/60'}
                  `}
                  {...registerField('password')}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-destructive flex items-center gap-1.5 px-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.password.message}</span>
                </p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-foreground/80 px-1">Confirm Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`
                    w-full pl-12 pr-4 py-3.5 rounded-2xl bg-secondary/30 border text-sm
                    focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-300
                    ${errors.confirmPassword ? 'border-destructive' : 'border-border/60'}
                  `}
                  {...registerField('confirmPassword')}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-destructive flex items-center gap-1.5 px-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errors.confirmPassword.message}</span>
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
                'Create Account'
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
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline">
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
