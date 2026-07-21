import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  User as UserIcon, 
  Lock, 
  Settings as PrefIcon, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Upload
} from 'lucide-react';

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  theme: z.enum(['light', 'dark', 'system']),
  timezone: z.string().min(1),
  language: z.string().min(1),
});

type ProfileSchema = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters'),
  confirmNewPassword: z.string().min(6, 'Confirm password is required'),
}).refine(data => data.newPassword === data.confirmNewPassword, {
  message: "Passwords don't match",
  path: ['confirmNewPassword']
});

type PasswordSchema = z.infer<typeof passwordSchema>;

export const Settings: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();

  // Status logs
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSubmitting, setProfileSubmitting] = useState(false);

  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [avatarBase64, setAvatarBase64] = useState<string>(user?.avatar || '');

  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      theme: user?.settings.theme || 'system',
      timezone: user?.settings.timezone || 'UTC',
      language: user?.settings.language || 'en',
    }
  });

  const {
    register: regPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm<PasswordSchema>({
    resolver: zodResolver(passwordSchema)
  });

  // Avatar conversion to Base64 for storing
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Profile Form
  const onProfileSave = async (data: ProfileSchema) => {
    setProfileSubmitting(true);
    setProfileSuccess(false);
    setProfileError(null);
    try {
      await updateProfile({
        name: data.name,
        email: data.email,
        avatar: avatarBase64,
        settings: {
          theme: data.theme,
          timezone: data.timezone,
          language: data.language,
        }
      });
      // Update local Theme state immediately if changed
      setTheme(data.theme);
      setProfileSuccess(true);
    } catch (err: any) {
      console.error(err);
      setProfileError(err.response?.data?.message || 'Failed updating profile details.');
    } finally {
      setProfileSubmitting(false);
    }
  };

  // Submit Password Form
  const onPasswordSave = async (data: PasswordSchema) => {
    setPasswordSubmitting(true);
    setPasswordSuccess(false);
    setPasswordError(null);
    try {
      await updateProfile({
        password: data.newPassword // backend registers this update inside put endpoint
      });
      setPasswordSuccess(true);
      resetPasswordForm();
    } catch (err: any) {
      console.error(err);
      setPasswordError('Failed updating password. Please ensure details are correct.');
    } finally {
      setPasswordSubmitting(false);
    }
  };

  // Delete User Account
  const onDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      console.error(err);
      alert('Failed to delete account. Please try again.');
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 max-w-4xl mx-auto pb-20">
      {/* Title */}
      <div>
        <h2 className="text-xl font-bold">User Settings & Preferences</h2>
        <p className="text-sm text-muted-foreground">Manage your identity, settings, security, and account status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Avatar Upload Left column */}
        <div className="glass border border-border/80 rounded-3xl p-6 flex flex-col items-center text-center space-y-4">
          <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground/80 self-start">Profile Picture</h3>
          
          <div className="relative w-32 h-32 rounded-full overflow-hidden border border-border/60 bg-secondary/50 flex items-center justify-center group shadow-inner">
            {avatarBase64 ? (
              <img src={avatarBase64} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <UserIcon className="w-12 h-12 text-primary" />
            )}
            <label className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity duration-200">
              <Upload className="w-6 h-6 text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
            </label>
          </div>

          <div className="space-y-1">
            <h4 className="font-bold">{user?.name}</h4>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          
          <p className="text-[10px] text-muted-foreground leading-normal">
            Click avatar to upload a custom picture. Recommended: square aspect ratio.
          </p>
        </div>

        {/* Right Columns: Main settings */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Profile details & Preferences */}
          <div className="glass border border-border/80 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <PrefIcon className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">Workspace & Preferences</h3>
            </div>

            {profileSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" /> Profile details saved successfully.
              </div>
            )}

            {profileError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" /> {profileError}
              </div>
            )}

            <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Full Name</label>
                  <input
                    type="text"
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs focus:outline-none focus:border-primary"
                    {...regProfile('name')}
                  />
                  {profileErrors.name && <p className="text-[10px] text-destructive">{profileErrors.name.message}</p>}
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Email Address</label>
                  <input
                    type="email"
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs focus:outline-none focus:border-primary"
                    {...regProfile('email')}
                  />
                  {profileErrors.email && <p className="text-[10px] text-destructive">{profileErrors.email.message}</p>}
                </div>

                {/* Theme */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">App Theme</label>
                  <select
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs focus:outline-none focus:border-primary"
                    {...regProfile('theme')}
                  >
                    <option value="light">Light Mode</option>
                    <option value="dark">Dark Mode</option>
                    <option value="system">System Theme</option>
                  </select>
                </div>

                {/* Timezone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Timezone</label>
                  <select
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs focus:outline-none focus:border-primary"
                    {...regProfile('timezone')}
                  >
                    <option value="UTC">UTC / GMT</option>
                    <option value="EST">EST (Eastern Standard Time)</option>
                    <option value="PST">PST (Pacific Standard Time)</option>
                    <option value="IST">IST (Indian Standard Time)</option>
                    <option value="CET">CET (Central European Time)</option>
                  </select>
                </div>

                {/* Language */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Language</label>
                  <select
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs focus:outline-none focus:border-primary"
                    {...regProfile('language')}
                  >
                    <option value="en">English</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                    <option value="zh">中文</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={profileSubmitting}
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-70"
                >
                  {profileSubmitting ? 'Saving...' : 'Save Settings'}
                </button>
              </div>
            </form>
          </div>

          {/* Security details (password) */}
          <div className="glass border border-border/80 rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-border/40 pb-3">
              <Lock className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-base">Security & Password</h3>
            </div>

            {passwordSuccess && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
                <CheckCircle className="w-4 h-4" /> Password changed successfully.
              </div>
            )}

            {passwordError && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive rounded-2xl flex items-center gap-2.5 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4" /> {passwordError}
              </div>
            )}

            <form onSubmit={handlePasswordSubmit(onPasswordSave)} className="space-y-4">
              <div className="space-y-4">
                {/* Current Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Current Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs focus:outline-none focus:border-primary"
                    {...regPassword('currentPassword')}
                  />
                  {passwordErrors.currentPassword && <p className="text-[10px] text-destructive">{passwordErrors.currentPassword.message}</p>}
                </div>

                {/* New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs focus:outline-none focus:border-primary"
                    {...regPassword('newPassword')}
                  />
                  {passwordErrors.newPassword && <p className="text-[10px] text-destructive">{passwordErrors.newPassword.message}</p>}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/80">Confirm New Password</label>
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full p-3 rounded-xl bg-secondary/30 border border-border/60 text-xs focus:outline-none focus:border-primary"
                    {...regPassword('confirmNewPassword')}
                  />
                  {passwordErrors.confirmNewPassword && <p className="text-[10px] text-destructive">{passwordErrors.confirmNewPassword.message}</p>}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={passwordSubmitting}
                  className="px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl text-xs shadow-lg hover:shadow-primary/20 transition-all disabled:opacity-70"
                >
                  {passwordSubmitting ? 'Updating...' : 'Change Password'}
                </button>
              </div>
            </form>
          </div>

          {/* Danger zone */}
          <div className="glass border border-destructive/20 bg-destructive/[0.01] rounded-3xl p-6 space-y-6">
            <div className="flex items-center gap-2 border-b border-destructive/10 pb-3">
              <Trash2 className="w-5 h-5 text-destructive" />
              <h3 className="font-bold text-base text-destructive">Danger Zone</h3>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                Deleting your account will permanently purge your profile, configurations, custom categories, and all todo logs from our servers. This action is irreversible.
              </p>

              {deleteConfirm ? (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-destructive font-bold">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                    <span>Are you absolutely sure you want to delete your account? All data will be lost forever.</span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => setDeleteConfirm(false)}
                      className="px-4 py-2 bg-secondary text-foreground hover:bg-secondary/70 rounded-lg text-xs font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={onDeleteAccount}
                      disabled={deleting}
                      className="px-4 py-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-lg text-xs font-bold shadow flex items-center gap-1.5"
                    >
                      {deleting ? 'Deleting...' : 'Yes, Delete Account'}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="px-5 py-2.5 bg-destructive text-destructive-foreground hover:bg-destructive/95 font-bold rounded-xl text-xs shadow transition-all"
                >
                  Delete My Account
                </button>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
