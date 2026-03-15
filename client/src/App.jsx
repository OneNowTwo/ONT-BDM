import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import MorningReview from './pages/MorningReview';
import Pipeline from './pages/Pipeline';
import FollowUps from './pages/FollowUps';
import RunLog from './pages/RunLog';

const API_BASE = '/api';

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', background: '#0D0D0D' }}>
        <Navbar />
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>
          <Routes>
            <Route path="/" element={<Navigate to="/review" replace />} />
            <Route path="/review" element={<MorningReview />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/followups" element={<FollowUps />} />
            <Route path="/runs" element={<RunLog />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export { API_BASE };
