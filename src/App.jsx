import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { AnimatePresence, motion } from 'framer-motion';
import './App.css';

const supabaseUrl = 'https://frskdsglexjeehahmiow.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZyc2tkc2dsZXhqZWVoYWhtaW93Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzODk4NzcsImV4cCI6MjA2ODk2NTg3N30.3ObYpFwg7WfYUy5KCzJfrLlAxJGTvoSlqnSeCAEOSnQ';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const BUCKET = 'dialog-photos'; // You must create this bucket in Supabase Storage

function App() {
  const [text, setText] = useState("");
  const [dialogs, setDialogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const fileInputRef = useRef();

  // Fetch dialogs from Supabase on mount and subscribe to realtime changes
  useEffect(() => {
    const fetchDialogs = async () => {
      const { data, error } = await supabase
        .from('demo-dialogs')
        .select('id, text, image_url')
        .order('id', { ascending: false });
      if (!error && data) {
        setDialogs(data);
      }
      setLoading(false);
    };
    fetchDialogs();

    // Realtime subscription
    const channel = supabase
      .channel('realtime-demo-dialogs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'demo-dialogs' }, payload => {
        fetchDialogs();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleAdd = async () => {
    if (text.trim() === "" && !imageFile) return;
    let image_url = null;
    if (imageFile) {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage.from(BUCKET).upload(fileName, imageFile);
      if (uploadError) {
        alert('Image upload failed.');
        return;
      }
      image_url = supabase.storage.from(BUCKET).getPublicUrl(fileName).data.publicUrl;
    }
    const { data, error } = await supabase
      .from('demo-dialogs')
      .insert([{ text, image_url }])
      .select();
    if (!error && data && data.length > 0) {
      setDialogs([data[0], ...dialogs]);
      setText("");
      setImageFile(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Filter dialogs based on search (text or image_url)
  const filteredDialogs = dialogs.filter(d =>
    (d.text && d.text.toLowerCase().includes(search.toLowerCase())) ||
    (d.image_url && d.image_url.toLowerCase().includes(search.toLowerCase()))
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
      padding: '3rem 0', // Add top and bottom padding
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
        maxHeight: 'calc(100vh - 6rem)', // Constrain height to viewport minus padding
        display: 'flex',
        flexDirection: 'column',
        padding: window.innerWidth <= 480 ? '1.5rem' : window.innerWidth <= 768 ? '1.75rem' : '2rem',
        borderRadius: window.innerWidth <= 480 ? 16 : window.innerWidth <= 768 ? 20 : 24,
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 20px 60px 0 rgba(0, 0, 0, 0.15), 0 0 0 1px rgba(255, 255, 255, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        margin: window.innerWidth <= 480 ? '0 0.5rem' : '0 1rem',
        position: 'relative',
        overflow: 'hidden', // Hide overflow on the container
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: window.innerWidth <= 480 ? 24 : window.innerWidth <= 768 ? 28 : 32,
          gap: window.innerWidth <= 480 ? 8 : window.innerWidth <= 768 ? 10 : 12,
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
          }}>
            💬
          </div>
          <h2 style={{
            fontWeight: 800,
            fontSize: window.innerWidth <= 480 ? 24 : window.innerWidth <= 768 ? 28 : 32,
            margin: 0,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: window.innerWidth <= 480 ? '-1px' : window.innerWidth <= 768 ? '-1.25px' : '-1.5px',
          }}>Dialog Saver</h2>
        </div>
        <div style={{
          marginBottom: 20,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
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
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={e => setImageFile(e.target.files[0])}
            style={{
              border: 'none',
              background: 'none',
              fontSize: 15,
              color: '#6366f1',
              marginTop: 4,
            }}
          />
          {imageFile && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: '#6366f1', fontSize: 14 }}>{imageFile.name}</span>
              <button onClick={() => { setImageFile(null); if (fileInputRef.current) fileInputRef.current.value = ""; }} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14 }}>Remove</button>
            </div>
          )}
        </div>
        <button
          onClick={handleAdd}
          style={{
            marginBottom: 16,
            padding: window.innerWidth <= 480 ? '16px 0' : window.innerWidth <= 768 ? '18px 0' : '20px 0',
            width: '100%',
            borderRadius: window.innerWidth <= 480 ? 8 : window.innerWidth <= 768 ? 10 : 12,
            border: 'none',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: window.innerWidth <= 480 ? 16 : window.innerWidth <= 768 ? 17 : 18,
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
            const confirmed = window.confirm('Are you sure you want to delete all dialogs? This cannot be undone.');
            if (!confirmed) return;
            const password = window.prompt('Enter password to reset:');
            if (password !== '12344321') {
              window.alert('Incorrect password. Reset cancelled.');
              return;
            }
            await supabase.from('demo-dialogs').delete().neq('id', 0);
            setDialogs([]);
          }}
          style={{
            marginBottom: 28,
            padding: window.innerWidth <= 480 ? '16px 0' : window.innerWidth <= 768 ? '18px 0' : '20px 0',
            width: '100%',
            borderRadius: window.innerWidth <= 480 ? 8 : window.innerWidth <= 768 ? 10 : 12,
            border: 'none',
            background: 'linear-gradient(135deg, #ef4444 0%, #f97316 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: window.innerWidth <= 480 ? 16 : window.innerWidth <= 768 ? 17 : 18,
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
          overflowY: 'auto', // Enable vertical scrolling
          paddingRight: '8px', // Space for scrollbar
          marginRight: '-8px', // Offset scrollbar padding
          borderRadius: 16, // Add border radius to the dialog list container
          background: 'rgba(248, 250, 252, 0.5)', // Subtle background
          padding: '12px 20px 12px 12px', // Padding inside the container
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
  );
}

export default App;
