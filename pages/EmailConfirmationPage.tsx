import React, { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { CheckCircle, Smartphone, LayoutDashboard } from 'lucide-react';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

interface EmailConfirmationPageProps {
  onContinue: () => void;
}

export const EmailConfirmationPage: React.FC<EmailConfirmationPageProps> = ({ onContinue }) => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // When this page loads, it means the user clicked the link and Supabase 
    // has already processed the hash in the URL to restore the session.
    // We just need to make sure their settings exist.
    const init = async () => {
        try {
            // Ensure settings exist for this new user
            await api.ensureSettingsCreated();
            setIsReady(true);
        } catch (e) {
            console.error("Setup failed", e);
            setIsReady(true); // Let them continue anyway, App.tsx will retry
        }
    };
    init();
  }, []);

  return (
    <div className="min-h-screen bg-green-50 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center space-y-6">
        <div className="mx-auto w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
            <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900">Email Verified Successfully!</h1>
        <p className="text-gray-600">
            Your account has been activated. You are now logged in.
        </p>

        <div className="h-px bg-gray-100 w-full my-4"></div>

        <div className="space-y-3">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">On Mobile?</p>
                <p className="text-xs text-blue-600 mb-3">
                    Click below to return to the app. If it doesn't open automatically, just close this browser and open the ShaikhMech app on your phone.
                </p>
                <Button 
                    onClick={() => {
                        // Attempt to close window (works for some mobile popups)
                        window.close();
                        // Fallback
                        window.location.href = "shaikhmech://"; 
                    }} 
                    className="w-full bg-blue-600 hover:bg-blue-700"
                >
                    <Smartphone className="w-4 h-4 mr-2" /> Return to App
                </Button>
            </div>

            <Button 
                onClick={() => {
                    // Clear hash to clean up URL
                    window.location.hash = '';
                    onContinue();
                }} 
                variant="secondary"
                className="w-full" 
                size="lg"
            >
                <LayoutDashboard className="w-4 h-4 mr-2" /> Continue to Web Dashboard
            </Button>
        </div>
      </div>
    </div>
  );
};