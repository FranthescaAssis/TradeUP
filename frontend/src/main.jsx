import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { AuthProvider } from './auth/AuthContext.jsx';
import { FeedbackProvider } from './components/Feedback.jsx';
import './style.css';
import './styles/feedback.css';

// FeedbackProvider (avisos) fica por fora de AuthProvider (sessão), que fica por fora de App (telas).
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FeedbackProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </FeedbackProvider>
  </React.StrictMode>
);
