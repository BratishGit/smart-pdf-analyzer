import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Contact from './pages/Contact';
import About from './pages/About';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import DocumentView from './pages/DocumentView';
import Search from './pages/Search';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen flex flex-col bg-bgDark text-textPrimary font-sans w-full">
        <a className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 px-4 py-2 bg-accent text-white rounded-md" href="#main-content">Skip to main content</a>
        <Navbar />
        <div className="flex-grow w-full flex flex-col pt-20" id="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/about" element={<About />} />
            {/* Document Routes */}
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/upload" element={<Upload />} />
            <Route path="/document/:id" element={<DocumentView />} />
            <Route path="/search" element={<Search />} />
            {/* Fallback */}
            <Route path="*" element={
              <main className="min-h-[80vh] flex flex-col items-center justify-center gap-6 p-8">
                <h1 className="text-7xl font-display font-bold text-accent">404</h1>
                <p className="text-lg text-textSecondary">Page not found</p>
                <a href="/" className="px-6 py-3 rounded-lg bg-gradient-to-r from-accent to-purple-500 text-white font-semibold shadow-lg hover:shadow-xl transition-all">Go Home</a>
              </main>
            } />
          </Routes>
        </div>
        <Footer />
      </div>
    </BrowserRouter>
  );
}

export default App;
