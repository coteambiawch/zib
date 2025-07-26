import { useState, useEffect, useRef, useRef as useReactRef } from 'react';
// Helper to show browser notification
function showBrowserNotification(title, options) {
  if (window.Notification && Notification.permission === 'granted') {
    new Notification(title, options);
  }
}
import { createClient } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';
import LoginPage from './LoginPage';
import './App.css';

const supabaseUrl = 'https://frskdsglexjeehahmiow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyc2tkc2dsZXhqZWVoYWhtaW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODk4NzcsImV4cCI6MjA2ODk2NTg3N30.3ObYpFwg7WfYUy5KCzJfrLlAxJGTvoSlqnSeCAEOSnQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET = 'dialog-photos'; // You must create this bucket in Supabase Storage

// Simple hash function for passwords (compatible with all environments)
const hashPassword = (password) => {
  const salt = 'salt_key_2024';
  const saltedPassword = password + salt;
  
  // Simple hash using built-in string methods (not cryptographically secure, but works for demo)
  let hash = 0;
  for (let i = 0; i < saltedPassword.length; i++) {
    const char = saltedPassword.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  // Convert to positive hex string
  return Math.abs(hash).toString(16).padStart(8, '0');
};

function App() {
  // Notification permission state
  const [notifStatus, setNotifStatus] = useState(() => {
    if (typeof window !== 'undefined' && window.Notification) {
      return Notification.permission;
    }
    return 'unsupported';
  });
  // Notification bar visibility
  const [showNotifBar, setShowNotifBar] = useState(false);

  // Ask for notification permission as soon as the app loads, or if denied, show info
  useEffect(() => {
    if (window.Notification) {
      setNotifStatus(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then((perm) => {
          setNotifStatus(perm);
        });
      }
    }
  }, []);

  // Show/hide notification bar for 2 seconds when notifStatus is denied or unsupported
  useEffect(() => {
    if (notifStatus === 'denied' || notifStatus === 'unsupported') {
      setShowNotifBar(true);
      const timer = setTimeout(() => setShowNotifBar(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [notifStatus]);
  const [darkMode, setDarkMode] = useState(() => {
    // Try to load from localStorage, else default to false
    const saved = localStorage.getItem('dialog_dark_mode');
    return saved === 'true';
  });
  // Update localStorage and document body class on darkMode change
  useEffect(() => {
    localStorage.setItem('dialog_dark_mode', darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  }, [darkMode]);
  // Track previous dialogs for notification diff
  const prevDialogsRef = useReactRef([]);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [text, setText] = useState("");
  const [dialogs, setDialogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef();

  // Check for existing session on mount
  useEffect(() => {
    const checkSession = () => {
      const userData = localStorage.getItem('dialog_user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
        } catch (e) {
          localStorage.removeItem('dialog_user');
        }
      }
      setAuthLoading(false);
    };
    checkSession();
  }, []);

  // Handle login/signup with custom authentication
  const handleAuth = async (email, password, isSignUp, name = '') => {
    // Handle anonymous login
    if (email === 'anonymous' && password === 'anonymous') {
      const anonymousUser = {
        id: 'anonymous-user', // Fixed ID for all anonymous sessions
        email: 'anonymous@local.app',
        name: 'Anonymous',
        isAnonymous: true
      };
      setUser(anonymousUser);
      localStorage.setItem('dialog_user', JSON.stringify(anonymousUser));
      return;
    }

    const hashedPassword = hashPassword(password);

    if (isSignUp) {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('custom_users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        throw new Error('User already exists with this email');
      }

      // Create new user
      const { data, error } = await supabase
        .from('custom_users')
        .insert([{
          email,
          password_hash: hashedPassword,
          name: name || 'Anonymous User'
        }])
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // Auto-login after signup
      const userData = { id: data.id, email: data.email, name: data.name };
      setUser(userData);
      localStorage.setItem('dialog_user', JSON.stringify(userData));
      
    } else {
      // Login existing user
      const { data, error } = await supabase
        .from('custom_users')
        .select('id, email, name')
        .eq('email', email)
        .eq('password_hash', hashedPassword)
        .single();

      if (error || !data) {
        throw new Error('Invalid email or password');
      }

      const userData = { id: data.id, email: data.email, name: data.name };
      setUser(userData);
      localStorage.setItem('dialog_user', JSON.stringify(userData));
    }
  };

  // Handle logout
  const handleLogout = async () => {
    // Anonymous dialogs are now saved to database, no need to clear localStorage
    setUser(null);
    setDialogs([]);
    localStorage.removeItem('dialog_user');
  };

  // Fetch dialogs from Supabase on mount and subscribe to realtime changes
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    // Request notification permission on first load
    if (window.Notification && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Helper to show notification for new dialogs
    const maybeNotify = (newDialogs) => {
      // Only notify if not first load and there are new dialogs
      if (prevDialogsRef.current.length > 0 && newDialogs.length > 0) {
        // Find the new dialog(s) by id
        const prevIds = new Set(prevDialogsRef.current.map(d => d.id));
        const newOnes = newDialogs.filter(d => !prevIds.has(d.id));
        if (newOnes.length > 0) {
          const latest = newOnes[0];
          showBrowserNotification('New Dialog', {
            body: latest.text ? latest.text.slice(0, 80) : 'A new dialog was added!',
            icon: latest.image_url || undefined
          });
        }
      }
      prevDialogsRef.current = newDialogs;
    };

    // For anonymous users, load all dialogs from database but don't save their own dialogs there
    if (user.isAnonymous) {
      localStorage.removeItem('permanent_anonymous_dialogs');
      localStorage.removeItem('anonymous_dialogs');
      const fetchDialogs = async () => {
        try {
          const { data, error } = await supabase
            .from('demo-dialogs')
            .select(`id, text, image_url, created_at, user_id`)
            .order('created_at', { ascending: false });
          if (error) {
            setDialogs([]);
          } else {
            const dialogsWithUserName = await Promise.all(data?.map(async (dialog) => {
              if (dialog.user_id === 'anonymous-user') {
                return { ...dialog, user_name: 'Anonymous' };
              } else {
                const { data: userData } = await supabase
                  .from('custom_users')
                  .select('name')
                  .eq('id', dialog.user_id)
                  .single();
                return { ...dialog, user_name: userData?.name || 'Unknown User' };
              }
            }) || []);
            setDialogs(dialogsWithUserName);
            maybeNotify(dialogsWithUserName);
          }
        } catch (err) {
          setDialogs([]);
        }
        setLoading(false);
      };
      fetchDialogs();
      const channel = supabase
        .channel('realtime-demo-dialogs-anonymous')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'demo-dialogs' }, payload => {
          fetchDialogs();
        })
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }

    const fetchDialogs = async () => {
      try {
        const { data, error } = await supabase
          .from('demo-dialogs')
          .select(`id, text, image_url, created_at, user_id`)
          .order('created_at', { ascending: false });
        if (error) {
          setDialogs([]);
        } else {
          const dialogsWithUserName = await Promise.all(data?.map(async (dialog) => {
            if (dialog.user_id === 'anonymous-user') {
              return { ...dialog, user_name: 'Anonymous' };
            } else {
              const { data: userData } = await supabase
                .from('custom_users')
                .select('name')
                .eq('id', dialog.user_id)
                .single();
              return { ...dialog, user_name: userData?.name || 'Unknown User' };
            }
          }) || []);
          setDialogs(dialogsWithUserName);
          maybeNotify(dialogsWithUserName);
        }
      } catch (err) {
        setDialogs([]);
      }
      setLoading(false);
    };
    fetchDialogs();
    const channel = supabase
      .channel('realtime-demo-dialogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demo-dialogs' }, payload => {
        fetchDialogs();
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleAdd = async () => {
    if (text.trim() === "" && !imageFile) return;
    if (!user) return;
    
    // Handle anonymous users - save to database with user_id 'anonymous-user'
    if (user.isAnonymous) {
      let image_url = null;
      // Optionally, allow image upload for anonymous users
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `anonymous-user/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
        const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, imageFile);
        if (uploadError) {
          alert('Image upload failed.');
          return;
        }
        image_url = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
      }
      const { data, error } = await supabase
        .from('demo-dialogs')
        .insert([{ 
          text: text.trim(), 
          image_url, 
          user_id: 'anonymous-user' 
        }])
        .select('id, text, image_url, created_at, user_id');
      if (error) {
        console.error('Error inserting dialog (anonymous):', error);
        alert('Failed to save dialog: ' + error.message);
        return;
      }
      if (data && data.length > 0) {
        setDialogs([data[0], ...dialogs]);
        setText("");
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
      return;
    }
    
    let image_url = null;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, imageFile);
      if (uploadError) {
        alert('Image upload failed.');
        return;
      }
      image_url = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
    }
    const { data, error } = await supabase
      .from('demo-dialogs')
      .insert([{ 
        text: text.trim(), 
        image_url, 
        user_id: user.id 
      }])
      .select('id, text, image_url, created_at, user_id');
      
    if (error) {
      console.error('Error inserting dialog:', error);
      alert('Failed to save dialog: ' + error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('Dialog saved:', data[0]);
      setDialogs([data[0], ...dialogs]);
      setText("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Filter dialogs based on search (text, image_url, or user name)
  const filteredDialogs = dialogs.filter(d =>
    (d.text && d.text.toLowerCase().includes(search.toLowerCase())) ||
    (d.image_url && d.image_url.toLowerCase().includes(search.toLowerCase())) ||
    (d.user_name && d.user_name.toLowerCase().includes(search.toLowerCase()))
  );

  // Show login page if not authenticated
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          color: 'white',
          fontSize: 18,
          fontWeight: 500,
        }}>
          <div style={{
            width: 24,
            height: 24,
            border: '3px solid rgba(255, 255, 255, 0.3)',
            borderTop: '3px solid white',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          Loading...
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleAuth} loading={authLoading} />;
  }

  return (
    <div
      className={darkMode ? 'dark-mode' : ''}
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: darkMode
          ? 'linear-gradient(135deg, #181a20 0%, #23263a 100%)'
          : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        padding: '3rem 0',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        transition: 'background 0.3s',
      }}
    >
      {/* Modern floating dark mode and reset buttons */}
      <div style={{
        position: 'fixed',
        top: 18,
        right: 18,
        zIndex: 10001,
        display: 'flex',
        gap: 12,
      }}>
        <button
          onClick={() => setDarkMode((d) => !d)}
          style={{
            background: darkMode
              ? 'linear-gradient(135deg, #23263a 0%, #181a20 100%)'
              : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
            color: darkMode ? '#fbbf24' : '#6366f1',
            border: 'none',
            borderRadius: '50%',
            width: 'clamp(44px, 7vw, 54px)',
            height: 'clamp(44px, 7vw, 54px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(1.5rem, 3vw, 2.2rem)',
            boxShadow: '0 4px 24px 0 rgba(99,102,241,0.18)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
            outline: 'none',
          }}
          aria-label="Toggle dark mode"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {darkMode ? (
            <span role="img" aria-label="Sun">☀️</span>
          ) : (
            <span role="img" aria-label="Moon">🌙</span>
          )}
        </button>
        <button
          onClick={async () => {
            if (user.isAnonymous) {
              const confirmed = window.confirm('Are you sure you want to clear your session dialogs?');
              if (!confirmed) return;
              setDialogs([]);
            } else {
              const confirmed = window.confirm('⚠️ WARNING: This will delete ALL dialogs from ALL users! Are you absolutely sure?');
              if (!confirmed) return;
              const secondConfirm = window.confirm('This action cannot be undone and will affect everyone. Continue?');
              if (!secondConfirm) return;
              const password = window.prompt('Enter admin password to reset ALL dialogs:');
              if (password !== '12344321') {
                window.alert('Incorrect password. Reset cancelled.');
                return;
              }
              await supabase.from('demo-dialogs').delete().neq('id', 0);
              setDialogs([]);
            }
          }}
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            color: '#fff',
            border: 'none',
            borderRadius: '50%',
            width: 'clamp(44px, 7vw, 54px)',
            height: 'clamp(44px, 7vw, 54px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 'clamp(1.3rem, 2.5vw, 1.7rem)',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.18)',
            cursor: 'pointer',
            transition: 'all 0.25s cubic-bezier(.4,0,.2,1)',
            outline: 'none',
          }}
          aria-label="Reset all dialogs"
          title="Reset all dialogs"
        >
          🗑️
        </button>
      </div>
      {/* Modern notification permission banner (below dark mode button) */}
      {/* Notification bar with smooth fade and transparency */}
      <AnimatePresence>
        {showNotifBar && (notifStatus === 'denied' || notifStatus === 'unsupported') && (
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              width: '100vw',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              background: notifStatus === 'denied'
                ? 'linear-gradient(90deg, rgba(248,113,113,0.85) 0%, rgba(239,68,68,0.85) 100%)'
                : 'linear-gradient(90deg, rgba(251,191,36,0.85) 0%, rgba(253,230,138,0.85) 100%)',
              color: notifStatus === 'denied' ? '#fff' : '#18181b',
              fontWeight: 600,
              fontSize: 'clamp(0.95rem, 2vw, 1.15rem)',
              padding: 'clamp(10px, 2vw, 18px) clamp(12px, 4vw, 32px)',
              zIndex: 9998,
              boxShadow: notifStatus === 'denied'
                ? '0 2px 12px 0 rgba(239,68,68,0.18)'
                : '0 2px 12px 0 rgba(251,191,36,0.18)',
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
              transition: 'background 0.25s cubic-bezier(.4,0,.2,1), opacity 0.5s',
              margin: '0 auto',
              maxWidth: 600,
              backdropFilter: 'blur(8px)',
              opacity: 1,
            }}
          >
            <span style={{fontSize: '1.3em'}}>
              {notifStatus === 'denied'
                ? '🔒 Notifications are blocked. Enable them in your browser settings.'
                : '⚠️ Browser notifications are not supported on this device or browser.'}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Dark mode toggle button */}
      <button
        onClick={() => setDarkMode((d) => !d)}
        style={{
          position: 'absolute',
          top: 18,
          right: 24,
          zIndex: 10,
          background: darkMode
            ? 'linear-gradient(135deg, #23263a 0%, #181a20 100%)'
            : 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
          color: darkMode ? '#fbbf24' : '#6366f1',
          border: 'none',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24,
          boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
          cursor: 'pointer',
          transition: 'all 0.2s',
        }}
        aria-label="Toggle dark mode"
        title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {darkMode ? (
          <span role="img" aria-label="Sun">☀️</span>
        ) : (
          <span role="img" aria-label="Moon">🌙</span>
        )}
      </button>
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
      {/* Additional floating orbs */}
      <div style={{
        position: 'absolute',
        top: '10%',
        left: '20%',
        width: '120px',
        height: '120px',
        background: 'radial-gradient(circle, rgba(102, 126, 234, 0.15) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 15s ease-in-out infinite reverse',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '15%',
        right: '25%',
        width: '80px',
        height: '80px',
        background: 'radial-gradient(circle, rgba(139, 92, 246, 0.2) 0%, transparent 70%)',
        borderRadius: '50%',
        animation: 'float 18s ease-in-out infinite',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: '100%',
        maxWidth: window.innerWidth <= 480 ? '95%' : window.innerWidth <= 768 ? '90%' : 560,
        height: window.innerWidth <= 480 ? 'calc(100vh - 4rem)' : 'calc(100vh - 6rem)',
        display: 'flex',
        flexDirection: 'column',
        padding: window.innerWidth <= 480 ? '1.5rem' : window.innerWidth <= 768 ? '1.75rem' : '2rem',
        borderRadius: window.innerWidth <= 480 ? 16 : window.innerWidth <= 768 ? 20 : 24,
        background: darkMode ? 'rgba(24,26,32,0.98)' : 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: darkMode
          ? '0 20px 60px 0 rgba(0,0,0,0.35), 0 0 0 1px rgba(24,26,32,0.25)'
          : '0 20px 60px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)',
        border: darkMode ? '1px solid #23263a' : '1px solid rgba(255, 255, 255, 0.2)',
        margin: window.innerWidth <= 480 ? '0 0.5rem' : '0 1rem',
        position: 'relative',
        overflow: 'hidden',
        transition: 'background 0.3s, box-shadow 0.3s, border 0.3s',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: window.innerWidth <= 480 ? 24 : window.innerWidth <= 768 ? 28 : 32,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: window.innerWidth <= 480 ? 8 : window.innerWidth <= 768 ? 10 : 12,
            flex: 1, // Take available space
          }}>
            <div style={{
              width: window.innerWidth <= 480 ? 40 : window.innerWidth <= 768 ? 44 : 48,
              height: window.innerWidth <= 480 ? 40 : window.innerWidth <= 768 ? 44 : 48,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: window.innerWidth <= 480 ? 20 : window.innerWidth <= 768 ? 22 : 24,
              fontWeight: 'bold',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
              flexShrink: 0, // Prevent shrinking
            }}>
              💬
            </div>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start', // Explicitly left-align text content
              textAlign: 'left', // Ensure text alignment
              flex: 1,
              minWidth: 0, // Allow text to wrap/truncate if needed
            }}>
              <h2 style={{
                fontWeight: 800,
                fontSize: window.innerWidth <= 480 ? 24 : window.innerWidth <= 768 ? 28 : 32,
                margin: 0,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: window.innerWidth <= 480 ? '-1px' : window.innerWidth <= 768 ? '-1.25px' : '-1.5px',
              }}>Dialog Saver</h2>
              {user?.email && (
                <p style={{
                  fontSize: window.innerWidth <= 480 ? 12 : 14,
                  color: '#6b7280',
                  margin: '2px 0 0 0',
                  fontWeight: 500,
                }}>
                  {user.email}
                </p>
              )}
              {user?.isAnonymous && (
                <p style={{
                  fontSize: window.innerWidth <= 480 ? 11 : 12,
                  color: '#16a34a',
                  margin: '2px 0 0 0',
                  fontWeight: 600,
                }}>
                  🕶️ Anonymous Mode - Data saved locally in this browser
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              padding: window.innerWidth <= 480 ? '8px 12px' : '10px 16px',
              borderRadius: 8,
              border: 'none',
              background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: window.innerWidth <= 480 ? 12 : 14,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-1px)';
              e.target.style.boxShadow = '0 4px 12px rgba(239, 68, 68, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 2px 8px rgba(239, 68, 68, 0.2)';
            }}
          >
            🚪 Logout
          </button>
        </div>
        
        {/* Scrollable content area */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          overflowX: 'hidden', // Prevent horizontal scroll
        }}>
          <div style={{
            marginBottom: 20,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div style={{
              position: 'relative',
              width: '100%',
              background: '#fff',
              borderRadius: 24,
              boxShadow: '0 2px 16px 0 rgba(0,0,0,0.07)',
              border: '1.5px solid #e5e7eb',
              padding: '0.5rem 0.75rem',
              display: 'flex',
              alignItems: 'flex-end',
              minHeight: 64,
              marginBottom: 2,
              transition: 'box-shadow 0.2s',
            }}>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                rows={2}
                style={{
                  flex: 1,
                  minHeight: 40,
                  maxHeight: 120,
                  border: 'none',
                  outline: 'none',
                  resize: 'none',
                  fontSize: 16,
                  fontFamily: 'inherit',
                  background: 'transparent',
                  color: '#222',
                  padding: '0.5rem 2.5rem 0.5rem 2.5rem',
                  borderRadius: 18,
                  lineHeight: 1.5,
                  boxShadow: 'none',
                  transition: 'background 0.2s',
                }}
              />
              {/* Image button moved to the right, next to send button, with SVG icon */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={e => setImageFile(e.target.files[0])}
                style={{
                  position: 'absolute',
                  right: 82,
                  bottom: 10,
                  width: 44,
                  height: 44,
                  opacity: 0,
                  cursor: 'pointer',
                  zIndex: 3
                }}
                id="file-upload-inside"
              />
              <label
                htmlFor="file-upload-inside"
                style={{
                  position: 'absolute',
                  right: 82,
                  bottom: 10,
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%)',
                  border: '1.5px solid #e5e7eb',
                  borderRadius: '50%',
                  color: '#8b5cf6',
                  fontSize: 20,
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 1px 4px rgba(139,92,246,0.07)',
                  zIndex: 2,
                  transition: 'background 0.18s, border 0.18s',
                  gap: 0
                }}
                title="Add image"
                onMouseEnter={e => {
                  e.target.style.background = '#f3e8ff';
                  e.target.style.border = '1.5px solid #a78bfa';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'linear-gradient(135deg, #fafafa 0%, #f1f5f9 100%)';
                  e.target.style.border = '1.5px solid #e5e7eb';
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="3" y="7" width="18" height="12" rx="3" fill="#fff" stroke="#8b5cf6" strokeWidth="1.5"/>
                  <circle cx="12" cy="13" r="3.2" fill="#f3e8ff" stroke="#8b5cf6" strokeWidth="1.5"/>
                  <rect x="8.5" y="4" width="7" height="3" rx="1.5" fill="#fafafa" stroke="#8b5cf6" strokeWidth="1.5"/>
                  <rect x="6.5" y="2.5" width="3" height="3" rx="1.5" fill="#8b5cf6" stroke="#8b5cf6" strokeWidth="1.2"/>
                </svg>
              </label>
              {/* Add dialog button styled like Instagram send */}
              <button
                onClick={handleAdd}
                style={{
                  position: 'absolute',
                  bottom: 10,
                  right: 10,
                  background: 'transparent',
                  color: '#8b5cf6',
                  border: '2px solid #8b5cf6',
                  borderRadius: 22,
                  width: 60,
                  height: 44,
                  minWidth: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  boxShadow: 'none',
                  cursor: 'pointer',
                  transition: 'background 0.18s, color 0.18s, border 0.18s',
                  zIndex: 2,
                  outline: 'none',
                  gap: 5,
                  padding: '0 12px',
                }}
                aria-label="Add Dialog"
                title="Add Dialog (Ctrl+Enter)"
                onMouseEnter={e => {
                  e.target.style.background = 'linear-gradient(135deg, #8b5cf6 0%, #fbbf24 100%)';
                }}
                onMouseLeave={e => {
                  e.target.style.background = 'linear-gradient(135deg, #fbbf24 0%, #8b5cf6 100%)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', gap: 6 }}>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: 'block' }}>
                    <path d="M3 17L17 10L3 3V8.5L13 10L3 11.5V17Z" fill="currentColor"/>
                  </svg>
                  <span style={{ fontSize: 15, fontWeight: 600, color: '#000', letterSpacing: '0.2px', userSelect: 'none', lineHeight: 1, display: 'block' }}>Send</span>
                </div>
              </button>
            </div>
            {/* Removed old add image input/label, now inside textarea */}
            {imageFile && (
              <div style={{
                marginTop: 8,
                padding: '7px 8px 7px 10px',
                borderRadius: 8,
                background: 'rgba(99, 102, 241, 0.06)',
                border: '1px solid #a5b4fc',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                maxWidth: 200,
                boxShadow: '0 1px 4px rgba(99,102,241,0.07)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                  <span style={{ 
                    color: '#6366f1', 
                    fontSize: 11,
                    fontWeight: 500,
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    📎 {imageFile.name}
                  </span>
                  <button 
                    onClick={() => { 
                      setImageFile(null); 
                      if (fileInputRef.current) fileInputRef.current.value = ""; 
                    }} 
                    style={{ 
                      color: '#ef4444', 
                      background: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.2)',
                      borderRadius: 5,
                      padding: '2px 6px',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 500,
                      marginLeft: 6,
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.15)';
                      e.target.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.background = 'rgba(239, 68, 68, 0.1)';
                      e.target.style.transform = 'scale(1)';
                    }}
                  >
                    ✕ Remove
                  </button>
                </div>
                {/* Image preview */}
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="preview"
                  style={{
                    marginTop: 7,
                    maxWidth: 120,
                    maxHeight: 80,
                    borderRadius: 7,
                    border: '1px solid #6366f1',
                    boxShadow: '0 1px 4px rgba(99,102,241,0.08)',
                    objectFit: 'cover',
                  }}
                />
              </div>
            )}
          </div>
          {/* Removed duplicated Reset All button below the text area */}
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Search dialogs by text or user name..."
            style={{
              width: '100%',
              marginBottom: 18,
              padding: window.innerWidth <= 480 ? '10px 16px' : window.innerWidth <= 768 ? '11px 18px' : '12px 20px',
              borderRadius: window.innerWidth <= 480 ? 8 : window.innerWidth <= 768 ? 10 : 12,
              border: '2px solid #e2e8f0',
              fontSize: window.innerWidth <= 480 ? 14 : window.innerWidth <= 768 ? 15 : 16,
              background: '#f8fafc',
              color: '#1e293b',
              outline: 'none',
              boxShadow: '0 4px 16px rgba(31, 38, 135, 0.06)',
              transition: 'all 0.3s ease',
              fontWeight: 500,
              letterSpacing: '0.2px',
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
          />
          <div style={{
            flex: 1, // Take remaining space
            minHeight: '300px', // Ensure minimum height for dialogs
            overflowY: 'auto', // Enable vertical scrolling only
            overflowX: 'hidden', // Prevent horizontal scroll
            borderRadius: 16, // Add border radius to the dialog list container
            background: 'rgba(248, 250, 252, 0.5)', // Subtle background
            padding: '12px 16px', // Adjust padding to prevent overflow
            border: '1px solid rgba(226, 232, 240, 0.8)', // Light border
          }}>
            {loading ? (
              <div style={{ 
                color: '#6b7280', 
                textAlign: 'center', 
                fontSize: 16,
                padding: '40px 0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}>
                <div style={{
                  width: 20,
                  height: 20,
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #6366f1',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                }} />
                Loading dialogs...
              </div>
            ) : filteredDialogs.length === 0 ? (
              <div style={{ 
                color: '#6b7280', 
                textAlign: 'center',
                fontSize: 16,
                padding: '40px 20px',
                background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
                borderRadius: 12,
                border: '2px dashed #d1d5db',
              }}>
                {search ? (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                    No dialogs found matching "{search}"
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>💭</div>
                    No dialogs yet. Add your first one above!
                  </>
                )}
              </div>
            ) : (
              <AnimatePresence>
                {filteredDialogs.map((dialog, idx) => (
                  <motion.div
                    key={(dialog.id || idx) + (dialog.text || '') + (dialog.image_url || '')}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.32, type: 'spring', stiffness: 120 }}
                    style={{
                      background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(139, 92, 246, 0.05) 100%)',
                      color: '#1e293b',
                      padding: '16px 20px',
                      borderRadius: 12,
                      marginBottom: 14,
                      border: '1.5px solid rgba(99, 102, 241, 0.15)',
                      boxShadow: '0 4px 16px rgba(99, 102, 241, 0.08)',
                      fontSize: 16,
                      fontWeight: 500,
                      wordBreak: 'break-word',
                      touchAction: 'manipulation',
                      whiteSpace: 'pre-wrap',
                      position: 'relative',
                      transition: 'all 0.3s ease',
                      cursor: 'default',
                      width: '100%', // Ensure full width
                      boxSizing: 'border-box', // Include padding in width calculation
                      overflow: 'hidden', // Prevent content overflow
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.12)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.08)';
                      e.currentTarget.style.borderColor = 'rgba(99, 102, 241, 0.15)';
                    }}
                  >
                    <div style={{
                      position: 'absolute',
                      top: -1,
                      left: -1,
                      right: -1,
                      height: 2,
                      background: 'linear-gradient(90deg, #6366f1, #8b5cf6, #6366f1)',
                      borderRadius: '12px 12px 0 0',
                      opacity: 0.6,
                    }} />
                    
                    {/* User name header */}
                    <div style={{
                      fontSize: 12,
                      color: '#6366f1',
                      fontWeight: 600,
                      marginBottom: 8,
                      opacity: 0.8,
                      letterSpacing: '0.5px',
                    }}>
                      👤 {dialog.user_name || 'Unknown User'}
                    </div>
                    
                    {dialog.text && <div>{dialog.text}</div>}
                    {dialog.image_url && (
                      <img src={dialog.image_url} alt="dialog-img" style={{
                        maxWidth: '100%',
                        maxHeight: 220,
                        borderRadius: 10,
                        marginTop: dialog.text ? 10 : 0,
                        boxShadow: '0 2px 8px rgba(99,102,241,0.10)'
                      }} />
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
