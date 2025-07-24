import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';

const supabaseUrl = 'https://frskdsglexjeehahmiow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyc2tkc2dsZXhqZWVoYWhtaW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODk4NzcsImV4cCI6MjA2ODk2NTg3N30.3ObYpFwg7WfYUy5KCzJfrLlAxJGTvoSlqnSeCAEOSnQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [text, setText] = useState("");
  const [dialogs, setDialogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(""); // <-- search state

  // Fetch dialogs from Supabase on mount and subscribe to realtime changes
  useEffect(() => {
    const fetchDialogs = async () => {
      const { data, error } = await supabase
        .from('dialogs')
        .select('text')
        .order('id', { ascending: false });
      if (!error && data) {
        setDialogs(data.map(d => d.text));
      }
      setLoading(false);
    };
    fetchDialogs();

    // Realtime subscription
    const channel = supabase
      .channel('realtime-dialogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dialogs' }, payload => {
        fetchDialogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAdd = async () => {
    if (text.trim() !== "") {
      const { data, error } = await supabase
        .from('dialogs')
        .insert([{ text }])
        .select();
      if (!error && data && data.length > 0) {
        setDialogs([data[0].text, ...dialogs]);
        setText("");
      }
    }
  };

  // Filter dialogs based on search
  const filteredDialogs = dialogs.filter(d =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: 0,
      position: 'relative',
      overflow: 'hidden',
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
        maxWidth: 560,
        padding: '2rem',
        borderRadius: 24,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        margin: '0 1rem',
        position: 'relative',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 32,
          gap: 12,
        }}>
          <div style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontSize: 24,
            fontWeight: 'bold',
            boxShadow: '0 8px 20px rgba(102, 126, 234, 0.3)',
          }}>
            💬
          </div>
          <h2 style={{
            fontWeight: 800,
            fontSize: 32,
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '-1.5px',
          }}>Dialog Saver</h2>
        </div>
        <div style={{
          marginBottom: 20,
          position: 'relative',
        }}>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              minHeight: 100,
              maxHeight: 220,
              padding: '16px 20px',
              borderRadius: 12,
              border: '2px solid #e2e8f0',
              fontSize: 16,
              background: '#f8fafc',
              color: '#1e293b',
              outline: 'none',
              boxShadow: '0 4px 16px rgba(31, 38, 135, 0.06)',
              transition: 'all 0.3s ease',
              resize: 'vertical',
              fontFamily: 'inherit',
              lineHeight: 1.5,
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
            placeholder="✨ Share your thoughts, ideas, or anything worth remembering..."
          />
        </div>
        <button
          onClick={handleAdd}
          style={{
            marginBottom: 16,
            padding: '14px 0',
            width: '100%',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 18,
            boxShadow: '0 4px 16px rgba(99, 102, 241, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(99, 102, 241, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(99, 102, 241, 0.2)';
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            ✨ Add Dialog
          </span>
        </button>
        <button
          onClick={async () => {
            if (
              window.confirm(
                'Are you sure you want to delete all dialogs? This cannot be undone.'
              )
            ) {
              await supabase.from('dialogs').delete().neq('id', 0);
              setDialogs([]);
            }
          }}
          style={{
            marginBottom: 28,
            padding: '14px 0', // Match Add button padding
            width: '100%',
            borderRadius: 12,
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 18, // Match Add button font size
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.2)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            letterSpacing: '0.5px',
            position: 'relative',
            overflow: 'hidden',
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'translateY(-2px)';
            e.target.style.boxShadow = '0 8px 25px rgba(239, 68, 68, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 16px rgba(239, 68, 68, 0.2)';
          }}
        >
          <span style={{ position: 'relative', zIndex: 1 }}>
            🗑️ Reset All
          </span>
        </button>
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="🔍 Search dialogs..."
          style={{
            width: '100%',
            marginBottom: 18,
            padding: '12px 20px',
            borderRadius: 12,
            border: '2px solid #e2e8f0',
            fontSize: 16,
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
        <div>
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
                  key={dialog + idx}
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
                  {dialog}
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
