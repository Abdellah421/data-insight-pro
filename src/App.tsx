import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import ToolPage from './pages/ToolPage';
import { PricingPage, AboutPage, ContactPage, PrivacyPage, TermsPage } from './pages/StaticPages';
import { ProjectProvider } from './context/ProjectContext';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider } from './context/AuthContext';

const DataInsightWorkspace = React.lazy(() => import('./pages/Workspace'));

function WorkspaceFallback() {
  return (
    <div className="flex h-[100dvh] w-full items-center justify-center bg-gray-100">
      <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24" fill="none">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <ProjectProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route
                path="/app"
                element={
                  <Suspense fallback={<WorkspaceFallback />}>
                    <DataInsightWorkspace />
                  </Suspense>
                }
              />
              <Route path="/tools/:toolId" element={<ToolPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ProjectProvider>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
