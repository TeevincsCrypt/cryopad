import React, { useState } from 'react';
import { 
  Flame, 
  Search, 
  PlusCircle, 
  LayoutGrid, 
  Wallet, 
  ChevronDown, 
  Menu, 
  X, 
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { useSolana } from '../solana/solanaContext';
import { shortenAddress } from '../solana/bondingCurve';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string, param?: string) => void;
  onOpenWalletModal: () => void;
  onOpenSearch?: () => void;
  onOpenSearchModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenWalletModal,
  onOpenSearch,
  onOpenSearchModal,
}) => {
  const { 
    connected, 
    publicKey, 
    balance, 
    network, 
    setNetwork,
    solPriceUsd,
    solPrice24hChange,
  } = useSolana();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [networkDropdownOpen, setNetworkDropdownOpen] = useState(false);

  const handleSearchClick = onOpenSearch || onOpenSearchModal || (() => {});

  const navLinks = [
    { id: 'home', label: 'Home', icon: Flame },
    { id: 'explore', label: 'Explore', icon: LayoutGrid },
    { id: 'dashboard', label: 'Portfolio', icon: Activity },
    { id: 'profile', label: 'Profile', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Links */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Zap className="w-5 h-5 fill-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-extrabold tracking-tight text-slate-900 text-lg leading-none">
                SWAGPAD
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  BUNDLER
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium tracking-wide">
                Solana Token & Multi-Wallet Launchpad
              </span>
            </div>
          </button>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => onNavigate(link.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {link.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Center: Search Trigger */}
        <div className="hidden lg:flex flex-1 max-w-xs mx-2">
          <button
            onClick={handleSearchClick}
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-400 text-slate-500 text-xs transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
              <span>Search token, ticker, or mint...</span>
            </div>
            <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white rounded border border-slate-200 text-slate-500">
              /
            </kbd>
          </button>
        </div>

        {/* Right: SOL Price, Network, Launch CTA, Wallet */}
        <div className="flex items-center gap-2.5">
          {/* Live SOL Price */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono">
            <span className="text-slate-500 font-sans text-[11px]">SOL</span>
            <span className="text-slate-900 font-bold">
              {solPriceUsd !== null ? `$${solPriceUsd.toFixed(2)}` : (
                <span className="text-slate-400 text-[10px]">Loading...</span>
              )}
            </span>
            {solPrice24hChange !== 0 && (
              <span className={`text-[10px] flex items-center font-bold ${solPrice24hChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {solPrice24hChange >= 0 ? '+' : ''}{solPrice24hChange.toFixed(1)}%
              </span>
            )}
          </div>

          {/* Network Switcher */}
          <div className="relative">
            <button
              onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-mono text-slate-800 transition-colors cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${network === 'devnet' ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
              <span className="capitalize font-semibold">{network}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {networkDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-44 rounded-xl bg-white border border-slate-200 p-1.5 shadow-xl z-50 text-xs space-y-1"
                onMouseLeave={() => setNetworkDropdownOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                  Select Cluster
                </div>
                <button
                  onClick={() => {
                    setNetwork('devnet');
                    setNetworkDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    network === 'devnet' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Solana Devnet</span>
                  {network === 'devnet' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
                <button
                  onClick={() => {
                    setNetwork('mainnet-beta');
                    setNetworkDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    network === 'mainnet-beta' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <span>Mainnet Beta</span>
                  {network === 'mainnet-beta' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />}
                </button>
              </div>
            )}
          </div>

          {/* Launch Token CTA */}
          <button
            onClick={() => onNavigate('launch')}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm shadow-emerald-500/20 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Launch Token</span>
            <span className="sm:hidden">Launch</span>
          </button>

          {/* Wallet Button */}
          {connected && publicKey ? (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-900 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex flex-col items-end leading-none">
                <span className="font-mono text-emerald-700 font-bold text-[11px]">
                  {balance.toFixed(2)} SOL
                </span>
                <span className="font-mono text-[10px] text-slate-500">
                  {shortenAddress(publicKey, 4)}
                </span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer shadow-xs"
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Connect</span>
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 md:hidden rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <button
            onClick={() => {
              handleSearchClick();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-xs"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <span>Search tokens or mint address...</span>
          </button>

          <nav className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = currentPage === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    onNavigate(link.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold ${
                    isActive ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-mono">
            <span>SOL Price: ${solPriceUsd?.toFixed(2) || '—'}</span>
            <span className="text-emerald-600 font-bold">Devnet Active</span>
          </div>
        </div>
      )}
    </header>
  );
};
