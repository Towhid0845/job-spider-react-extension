import React, { useState, useRef } from 'react';
import { Lock } from 'lucide-react';

const AuthView = ({ authForm, setAuthForm, onAuth, onGetStarted, showNotification }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [resetEmail, setResetEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef([]);

  const handleLogin = () => {
    if (!loginData.email || !loginData.password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    setAuthForm('verify');
    showNotification('Verification code sent', 'info');
  };

  const handleForgotPassword = () => {
    if (!resetEmail) {
      showNotification('Please enter your email address', 'error');
      return;
    }
    showNotification('Password reset link sent to your email', 'success');
    setAuthForm('login');
  };

  const handleVerify = () => {
    const code = otpValues.join('');
    if (code.length !== 6) {
      showNotification('Please enter the full 6-digit code', 'error');
      return;
    }
    onAuth(true);
    setAuthForm('success');
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otpValues];
    newOtp[index] = value;
    setOtpValues(newOtp);
    
    if (value && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
    const newOtp = [...otpValues];
    
    for (let i = 0; i < Math.min(pastedData.length, 6); i++) {
      newOtp[i] = pastedData[i];
    }
    
    setOtpValues(newOtp);
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-6">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-2 text-gray-800 flex items-center justify-center gap-2">
          <Lock size={24} /> Authentication Required
        </h2>
        <p className="text-center text-gray-600 mb-6">Please authenticate to use the extension</p>

        {authForm === 'login' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={loginData.email}
                onChange={(e) => setLoginData({...loginData, email: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter your password"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-full font-medium hover:shadow-lg transition-all"
            >
              Sign In
            </button>
            <div className="text-center">
              <button onClick={() => setAuthForm('forgot')} className="text-blue-500 text-sm hover:underline">
                Forgot Password?
              </button>
            </div>
          </div>
        )}

        {authForm === 'forgot' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                value={resetEmail}
                onChange={(e) => setResetEmail(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleForgotPassword()}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter your email"
              />
            </div>
            <button 
              onClick={handleForgotPassword}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-full font-medium hover:shadow-lg transition-all"
            >
              Send Reset Link
            </button>
            <div className="text-center">
              <button onClick={() => setAuthForm('login')} className="text-blue-500 text-sm hover:underline">
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {authForm === 'verify' && (
          <div className="space-y-4">
            <p className="text-center text-gray-600 mb-4">Enter the 6-digit code sent to your email</p>
            <div className="flex gap-2 justify-center" onPaste={handleOtpPaste}>
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={(el) => (otpInputRefs.current[index] = el)}
                  type="text"
                  maxLength="1"
                  value={value}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !value && index > 0) {
                      otpInputRefs.current[index - 1]?.focus();
                    }
                  }}
                  className="w-12 h-12 text-center text-lg border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                />
              ))}
            </div>
            <button
              onClick={handleVerify}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-full font-medium hover:shadow-lg transition-all"
            >
              Verify Code
            </button>
            <div className="text-center text-sm">
              <button onClick={() => showNotification('Code resent', 'info')} className="text-blue-500 hover:underline">
                Resend Code
              </button>
              <span className="mx-2">•</span>
              <button onClick={() => setAuthForm('login')} className="text-blue-500 hover:underline">
                Back to Sign In
              </button>
            </div>
          </div>
        )}

        {authForm === 'success' && (
          <div className="text-center py-8">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold mb-2">Authentication Successful</h2>
            <p className="text-gray-600 mb-6">You can now use jobdesk Spider features</p>
            <button
              onClick={onGetStarted}
              className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-2 rounded-full font-medium hover:shadow-lg transition-all"
            >
              Get Started
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthView;