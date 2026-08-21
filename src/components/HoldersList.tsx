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
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <span>Top Token Holders</span>
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold">
            {holders.length} accounts
          </span>
        </h3>
        <span className="text-xs text-slate-500 font-semibold">1B Max Fixed Supply</span>
      </div>

      <div className="space-y-3">
        {holders.map((holder) => (
          <div
            key={holder.address}
            className="p-3 rounded-xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-colors space-y-2"
          >
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-mono text-slate-400 text-[11px] w-4 font-bold">
                  #{holder.rank}
                </span>

                <span className="font-mono text-slate-900 font-bold">
                  {holder.addressShort}
                </span>

                {holder.isBondingCurvePool && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1 font-sans font-bold">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> AMM Pool
                  </span>
                )}

                {holder.isCreator && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1 font-sans font-bold">
                    <Crown className="w-3 h-3 text-amber-600" /> Creator
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(holder.address)}
                  className="text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
                  title="Copy address"
                >
                  {copiedAddress === holder.address ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>

                <a
                  href={`https://explorer.solana.com/address/${holder.address}?cluster=${network}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-slate-400 hover:text-emerald-700 transition-colors font-bold"
                  title="View on Explorer"
                >
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Percentage & Balance Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] font-mono text-slate-500">
                <span>{Math.floor(holder.balance).toLocaleString()} tokens</span>
                <span className="font-bold text-slate-900">{holder.percentage.toFixed(2)}%</span>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    holder.isBondingCurvePool ? 'bg-emerald-600' : 'bg-slate-400'
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
