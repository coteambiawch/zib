import { useState } from 'react';
import { motion } from 'framer-motion';

const LoginPage = ({ onLogin, loading }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setAuthLoading(true);

    try {
      await onLogin(email, password, isSignUp, name);
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setAuthLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      boxSizing: 'border-box',
    }}>
      {/* Background decorative elements */}
      <div style={{
        position: 'absolute',
        top: '-50%',
        left: '-50%',
        width: '200%',
        height: '200%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        animation: 'float 20s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      
      {/* Floating orbs */}
      <div style={{
        position: 'absolute',
        top: '15%',
        left: '15%',
        width: '100px',
        height: '100px',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 15s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '20%',
        width: '60px',
        height: '60px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 18s ease-in-out infinite',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '2.5rem',
          borderRadius: 24,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '2rem',
        }}>
          <div style={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem',
            fontSize: 28,
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
          }}>
            💬
          </div>
          <h1 style={{
            fontWeight: 800,
            fontSize: 28,
            margin: '0 0 0.5rem 0',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1px',
          }}>
            Dialog Saver
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: 16,
            margin: 0,
            fontWeight: 500,
          }}>
            {isSignUp ? 'Create your account to start saving dialogs' : 'Welcome back! Sign in to your account'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              border: '1px solid #fecaca',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: '1.5rem',
              color: '#dc2626',
              fontSize: 14,
              fontWeight: 500,
            }}
          >
            {error}
          </motion.div>
        )}

        {/* Success message for signup */}
        {isSignUp && (
          <div style={{
            background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)',
            border: '1px solid #bbf7d0',
            borderRadius: 12,
            padding: '12px 16px',
            marginBottom: '1.5rem',
            color: '#16a34a',
            fontSize: 14,
            fontWeight: 500,
            textAlign: 'center',
          }}>
            🎉 Account will be created instantly - no email verification needed!
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ marginBottom: '1.5rem' }}>
          {/* Name field - only show during signup */}
          {isSignUp && (
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 600,
                color: '#374151',
                marginBottom: '0.5rem',
              }}>
                Full Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={isSignUp}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '2px solid #e2e8f0',
                  fontSize: 16,
                  background: '#f8fafc',
                  color: '#1e293b',
                  outline: 'none',
                  boxShadow: '0 4px 16px rgba(31, 38, 135, 0.06)',
                  transition: 'all 0.3s ease',
                  fontFamily: 'inherit',
                }}
                onFocus={(e) => {
                  e.target.style.border = '2px solid #6366f1';
                  e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.15)';
                  e.target.style.background = '#ffffff';
                }}
                onBlur={(e) => {
                  e.target.style.border = '2px solid #e2e8f0';
                  e.target.style.boxShadow = '0 4px 16px rgba(31, 38, 135, 0.06)';
                  e.target.style.background = '#f8fafc';
                }}
                placeholder="Enter your full name"
              />
            </div>
          )}

          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 16,
                background: '#f8fafc',
                color: '#1e293b',
                outline: 'none',
                boxShadow: '0 4px 16px rgba(31, 38, 135, 0.06)',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid #6366f1';
                e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.15)';
                e.target.style.background = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid #e2e8f0';
                e.target.style.boxShadow = '0 4px 16px rgba(31, 38, 135, 0.06)';
                e.target.style.background = '#f8fafc';
              }}
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: 14,
              fontWeight: 600,
              color: '#374151',
              marginBottom: '0.5rem',
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                padding: '12px 16px',
                borderRadius: 12,
                border: '2px solid #e2e8f0',
                fontSize: 16,
                background: '#f8fafc',
                color: '#1e293b',
                outline: 'none',
                boxShadow: '0 4px 16px rgba(31, 38, 135, 0.06)',
                transition: 'all 0.3s ease',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.target.style.border = '2px solid #6366f1';
                e.target.style.boxShadow = '0 8px 24px rgba(99, 102, 241, 0.15)';
                e.target.style.background = '#ffffff';
              }}
              onBlur={(e) => {
                e.target.style.border = '2px solid #e2e8f0';
                e.target.style.boxShadow = '0 4px 16px rgba(31, 38, 135, 0.06)';
                e.target.style.background = '#f8fafc';
              }}
              placeholder="Enter your password"
            />
            {isSignUp && (
              <p style={{
                fontSize: 12,
                color: '#6b7280',
                margin: '0.5rem 0 0 0',
              }}>
                Password must be at least 6 characters long
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={authLoading || loading}
            style={{
              width: '100%',
              padding: '14px 0',
              borderRadius: 12,
              border: 'none',
              background: authLoading || loading 
                ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
                : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 16,
              boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
              cursor: authLoading || loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              letterSpacing: '0.5px',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
            onMouseEnter={(e) => {
              if (!authLoading && !loading) {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
              }
            }}
            onMouseLeave={(e) => {
              if (!authLoading && !loading) {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.2)';
              }
            }}
          >
            {authLoading || loading ? (
              <>
                <div style={{
                  width: 16,
                  height: 16,
                  border: '2px solid #ffffff',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                {isSignUp ? 'Creating Account...' : 'Signing In...'}
              </>
            ) : (
              <>
                ✨ {isSignUp ? 'Create Account' : 'Sign In'}
              </>
            )}
          </button>
        </form>

        {/* Toggle Sign Up / Sign In */}
        <div style={{
          textAlign: 'center',
          paddingTop: '1rem',
          borderTop: '1px solid #e5e7eb',
        }}>
          <p style={{
            color: '#6b7280',
            fontSize: 14,
            margin: '0 0 0.75rem 0',
          }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
          </p>
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError('');
              setName(''); // Clear name when switching modes
            }}
            style={{
              background: 'none',
              border: 'none',
              color: '#6366f1',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: 0,
              marginBottom: '1rem',
            }}
          >
            {isSignUp ? 'Sign in instead' : 'Create new account'}
          </button>
          
          {/* Anonymous Entry Option */}
          <div style={{
            paddingTop: '1rem',
            borderTop: '1px solid #e5e7eb',
          }}>
            <p style={{
              color: '#6b7280',
              fontSize: 14,
              margin: '0 0 0.75rem 0',
            }}>
              Don't want to create an account?
            </p>
            <button
              type="button"
              onClick={() => onLogin('anonymous', 'anonymous', false, 'Anonymous')}
              disabled={authLoading || loading}
              style={{
                background: 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)',
                border: 'none',
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
                cursor: authLoading || loading ? 'not-allowed' : 'pointer',
                padding: '8px 16px',
                borderRadius: 8,
                transition: 'all 0.3s ease',
                opacity: authLoading || loading ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (!authLoading && !loading) {
                  e.target.style.transform = 'translateY(-1px)';
                  e.target.style.boxShadow = '0 4px 12px rgba(107, 114, 128, 0.3)';
                }
              }}
              onMouseLeave={(e) => {
                if (!authLoading && !loading) {
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = 'none';
                }
              }}
            >
              🕶️ Enter Anonymously
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
