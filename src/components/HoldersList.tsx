import React, { useState } from 'react';
import { ExternalLink, Copy, Check, ShieldCheck, Crown } from 'lucide-react';
import { Holder } from '../types/token';
import { useSolana } from '../solana/solanaContext';

interface HoldersListProps {
  holders: Holder[];
}

export const HoldersList: React.FC<HoldersListProps> = ({ holders }) => {
  const { network } = useSolana();
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 2000);
  };

  return (
    <div className="w-full bg-[#121215] border border-[#26262B] rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-[#26262B]">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Top Token Holders</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-[#18181C] text-[#A1A1AA] border border-[#26262B]">
            {holders.length} accounts
          </span>
        </h3>
        <span className="text-xs text-[#71717A]">1B Max Fixed Supply</span>
      </div>

      <div className="space-y-3">
        {holders.map((holder) => (
          <div
            key={holder.address}
            className="p-3 rounded-xl bg-[#18181C] border border-[#26262B] hover:border-[#3A3A42] transition-colors space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[#71717A] text-[11px] w-4">
                  #{holder.rank}
                </span>

                <span className="font-mono text-white font-medium">
                  {holder.addressShort}
                </span>

                {holder.isBondingCurvePool && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-3 h-3" /> AMM Pool
                  </span>
                )}

                {holder.isCreator && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1 font-sans">
                    <Crown className="w-3 h-3" /> Creator
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(holder.address)}
                  className="text-[#71717A] hover:text-white transition-colors cursor-pointer"
                  title="Copy address"
                >
                  {copiedAddress === holder.address ? (
                    <Check className="w-3 h-3 text-emerald-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>

                <a
                  href={`https://explorer.solana.com/address/${holder.address}?cluster=${network}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#71717A] hover:text-emerald-400 transition-colors"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Percentage & Balance Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-[#A1A1AA]">
                <span>{Math.floor(holder.balance).toLocaleString()} tokens</span>
                <span className="font-bold text-neutral-200">{holder.percentage.toFixed(2)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-[#26262B] overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    holder.isBondingCurvePool ? 'bg-emerald-500' : 'bg-[#A1A1AA]'
                  }`}
                  style={{ width: `${Math.min(100, holder.percentage)}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
