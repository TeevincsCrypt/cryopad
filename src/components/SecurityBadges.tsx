import React from 'react';
import { ShieldCheck, Lock, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';

interface SecurityBadgesProps {
  revokeMint?: boolean;
  revokeFreeze?: boolean;
  revokeUpdate?: boolean;
  securityScore?: number;
  compact?: boolean;
}

export const SecurityBadges: React.FC<SecurityBadgesProps> = ({
  revokeMint = true,
  revokeFreeze = true,
  revokeUpdate = true,
  securityScore,
  compact = false,
}) => {
  const score =
    securityScore !== undefined
      ? securityScore
      : [revokeMint, revokeFreeze, revokeUpdate].filter(Boolean).length * 33 + (revokeMint && revokeFreeze && revokeUpdate ? 1 : 0);

  const isFullTrust = revokeMint && revokeFreeze && revokeUpdate;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 flex-wrap">
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold font-mono ${
            isFullTrust
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
              : 'bg-amber-100 text-amber-800 border border-amber-300'
          }`}
          title={`Trust Score: ${score}/100`}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          {score}% Trust
        </span>

        {revokeMint && (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="Mint Authority Revoked: Fixed Supply"
          >
            <Lock className="w-2.5 h-2.5" /> Mint Revoked
          </span>
        )}

        {revokeFreeze && (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="Freeze Authority Revoked: Cannot Blacklist"
          >
            <Ban className="w-2.5 h-2.5" /> Unfreezable
          </span>
        )}

        {revokeUpdate && (
          <span
            className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
            title="Update Authority Revoked: Immutable Metadata"
          >
            <CheckCircle2 className="w-2.5 h-2.5" /> Immutable
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className={`w-5 h-5 ${isFullTrust ? 'text-emerald-600' : 'text-amber-500'}`} />
          <div>
            <h4 className="text-xs font-bold text-slate-900">Security & Trust Verification</h4>
            <p className="text-[11px] text-slate-500">Verified on-chain SPL token authorities</p>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold font-mono ${
              isFullTrust
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-800 border border-amber-300'
            }`}
          >
            {score}% Trust Score
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
        {/* 1. Revoke Update */}
        <div
          className={`p-2.5 rounded-lg border flex items-start gap-2 ${
            revokeUpdate
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          {revokeUpdate ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block text-[11px]">Revoke Update</span>
            <span className="text-[10px] text-slate-600">
              {revokeUpdate ? 'Immutable Metadata' : 'Mutable by creator'}
            </span>
          </div>
        </div>

        {/* 2. Revoke Mint */}
        <div
          className={`p-2.5 rounded-lg border flex items-start gap-2 ${
            revokeMint
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          {revokeMint ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block text-[11px]">Revoke Mint</span>
            <span className="text-[10px] text-slate-600">
              {revokeMint ? 'Fixed 1B Supply' : 'Mintable'}
            </span>
          </div>
        </div>

        {/* 3. Revoke Freeze */}
        <div
          className={`p-2.5 rounded-lg border flex items-start gap-2 ${
            revokeFreeze
              ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}
        >
          {revokeFreeze ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          )}
          <div>
            <span className="font-bold block text-[11px]">Revoke Freeze</span>
            <span className="text-[10px] text-slate-600">
              {revokeFreeze ? 'Unfreezable' : 'Can freeze holders'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
