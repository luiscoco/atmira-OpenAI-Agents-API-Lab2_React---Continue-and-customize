import { useEffect, useState } from 'react';
import Lab2 from './Lab2.jsx';

export default function App() {
  const [feature, setFeature] = useState('conversation');
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then((response) => response.json())
      .then(setHealth)
      .catch(() => setHealth({ configured: false, model: 'unknown' }));
  }, []);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand"><span className="brand-mark">✳</span><span>AGENT LABS<small>THE LEARNING SERIES</small></span></div>
        <div className="side-label">LAB 02 · CONTINUE & CUSTOMIZE</div>
        <button type="button" className={'nav-next nav-button' + (feature === 'conversation' ? ' selected' : '')} onClick={() => setFeature('conversation')}><span>Continue a conversation</span><small>LAB 02 · LESSON 1</small></button>
        <button type="button" className={'nav-next nav-button' + (feature === 'instructions' ? ' selected' : '')} onClick={() => setFeature('instructions')}><span>Customize instructions</span><small>LAB 02 · LESSON 2</small></button>
        <div className="sidebar-bottom"><span className="mini-orb">◈</span><div><strong>50 hands-on labs</strong><small>From first run to advanced agents</small></div></div>
      </aside>

      <main className="main">
        <header className="topbar"><span>COURSE / FOUNDATIONS / <b>LAB 02</b></span><span className="top-right"><span className="status-dot" /> INTERACTIVE LAB</span></header>
        <div className="content"><Lab2 feature={feature} onFeatureChange={setFeature} health={health} /></div>
      </main>
    </div>
  );
}
