import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import RulesPage from './pages/RulesPage';
import InspectionPage from './pages/InspectionPage';

function App() {
  return (
    <Router>
        <Navigation />
        <Routes>
          <Route path="/rules" element={<RulesPage />} />
          <Route path="/inspection" element={<InspectionPage />} />
          <Route path="/" element={<Navigate to="/rules" replace />} />
        </Routes>
    </Router>
  );
}

export default App; 