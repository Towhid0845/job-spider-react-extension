import { useState, useRef } from 'react';
import { Lock, Loader2 } from 'lucide-react';

const AuthView = ({ authForm, setAuthForm, onAuth, onGetStarted, showNotification }) => {
  const [loginData, setLoginData] = useState({ email: '', password: '', sas_base_url: 'https://sas.jobdesk.com/api' });
  const [resetEmail, setResetEmail] = useState('');
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [isExternal, setIsExternal] = useState(false)
  const otpInputRefs = useRef([]);

  const handleLogin = () => {
    if (!loginData.email || !loginData.password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }
    // setAuthForm('verify');
    // showNotification('Verification code sent', 'info');

    setIsLoading(true);

    chrome.runtime.sendMessage({
      action: "authorize_token",
      sas_base_url: loginData.sas_base_url,
      email: loginData.email,
      password: loginData.password,
      f2aKey: null
    }, (response) => {
      setIsLoading(false);

      if (!response) {
        showNotification('Authentication service unavailable', 'error');
        return;
      }

      // Handle 2FA requirement
      if (response.requires2FA || response.event === '2fa_required') {
        setAuthForm('verify');
        showNotification('2FA code required', 'info');
        return;
      }

      // Handle successful login
      if (response.authorized && response.event === 'authorization_complete') {
        onAuth(true, response.data);
        setAuthForm('success');
        showNotification('Login successful', 'success');

        // Store external flag if needed
        if (response.data.isExternal) {
          setIsExternal(true);
        }
        return;
      }

      // Handle failed login
      if (response.event === 'authorization_incomplete') {
        showNotification(response.error || 'Login failed', 'error');
        return;
      }

      showNotification('Unexpected response from server', 'error');
    });
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
    const f2aKey = otpValues.join('');
    if (f2aKey.length !== 6) {
      showNotification('Please enter the full 6-digit code', 'error');
      return;
    }
    // onAuth(true);
    // setAuthForm('success');

    setIsLoading(true);

    chrome.runtime.sendMessage({
      action: "authorize_token",
      sas_base_url: loginData.sas_base_url,
      email: loginData.email,
      password: loginData.password,
      f2aKey: f2aKey
    }, (response) => {
      setIsLoading(false);

      if (!response) {
        showNotification('Authentication service unavailable', 'error');
        return;
      }

      // Handle successful 2FA verification
      if (response.authorized && response.event === 'authorization_complete') {
        onAuth(true, response.data);
        setAuthForm('success');
        showNotification('2FA verification successful', 'success');
        return;
      }

      // Handle failed 2FA
      if (response.event === 'authorization_incomplete') {
        showNotification(response.error || '2FA verification failed', 'error');
        setOtpValues(['', '', '', '', '', '']);
        otpInputRefs.current[0]?.focus();
        return;
      }

      showNotification('Unexpected response from server', 'error');
    });

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

  const handleResendCode = () => {
    showNotification('Resending 2FA code...', 'info');
    // Re-trigger login to get new 2FA code
    handleLogin();
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
                onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <input
                type="password"
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter your password"
              />
            </div>
            <button
              onClick={handleLogin}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-full font-medium hover:shadow-lg transition-all cursor-pointer"
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
                onKeyDown={(e) => e.key === 'Enter' && handleForgotPassword()}
                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none"
                placeholder="Enter your email"
              />
            </div>
            <button
              onClick={handleForgotPassword}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-full font-medium hover:shadow-lg transition-all cursor-pointer"
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
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 rounded-full font-medium hover:shadow-lg transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Verifying...
                </>
              ) : (
                'Verify Code'
              )}
            </button>
            <div className="text-center text-sm">
              <button onClick={handleResendCode} disabled={isLoading} className="text-blue-500 hover:underline">
                Resend Code
              </button>
              <span className="mx-2">•</span>
              <button onClick={() => setAuthForm('login')} disabled={isLoading} className="text-blue-500 hover:underline">
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
            {isExternal && (
              <p className="text-sm text-blue-600 mb-4">External login detected</p>
            )}
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