import React, { useState, useEffect } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { AppSettings, User } from '../types';
import { Mail, AlertTriangle } from 'lucide-react';
import { isSupabaseConfigured } from '../services/supabase';

interface LoginSignupPageProps {
  onLoginSuccess: (user: User, settings: AppSettings) => void;
}

export const LoginSignupPage: React.FC<LoginSignupPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [error, setError] = useState('');

  // Clear timeout on unmount
  useEffect(() => {
    return () => setIsLoading(false);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in email and password');
      return;
    }

    if (!isLogin && !companyName) {
      setError('Company Name is required for signup');
      return;
    }

    setIsLoading(true);

    try {
        const companyDetails = !isLogin ? { address: companyAddress, gstNo } : undefined;
        const { user, settings } = await api.login(
            email, 
            password, 
            isLogin ? undefined : companyName,
            companyDetails
        );
        onLoginSuccess(user, settings);
    } catch (err: any) {
        console.error(err);
        
        const msg = err.message || 'An error occurred';
        if (msg === "REGISTRATION_SUCCESS_CONFIRM_EMAIL") {
            setShowVerification(true);
        } else if (msg.includes('Invalid login credentials')) {
            setError('Invalid email or password.');
        } else {
            setError(msg);
        }
    } finally {
        setIsLoading(false);
    }
  };

  // --- VIEW: CHECK INBOX INSTRUCTION ---
  if (showVerification) {
      return (
        <div className="min-h-screen bg-brand-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
                <div className="mx-auto w-20 h-20 bg-brand-100 rounded-full flex items-center justify-center mb-4">
                    <Mail className="w-10 h-10 text-brand-600" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Verify your Email</h1>
                <p className="text-gray-600">
                    We've sent a confirmation link to <span className="font-bold text-gray-800">{email}</span>.
                </p>
                <p className="text-sm text-gray-500">
                    Please check your inbox (and spam folder) and click the link to activate your account.
                </p>
                
                <div className="pt-6 space-y-3">
                    <Button 
                        onClick={() => window.location.href = "mailto:"}
                        className="w-full" 
                        size="lg"
                    >
                        Open Email App
                    </Button>
                    <Button 
                        variant="secondary"
                        onClick={() => {
                            setShowVerification(false);
                            setIsLogin(true);
                        }} 
                        className="w-full" 
                        size="lg"
                    >
                        Return to Login
                    </Button>
                </div>
            </div>
        </div>
      );
  }

  // --- VIEW: LOGIN / SIGNUP FORM ---
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-600">ShaikhMech</h1>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Login to your ERP' : 'Register New Company'}
          </p>
        </div>

        {!isSupabaseConfigured && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            Supabase keys missing. Please configure VITE_SUPABASE_URL in your environment variables.
                        </p>
                    </div>
                </div>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {!isLogin && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <h3 className="text-xs font-bold text-gray-500 uppercase">Company Details</h3>
                <Input
                    label="Company Name"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                />
                <Input
                    label="Address"
                    value={companyAddress}
                    onChange={(e) => setCompanyAddress(e.target.value)}
                    placeholder="Full Business Address"
                />
                <Input
                    label="GST / Tax No."
                    value={gstNo}
                    onChange={(e) => setGstNo(e.target.value)}
                    placeholder="Optional"
                />
            </div>
          )}

          <div>
             <Input
                label="Email Address"
                type="email"
                placeholder="admin@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
             />
          </div>

          <div>
            <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
          </div>

          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded border border-red-100 font-medium">{error}</div>}

          <Button type="submit" className="w-full" size="lg" disabled={isLoading}>
            {isLoading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
          </Button>
        </form>

        <div className="text-center text-sm text-gray-600">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
            className="text-brand-600 font-medium hover:text-brand-500"
          >
            {isLogin ? 'Need an account? Register Company' : 'Already have an account? Login'}
          </button>
        </div>
      </div>
    </div>
  );
};