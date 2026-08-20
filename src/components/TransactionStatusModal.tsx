import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, CheckCircle2, XCircle, ExternalLink, ShieldAlert, Cpu } from 'lucide-react';
import { useSolana } from '../solana/solanaContext';

export const TransactionStatusModal: React.FC = () => {
  const { activeTxStatus, activeTxDescription, recentSignatures, network } = useSolana();

  if (activeTxStatus === 'idle') return null;

  const latestSig = recentSignatures[0]?.sig;

  return (
    <AnimatePresence>
      <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="p-4 rounded-2xl bg-[#121215] border border-[#26262B] shadow-2xl backdrop-blur-xl text-[#E5E5E5] space-y-3"
        >
          {/* Header Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {activeTxStatus === 'preparing' && (
                <div className="w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center">
                  <Cpu className="w-3.5 h-3.5 animate-pulse" />
                </div>
              )}
              {activeTxStatus === 'awaiting_approval' && (
                <div className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              )}
              {activeTxStatus === 'processing' && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
              )}
              {activeTxStatus === 'confirmed' && (
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              )}
              {activeTxStatus === 'failed' && (
                <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
              )}

              <span className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
                {activeTxStatus === 'preparing' && '1. Preparing Transaction'}
                {activeTxStatus === 'awaiting_approval' && '2. Awaiting Approval'}
                {activeTxStatus === 'processing' && '3. Solana SVM Processing'}
                {activeTxStatus === 'confirmed' && 'Transaction Confirmed'}
                {activeTxStatus === 'failed' && 'Transaction Failed'}
              </span>
            </div>

            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#18181C] border border-[#26262B] text-[#71717A]">
              {network}
            </span>
          </div>

          {/* Description */}
          <p className="text-xs text-[#A1A1AA] font-medium line-clamp-2">
            {activeTxDescription}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-[#18181C] h-1 rounded-full overflow-hidden">
            <motion.div
              className={`h-full ${
                activeTxStatus === 'confirmed'
                  ? 'bg-emerald-500'
                  : activeTxStatus === 'failed'
                  ? 'bg-rose-500'
                  : 'bg-emerald-400'
              }`}
              initial={{ width: '10%' }}
              animate={{
                width:
                  activeTxStatus === 'preparing'
                    ? '30%'
                    : activeTxStatus === 'awaiting_approval'
                    ? '60%'
                    : activeTxStatus === 'processing'
                    ? '90%'
                    : '100%',
              }}
              transition={{ duration: 0.4 }}
            />
          </div>

          {/* Transaction Signature Link */}
          {activeTxStatus === 'confirmed' && latestSig && (
            <div className="pt-1 flex items-center justify-between text-[11px] text-[#71717A]">
              <span className="font-mono text-emerald-400/90 truncate max-w-[180px]">
                {latestSig.slice(0, 12)}...{latestSig.slice(-8)}
              </span>
              <a
                href={`https://explorer.solana.com/tx/${latestSig}?cluster=${network}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-neutral-300 hover:text-emerald-300 underline transition-colors"
              >
                Explorer <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
