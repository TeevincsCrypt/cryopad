import React from 'react';
import { Zap, ExternalLink, ShieldCheck } from 'lucide-react';
import { useSolana } from '../solana/solanaContext';

interface FooterProps {
  onNavigate?: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const { network } = useSolana();

  return (
    <footer className="w-full border-t border-slate-200 bg-white text-slate-600 text-xs py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & SVM */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
                <Zap className="w-3.5 h-3.5 fill-white" />
              </div>
              <span className="font-extrabold text-slate-900 text-sm tracking-tight">SWAGPAD</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-200 text-emerald-800 font-mono font-bold">
                Solana SVM
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed max-w-sm">
              The next-generation Solana token launchpad with multi-wallet bundling (up to 10 wallets) and fair-launch bonding curve protocols. Launch verified SPL tokens with instant atomic snipe bundles.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Network: Solana {network}
              </span>
              <span>TPS: ~3,120</span>
              <span>10-Wallet Bundle Engine</span>
            </div>
          </div>

          {/* Col 2: Launchpad */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Launchpad</h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li><button onClick={() => onNavigate?.('launch')} className="hover:text-emerald-700 transition-colors cursor-pointer">10-Wallet Bundler</button></li>
              <li><button onClick={() => onNavigate?.('explore')} className="hover:text-emerald-700 transition-colors cursor-pointer">Live Tokens</button></li>
              <li><button onClick={() => onNavigate?.('dashboard')} className="hover:text-emerald-700 transition-colors cursor-pointer">My Portfolio</button></li>
              <li><span className="hover:text-emerald-700 transition-colors cursor-pointer">Pump.fun Bonding Curve</span></li>
            </ul>
          </div>

          {/* Col 3: Ecosystem */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Ecosystem</h4>
            <ul className="space-y-1.5 text-xs text-slate-500">
              <li>
                <a
                  href="https://explorer.solana.com/?cluster=devnet"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-700 transition-colors"
                >
                  Solana Explorer <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://pump.fun"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-700 transition-colors"
                >
                  Pump.fun <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a
                  href="https://solana.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-emerald-700 transition-colors"
                >
                  Solana Docs <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Non-custodial fair launch protocol. Token contracts lock LP upon 100% curve completion.</span>
          </div>
          <div>
            © {new Date().getFullYear()} Swagpad Protocol. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
