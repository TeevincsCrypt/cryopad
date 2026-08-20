import React from 'react';
import { Zap, ExternalLink, ShieldCheck, Activity, Terminal } from 'lucide-react';
import { useSolana } from '../solana/solanaContext';

export const Footer: React.FC = () => {
  const { network } = useSolana();

  return (
    <footer className="w-full border-t border-[#1F1F23] bg-[#070708] text-[#A1A1AA] text-xs py-10 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand & SVM */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Zap className="w-3.5 h-3.5 fill-emerald-400/20" />
              </div>
              <span className="font-extrabold text-white text-sm tracking-tight">SOLFORGE</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#141417] border border-[#26262B] text-emerald-400 font-mono">
                Solana SVM
              </span>
            </div>
            <p className="text-[#A1A1AA] text-xs leading-relaxed max-w-sm">
              The next-generation Solana token launchpad and fair-launch bonding curve protocol. Launch verified SPL tokens in seconds with zero seed liquidity requirements.
            </p>
            <div className="flex items-center gap-4 text-[11px] text-[#71717A] pt-1">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Network: Solana {network}
              </span>
              <span>TPS: ~2,940</span>
              <span>Slot: 284,192,042</span>
            </div>
          </div>

          {/* Col 2: Launchpad */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Launchpad</h4>
            <ul className="space-y-1.5 text-xs text-[#A1A1AA]">
              <li><span className="hover:text-white transition-colors cursor-pointer">Bonding Curve Specs</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Raydium Migration</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Fair Launch Protection</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer">Creator Royalties</span></li>
            </ul>
          </div>

          {/* Col 3: Ecosystem */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Ecosystem</h4>
            <ul className="space-y-1.5 text-xs text-[#A1A1AA]">
              <li>
                <a
                  href="https://explorer.solana.com/?cluster=devnet"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  Solana Explorer <ExternalLink className="w-3 h-3 text-[#71717A]" />
                </a>
              </li>
              <li>
                <a
                  href="https://raydium.io"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  Raydium DEX <ExternalLink className="w-3 h-3 text-[#71717A]" />
                </a>
              </li>
              <li>
                <a
                  href="https://solana.com/docs"
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  Solana Docs <ExternalLink className="w-3 h-3 text-[#71717A]" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div className="pt-6 border-t border-[#1F1F23] flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-[#71717A]">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Non-custodial fair launch protocol. Token contracts lock LP upon 100% curve completion.</span>
          </div>
          <div>
            © {new Date().getFullYear()} SolForge Protocol. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
};
