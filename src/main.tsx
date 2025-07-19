import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DataProvider } from './context/DataContext';
import AdminPrompt from './components/admin/AdminPrompt';

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <Router>
        <DataProvider>
          <App />
          <AdminPrompt />
        </DataProvider>
      </Router>
    </QueryClientProvider>
  </StrictMode>,
);
