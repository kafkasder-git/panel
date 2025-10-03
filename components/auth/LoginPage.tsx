/**
 * @fileoverview LoginPage Module - Application module
 * 
 * @author Dernek Yönetim Sistemi Team
 * @version 1.0.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Eye, EyeOff, Lock, Mail, Shield, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { useSupabaseAuth } from '../../hooks/useSupabaseAuth';

interface LoginPageProps {
  onLoginSuccess?: () => void;
}

/**
 * LoginPage function
 * 
 * @param {Object} params - Function parameters
 * @returns {void} Nothing
 */
export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  const { signIn, isLoading, error, clearError } = useSupabaseAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Clear errors when user starts typing
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => {
        clearTimeout(timer);
      };
    }
  }, [error, clearError]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!credentials.email) {
      errors.email = 'Kullanıcı adı gerekli';
    }

    if (!credentials.password) {
      errors.password = 'Şifre gerekli';
    } else if (credentials.password.length < 6) {
      errors.password = 'Şifre en az 6 karakter olmalı';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await signIn(credentials.email, credentials.password);
      onLoginSuccess?.();
    } catch {
      // Error is handled in SupabaseAuthContext
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setCredentials((prev) => ({ ...prev, [field]: value }));

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-40 h-40 bg-blue-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-1/3 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border-slate-200/60 shadow-xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 text-center pb-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto bg-gradient-to-br from-primary via-blue-600 to-blue-800 rounded-2xl flex items-center justify-center shadow-lg"
            >
              <Shield className="w-8 h-8 text-white" />
            </motion.div>

            <div className="space-y-2">
              <CardTitle className="text-2xl font-bold text-slate-900 tracking-tight">
                Dernek Yönetim Sistemi
              </CardTitle>
              <CardDescription className="text-slate-600 font-medium">
                Hesabınızla giriş yapın
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Alert variant="destructive" className="border-red-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold">
                  Kullanıcı Adı
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="email"
                    type="text"
                    placeholder="admin, manager, operator, viewer"
                    value={credentials.email}
                    onChange={(e) => {
                      handleInputChange('email', e.target.value);
                    }}
                    className={`pl-10 h-12 bg-white border-slate-300 focus:border-primary focus:ring-primary/20 ${
                      formErrors.email ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                    disabled={isLoading}
                  />
                </div>
                {formErrors.email && (
                  <p className="text-sm text-red-600 font-medium">{formErrors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold">
                  Şifre
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={credentials.password}
                    onChange={(e) => {
                      handleInputChange('password', e.target.value);
                    }}
                    className={`pl-10 pr-10 h-12 bg-white border-slate-300 focus:border-primary focus:ring-primary/20 ${
                      formErrors.password ? 'border-red-300 focus:border-red-400' : ''
                    }`}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowPassword(!showPassword);
                    }}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && (
                  <p className="text-sm text-red-600 font-medium">{formErrors.password}</p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={credentials.rememberMe}
                  onCheckedChange={(checked: boolean) => {
                    handleInputChange('rememberMe', checked);
                  }}
                  disabled={isLoading}
                />
                <Label
                  htmlFor="rememberMe"
                  className="text-sm text-slate-600 font-medium cursor-pointer"
                >
                  Beni hatırla
                </Label>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-gradient-to-r from-primary to-blue-700 hover:from-primary/90 hover:to-blue-700/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Giriş yapılıyor...
                  </div>
                ) : (
                  'Giriş Yap'
                )}
              </Button>
            </form>

            <div className="pt-4 text-center">
              <p className="text-xs text-slate-500">
                Şifrenizi mi unuttunuz?{' '}
                <button className="text-primary hover:underline font-medium">
                  Sıfırlama talebi
                </button>
              </p>
            </div>
          </CardContent>
        </Card>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-slate-500">
            © 2024 Dernek Yönetim Sistemi. Tüm hakları saklıdır.
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
