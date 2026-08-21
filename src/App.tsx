import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SolanaProvider } from './solana/solanaContext';
import { TokenStoreProvider, useTokenStore } from './data/tokenStore';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { WalletModal } from './components/WalletModal';
import { TransactionStatusModal } from './components/TransactionStatusModal';
import { SearchModal } from './components/SearchModal';
import { Home } from './pages/Home';
import { Explore } from './pages/Explore';
import { TokenDetail } from './pages/TokenDetail';
import { LaunchPage } from './pages/LaunchPage';
import { Dashboard } from './pages/Dashboard';
import { Profile } from './pages/Profile';
import { Token } from './types/token';
import { ErrorBoundary } from './components/ErrorBoundary';

type Page = 'home' | 'explore' | 'token' | 'launch' | 'dashboard' | 'profile';

const AppContent: React.FC = () => {
  const { tokens, getTokenByMint } = useTokenStore();

  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);

  // Modals
  const [walletModalOpen, setWalletModalOpen] = useState(false);
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // Synchronize hash routing
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash.startsWith('token-')) {
        const mint = hash.replace('token-', '');
        const found = getTokenByMint(mint);
        if (found) {
          setSelectedToken(found);
          setCurrentPage('token');
          return;
        }
      }

      if (['home', 'explore', 'launch', 'dashboard', 'profile'].includes(hash)) {
        setCurrentPage(hash as Page);
      }
    };

    handleHashChange();
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [getTokenByMint]);

  // Keep selectedToken synced with live store updates (e.g. after a trade)
  useEffect(() => {
    if (selectedToken) {
      const updated = getTokenByMint(selectedToken.mintAddress);
      if (updated) {
        setSelectedToken(updated);
      }
    }
  }, [tokens]);

  const handleNavigate = (page: string, param?: string) => {
    if (page === 'token' && param) {
      const found = getTokenByMint(param);
      if (found) {
        setSelectedToken(found);
        setCurrentPage('token');
        window.location.hash = `token-${param}`;
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setCurrentPage(page as Page);
    window.location.hash = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectToken = (token: Token) => {
    setSelectedToken(token);
    setCurrentPage('token');
    window.location.hash = `token-${token.mintAddress}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onOpenWalletModal={() => setWalletModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatePresence mode="wait">
          {currentPage === 'home' && (
            <motion.div
              key="home"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Home
                tokens={tokens}
                onNavigate={handleNavigate}
                onSelectToken={handleSelectToken}
              />
            </motion.div>
          )}

          {currentPage === 'explore' && (
            <motion.div
              key="explore"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Explore
                tokens={tokens}
                onSelectToken={handleSelectToken}
                onNavigate={handleNavigate}
              />
            </motion.div>
          )}

          {currentPage === 'token' && selectedToken && (
            <motion.div
              key={`token-${selectedToken.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <TokenDetail
                token={selectedToken}
                onBack={() => handleNavigate('explore')}
                onOpenWalletModal={() => setWalletModalOpen(true)}
              />
            </motion.div>
          )}

          {currentPage === 'launch' && (
            <motion.div
              key="launch"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <LaunchPage
                onTokenCreated={(t) => handleSelectToken(t)}
                onOpenWalletModal={() => setWalletModalOpen(true)}
                onNavigate={handleNavigate}
              />
            </motion.div>
          )}

          {currentPage === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard
                onSelectToken={handleSelectToken}
                onNavigate={handleNavigate}
                onOpenWalletModal={() => setWalletModalOpen(true)}
              />
            </motion.div>
          )}

          {currentPage === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Profile
                onOpenWalletModal={() => setWalletModalOpen(true)}
                onNavigate={handleNavigate}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Global Modals */}
      <WalletModal
        isOpen={walletModalOpen}
        onClose={() => setWalletModalOpen(false)}
      />

      <SearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelectToken={handleSelectToken}
      />

      <TransactionStatusModal />

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SolanaProvider>
        <TokenStoreProvider>
          <AppContent />
        </TokenStoreProvider>
      </SolanaProvider>
    </ErrorBoundary>
  );
}
