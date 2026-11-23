import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Landing from './Landing'
import Dashboard from './Dashboard'
import Navbar from '../components/Navbar'
import { lazy, Suspense } from "react";
import { ContentServiceProvider } from "@/components/Editor/lib/contentService";
import { MediaServiceProvider } from "@/components/Editor/lib/mediaService";
import { LinkServiceProvider } from "@/components/Editor/lib/linkService";
import { MenuServiceProvider } from "@/components/Editor/lib/menuService";
import { AuthServiceProvider } from "@/components/Editor/lib/authService";
import { activeServices } from "@/lib/services.config";

const ContentEditor = lazy(() => import("@/components/Editor/ContentEditor"));

export default function App() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh', background: '#0a0a0a',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ color: '#333', fontSize: '1.5rem' }}>₿</div>
      </div>
    )
  }

  return (
    <>
      {user && <Navbar />}
      <Routes>
        <Route
          path="/"
          element={user ? <Navigate to="/dashboard" replace /> : <Landing />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <ContentServiceProvider service={activeServices}>
        <MediaServiceProvider service={activeServices}>
          <LinkServiceProvider service={activeServices}>
            <MenuServiceProvider service={activeServices}>
              <AuthServiceProvider service={activeServices}>
                <Suspense fallback={null}>
                  <ContentEditor showTrigger={import.meta.env.DEV} />
                </Suspense>
              </AuthServiceProvider>
            </MenuServiceProvider>
          </LinkServiceProvider>
        </MediaServiceProvider>
      </ContentServiceProvider>
    </>
  )
}