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
  TrendingUp, 
  ExternalLink,
  Zap,
  Activity,
  Layers
} from 'lucide-react';
import { useSolana } from '../solana/solanaContext';
import { useTokenStore } from '../data/tokenStore';
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
  const { connected, publicKey, balance, walletName, network, setNetwork } = useSolana();
  const { solPriceUsd } = useTokenStore();
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
    <header className="sticky top-0 z-40 w-full border-b border-[#1F1F23] bg-[#0A0A0B]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Left: Brand Logo & Links */}
        <div className="flex items-center gap-8">
          <button
            onClick={() => onNavigate('home')}
            className="flex items-center gap-2.5 group text-left cursor-pointer"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-400 group-hover:bg-emerald-500/20 group-hover:border-emerald-400/40 transition-all">
              <Zap className="w-5 h-5 fill-emerald-400/20" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 font-extrabold tracking-tight text-white text-base leading-none">
                SOLFORGE
                <span className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-[#18181C] text-emerald-400 border border-[#26262B]">
                  SVM
                </span>
              </div>
              <span className="text-[10px] text-[#A1A1AA] font-medium tracking-wide">
                Solana Token Launchpad
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-[#1C1C21] text-white shadow-sm border border-[#2A2A30]'
                      : 'text-[#A1A1AA] hover:text-white hover:bg-[#141417]'
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
            className="w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#121215] border border-[#222227] hover:border-[#36363D] text-[#A1A1AA] text-xs transition-all group cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-[#71717A] group-hover:text-emerald-400 transition-colors" />
              <span>Search token name, symbol, or mint...</span>
            </div>
            <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-[#1C1C21] rounded border border-[#2A2A30] text-[#A1A1AA]">
              /
            </kbd>
          </button>
        </div>

        {/* Right: SOL Price, Network, Launch CTA, Wallet */}
        <div className="flex items-center gap-2.5">
          {/* Live SOL Price */}
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#121215] border border-[#222227] text-xs font-mono">
            <span className="text-[#71717A] font-sans text-[11px]">SOL</span>
            <span className="text-white font-medium">${solPriceUsd.toFixed(2)}</span>
            <span className="text-emerald-400 text-[10px] flex items-center">
              +3.4%
            </span>
          </div>

          {/* Network Switcher */}
          <div className="relative">
            <button
              onClick={() => setNetworkDropdownOpen(!networkDropdownOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#121215] hover:bg-[#18181C] border border-[#222227] hover:border-[#36363D] text-xs font-mono text-[#D4D4D8] transition-colors cursor-pointer"
            >
              <span className={`w-2 h-2 rounded-full ${network === 'devnet' ? 'bg-emerald-400 animate-pulse' : 'bg-blue-400'}`} />
              <span className="capitalize">{network}</span>
              <ChevronDown className="w-3 h-3 text-[#71717A]" />
            </button>

            {networkDropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-44 rounded-xl bg-[#141417] border border-[#2A2A30] p-1.5 shadow-2xl z-50 text-xs space-y-1"
                onMouseLeave={() => setNetworkDropdownOpen(false)}
              >
                <div className="px-2 py-1 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider">
                  Select Cluster
                </div>
                <button
                  onClick={() => {
                    setNetwork('devnet');
                    setNetworkDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    network === 'devnet' ? 'bg-emerald-500/15 text-emerald-400 font-semibold' : 'text-[#D4D4D8] hover:bg-[#1C1C21]'
                  }`}
                >
                  <span>Solana Devnet</span>
                  {network === 'devnet' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
                <button
                  onClick={() => {
                    setNetwork('mainnet-beta');
                    setNetworkDropdownOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer ${
                    network === 'mainnet-beta' ? 'bg-emerald-500/15 text-emerald-400 font-semibold' : 'text-[#D4D4D8] hover:bg-[#1C1C21]'
                  }`}
                >
                  <span>Mainnet Beta</span>
                  {network === 'mainnet-beta' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                </button>
              </div>
            )}
          </div>

          {/* Launch Token CTA */}
          <button
            onClick={() => onNavigate('launch')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-neutral-950 text-xs font-bold transition-all shadow-sm shadow-emerald-500/10 cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">Launch Token</span>
            <span className="sm:hidden">Launch</span>
          </button>

          {/* Wallet Button */}
          {connected && publicKey ? (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121215] hover:bg-[#18181C] border border-[#222227] hover:border-[#36363D] text-xs font-medium text-white transition-all cursor-pointer"
            >
              <div className="flex flex-col items-end leading-none">
                <span className="font-mono text-emerald-400 font-bold text-[11px]">
                  {balance.toFixed(2)} SOL
                </span>
                <span className="font-mono text-[10px] text-[#A1A1AA]">
                  {shortenAddress(publicKey, 4)}
                </span>
              </div>
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Wallet className="w-3.5 h-3.5" />
              </div>
            </button>
          ) : (
            <button
              onClick={onOpenWalletModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#18181C] hover:bg-[#222227] text-white text-xs font-semibold border border-[#2A2A30] transition-all cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-[#A1A1AA]" />
              <span>Connect</span>
            </button>
          )}

          {/* Mobile Menu Trigger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 md:hidden rounded-lg text-[#A1A1AA] hover:text-white hover:bg-[#18181C] transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1F1F23] bg-[#0E0E10] px-4 py-4 space-y-3">
          <button
            onClick={() => {
              handleSearchClick();
              setMobileMenuOpen(false);
            }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-[#141417] border border-[#222227] text-[#A1A1AA] text-xs"
          >
            <Search className="w-4 h-4 text-[#71717A]" />
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
                    isActive ? 'bg-[#1C1C21] text-white' : 'text-[#A1A1AA] hover:text-white hover:bg-[#141417]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="pt-3 border-t border-[#1F1F23] flex items-center justify-between text-xs text-[#A1A1AA] font-mono">
            <span>SOL Price: ${solPriceUsd.toFixed(2)}</span>
            <span className="text-emerald-400">Devnet Active</span>
          </div>
        </div>
      )}
    </header>
  );
};
