import { Buffer } from "buffer";
import {
  PublicKey,
  Transaction,
  TransactionInstruction,
  SystemProgram,
  Keypair,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

// Official Pump.fun Program ID on Solana Mainnet & Devnet
export const PUMP_FUN_PROGRAM_ID = new PublicKey("6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P");

// Metaplex Token Metadata Program
export const MPL_TOKEN_METADATA_PROGRAM_ID = new PublicKey("metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s");

// Pump.fun Fee Recipient
export const PUMP_FEE_RECIPIENT = new PublicKey("CebN5WGQ4jvEPvsVU4EoHEpgzq1VV7AbicfhtW4xC9iM");

// Pump.fun Event Authority PDA
export const PUMP_EVENT_AUTHORITY = new PublicKey("Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1");

// Global PDA
export function getPumpGlobalPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("global")], PUMP_FUN_PROGRAM_ID);
  return pda;
}

// Mint Authority PDA
export function getPumpMintAuthorityPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("mint-authority")], PUMP_FUN_PROGRAM_ID);
  return pda;
}

// Bonding Curve PDA for a given token mint
export function getPumpBondingCurvePda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("bonding-curve"), mint.toBuffer()], PUMP_FUN_PROGRAM_ID);
  return pda;
}

// Event Authority PDA
export function getPumpEventAuthorityPda(): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync([Buffer.from("__event_authority")], PUMP_FUN_PROGRAM_ID);
  return pda;
}

// Metaplex Metadata PDA for a given token mint
export function getMetaplexMetadataPda(mint: PublicKey): PublicKey {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), MPL_TOKEN_METADATA_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    MPL_TOKEN_METADATA_PROGRAM_ID
  );
  return pda;
}

// Encode Pump.fun "create" instruction discriminator and data
// Anchor discriminator for "global:create" is [24, 30, 200, 40, 5, 28, 27, 119]
const CREATE_DISCRIMINATOR = Buffer.from([24, 30, 200, 40, 5, 28, 27, 119]);

// Anchor discriminator for "global:buy" is [102, 6, 61, 18, 1, 218, 235, 234]
const BUY_DISCRIMINATOR = Buffer.from([102, 6, 61, 18, 1, 218, 235, 234]);

// Anchor discriminator for "global:sell" is [51, 230, 133, 164, 1, 127, 131, 173]
const SELL_DISCRIMINATOR = Buffer.from([51, 230, 133, 164, 1, 127, 131, 173]);

function serializeString(str: string): Buffer {
  const strBuf = Buffer.from(str, "utf8");
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32LE(strBuf.length, 0);
  return Buffer.concat([lenBuf, strBuf]);
}

/**
 * Creates the real on-chain Pump.fun launch instruction
 */
export function createPumpLaunchInstruction(params: {
  mint: PublicKey;
  creator: PublicKey;
  name: string;
  symbol: string;
  uri: string;
}): TransactionInstruction {
  const { mint, creator, name, symbol, uri } = params;

  const bondingCurve = getPumpBondingCurvePda(mint);
  const associatedBondingCurve = getAssociatedTokenAddressSync(mint, bondingCurve, true);
  const globalPda = getPumpGlobalPda();
  const mplMetadata = getMetaplexMetadataPda(mint);
  const eventAuthority = getPumpEventAuthorityPda();

  const data = Buffer.concat([
    CREATE_DISCRIMINATOR,
    serializeString(name),
    serializeString(symbol),
    serializeString(uri),
  ]);

  const keys = [
    { pubkey: mint, isSigner: true, isWritable: true },
    { pubkey: getPumpMintAuthorityPda(), isSigner: false, isWritable: false },
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
    { pubkey: globalPda, isSigner: false, isWritable: false },
    { pubkey: MPL_TOKEN_METADATA_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: mplMetadata, isSigner: false, isWritable: true },
    { pubkey: creator, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: eventAuthority, isSigner: false, isWritable: false },
    { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: PUMP_FUN_PROGRAM_ID,
    keys,
    data,
  });
}

/**
 * Creates the real on-chain Pump.fun BUY instruction
 */
export function createPumpBuyInstruction(params: {
  mint: PublicKey;
  buyer: PublicKey;
  tokenAmount: bigint;
  maxSolCostLamports: bigint;
}): TransactionInstruction {
  const { mint, buyer, tokenAmount, maxSolCostLamports } = params;

  const bondingCurve = getPumpBondingCurvePda(mint);
  const associatedBondingCurve = getAssociatedTokenAddressSync(mint, bondingCurve, true);
  const associatedUser = getAssociatedTokenAddressSync(mint, buyer);
  const globalPda = getPumpGlobalPda();
  const eventAuthority = getPumpEventAuthorityPda();

  const data = Buffer.alloc(8 + 8 + 8);
  BUY_DISCRIMINATOR.copy(data, 0);
  data.writeBigUInt64LE(tokenAmount, 8);
  data.writeBigUInt64LE(maxSolCostLamports, 16);

  const keys = [
    { pubkey: globalPda, isSigner: false, isWritable: false },
    { pubkey: PUMP_FEE_RECIPIENT, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
    { pubkey: associatedUser, isSigner: false, isWritable: true },
    { pubkey: buyer, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    { pubkey: eventAuthority, isSigner: false, isWritable: false },
    { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: PUMP_FUN_PROGRAM_ID,
    keys,
    data,
  });
}

/**
 * Creates the real on-chain Pump.fun SELL instruction
 */
export function createPumpSellInstruction(params: {
  mint: PublicKey;
  seller: PublicKey;
  tokenAmount: bigint;
  minSolOutputLamports: bigint;
}): TransactionInstruction {
  const { mint, seller, tokenAmount, minSolOutputLamports } = params;

  const bondingCurve = getPumpBondingCurvePda(mint);
  const associatedBondingCurve = getAssociatedTokenAddressSync(mint, bondingCurve, true);
  const associatedUser = getAssociatedTokenAddressSync(mint, seller);
  const eventAuthority = getPumpEventAuthorityPda();

  const data = Buffer.alloc(8 + 8 + 8);
  SELL_DISCRIMINATOR.copy(data, 0);
  data.writeBigUInt64LE(tokenAmount, 8);
  data.writeBigUInt64LE(minSolOutputLamports, 16);

  const keys = [
    { pubkey: getPumpGlobalPda(), isSigner: false, isWritable: false },
    { pubkey: PUMP_FEE_RECIPIENT, isSigner: false, isWritable: true },
    { pubkey: mint, isSigner: false, isWritable: false },
    { pubkey: bondingCurve, isSigner: false, isWritable: true },
    { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
    { pubkey: associatedUser, isSigner: false, isWritable: true },
    { pubkey: seller, isSigner: true, isWritable: true },
    { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
    { pubkey: eventAuthority, isSigner: false, isWritable: false },
    { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false },
  ];

  return new TransactionInstruction({
    programId: PUMP_FUN_PROGRAM_ID,
    keys,
    data,
  });
}
