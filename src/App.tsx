/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Home } from './pages/Home';
import { Highlights } from './pages/Highlights';
import { Profile } from './pages/Profile';
import { Events } from './pages/Events';
import { Roadmap } from './pages/Roadmap';
import { Articles } from './pages/Articles';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="highlights" element={<Highlights />} />
            <Route path="profile" element={<Profile />} />
            <Route path="events" element={<Events />} />
            <Route path="roadmap" element={<Roadmap />} />
            <Route path="articles" element={<Articles />} />
          </Route>
        </Routes>
      </BrowserRouter>
      <Toaster 
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
          },
        }}
      />
    </AuthProvider>
  );
}
