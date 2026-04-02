import React, { useState } from 'react';
import { Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { useToast } from '../context/ToastContext';

export const AuthModal: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Successfully logged in!', 'success');
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created successfully!', 'success');
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') setError('Invalid email or password.');
      else if (err.code === 'auth/email-already-in-use') setError('Email already registered.');
      else if (err.code === 'auth/weak-password') setError('Password must be at least 6 characters.');
      else setError('Authentication failed. Check your connection or API keys.');
      showToast('Authentication error.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      showToast('Logged in with Google!', 'success');
    } catch (err: any) {
      setError('Google sign-in was cancelled or failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex justify-center items-center bg-gray-900 bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative">
        <div className="p-8 pb-6 bg-blue-600 text-white">
          <h2 className="text-2xl font-bold tracking-tight mb-1">DataInsight Pro</h2>
          <p className="text-blue-100 text-sm">Enterprise Data Analytics Workspace</p>
        </div>
        
        <div className="p-8 pt-6">
          <h3 className="text-xl font-semibold mb-4 text-gray-800">
            {isLogin ? 'Sign in to your account' : 'Create your free workspace'}
          </h3>

          {error && (
            <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-start gap-2 border border-red-100">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="you@company.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pl-10 w-full rounded-lg border border-gray-300 py-2.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium shadow-sm transition-colors ${
                loading ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                   <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"/>
                   Processing...
                </span>
              ) : isLogin ? (
                <><LogIn size={18} /> Sign In</>
              ) : (
                <><UserPlus size={18} /> Create Account</>
              )}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <button
              onClick={handleGoogleAuth}
              type="button"
              className="mt-4 w-full flex justify-center items-center py-2.5 px-4 border border-gray-300 rounded-lg shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
          </div>
          
          <div className="mt-8 text-center text-sm text-gray-600 border-t border-gray-100 pt-4">
             {isLogin ? "Don't have an account?" : "Already have an account?"}
             <button
               onClick={() => { setIsLogin(!isLogin); setError(''); }}
               className="ml-2 font-medium text-blue-600 hover:text-blue-500"
             >
               {isLogin ? "Sign up free" : "Log in"}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};
