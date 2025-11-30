import React, { useState } from 'react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { api } from '../services/api';
import { AppSettings, User } from '../types';

interface LoginSignupPageProps {
  onLoginSuccess: (user: User, settings: AppSettings) => void;
}

export const LoginSignupPage: React.FC<LoginSignupPageProps> = ({ onLoginSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [gstNo, setGstNo] = useState('');
  const [error, setError] = useState('');

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
        let msg = 'Authentication failed.';
        if (err.message.includes('auth/invalid-credential') || err.message.includes('auth/wrong-password')) {
            msg = 'Invalid email or password.';
        } else if (err.message.includes('auth/email-already-in-use')) {
            msg = 'Email is already registered.';
        } else if (err.message.includes('auth/weak-password')) {
            msg = 'Password should be at least 6 characters.';
        }
        setError(msg);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-brand-600">ShaikhMech</h1>
          <p className="text-gray-500 mt-2">
            {isLogin ? 'Login to your ERP' : 'Register New Company'}
          </p>
        </div>

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

          {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}

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
