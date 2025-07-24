
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

  return (
    <div style={{
      minHeight: '100vh',
      width: '100vw',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f8fafc 0%, #e0e7ef 100%)',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: 0,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 520,
        padding: '6vw 4vw',
        borderRadius: 18,
        background: '#fff',
        boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        border: '1px solid #e5e7eb',
        margin: '0 2vw',
      }}>
        <h2 style={{
          fontWeight: 700,
          fontSize: 28,
          marginBottom: 24,
          color: '#1e293b',
          letterSpacing: '-1px',
          textAlign: 'center',
        }}>Dialog Saver</h2>
        <textarea
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            minHeight: 100,
            maxHeight: 220,
            marginBottom: 16,
            padding: 0,
            borderRadius: 10,
            border: '1.5px solid #cbd5e1',
            fontSize: 16,
            background: '#f1f5f9',
            color: '#222',
            outline: 'none',
            boxShadow: '0 2px 8px 0 rgba(31, 38, 135, 0.04)',
            transition: 'border 0.2s',
            resize: 'vertical',
          }}
          placeholder="Enter your text here..."
        />
        <br />
        <button
          onClick={handleAdd}
          style={{
            marginBottom: 28,
            padding: '14px 0',
            width: '100%',
            borderRadius: 8,
            border: 'none',
            background: 'linear-gradient(90deg, #6366f1 0%, #60a5fa 100%)',
            color: '#fff',
            fontWeight: 600,
            fontSize: 18,
            boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.10)',
            cursor: 'pointer',
            transition: 'background 0.2s',
            letterSpacing: '0.5px',
          }}
        >Add</button>
        <div>
          {loading ? (
            <p style={{ color: '#888', textAlign: 'center' }}>Loading...</p>
          ) : dialogs.length === 0 ? (
            <p style={{ color: '#888', textAlign: 'center' }}>No dialogs saved yet.</p>
          ) : (
            <AnimatePresence>
              {dialogs.map((dialog, idx) => (
                <motion.div
                  key={dialog + idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.32, type: 'spring', stiffness: 120 }}
                  style={{
                    background: 'rgba(99, 102, 241, 0.08)',
                    color: '#222',
                    padding: 14,
                    borderRadius: 10,
                    marginBottom: 14,
                    border: '1.5px solid #c7d2fe',
                    boxShadow: '0 2px 8px 0 rgba(99, 102, 241, 0.06)',
                    fontSize: 16,
                    fontWeight: 500,
                    wordBreak: 'break-word',
                    touchAction: 'manipulation',
                  }}
                >
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

export default App
