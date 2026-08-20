import express from "express";
import cors from "cors";
import path from "path";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// In-memory token metadata and token store with on-chain cache
interface TokenMetadataRecord {
  mint: string;
  name: string;
  symbol: string;
  description: string;
  image: string;
  metadataUri: string;
  creator: string;
  createdAt: number;
  twitter?: string;
  telegram?: string;
  website?: string;
  txSignature?: string;
  initialBuySol?: number;
  network?: string;
  pumpFunUrl?: string;
}

const tokenMetadataRegistry: Map<string, TokenMetadataRecord> = new Map();

// Helper to extract clean Pinata gateway URL
function getPinataGatewayUrl(ipfsHash: string): string {
  const gateway = process.env.PINATA_GATEWAY || "ipfs.io";
  const cleanGateway = gateway.replace(/^https?:\/\//, "").replace(/\/$/, "");
  return `https://${cleanGateway}/ipfs/${ipfsHash}`;
}

// Real decentralized metadata generation & Pinata IPFS storage API
app.post("/api/metadata/upload", async (req, res) => {
  try {
    const {
      name,
      symbol,
      description,
      image,
      imageBase64,
      imageMimeType,
      twitter,
      telegram,
      website,
      creator,
    } = req.body;

    if (!name || !symbol || !description) {
      return res.status(400).json({ error: "Missing required token metadata fields (name, symbol, description)" });
    }

    let finalImageUri = image || "";

    // 1. If an image is provided as base64 data URL or raw base64, upload image binary to Pinata IPFS
    if (process.env.PINATA_JWT && (imageBase64 || (image && image.startsWith("data:image/")))) {
      try {
        let base64Data = imageBase64;
        let mimeType = imageMimeType || "image/png";

        if (image && image.startsWith("data:image/")) {
          const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
          if (matches && matches.length === 3) {
            mimeType = matches[1];
            base64Data = matches[2];
          }
        }

        if (base64Data) {
          const imageBuffer = Buffer.from(base64Data, "base64");
          const ext = mimeType.split("/")[1] || "png";
          const blob = new Blob([imageBuffer], { type: mimeType });
          const form = new FormData();
          form.append("file", blob, `${symbol.toLowerCase()}-logo.${ext}`);

          const pinImgRes = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.PINATA_JWT}`,
            },
            body: form,
          });

          if (pinImgRes.ok) {
            const imgData = (await pinImgRes.json()) as { IpfsHash: string };
            finalImageUri = getPinataGatewayUrl(imgData.IpfsHash);
          }
        }
      } catch (imgErr) {
        console.warn("Failed to pin image binary to Pinata, using fallback URI:", imgErr);
      }
    }

    // 2. Prepare official standard Pump.fun Token Metadata format
    const metadataPayload = {
      name: name.trim(),
      symbol: symbol.trim().toUpperCase(),
      description: description.trim(),
      image: finalImageUri,
      showName: true,
      createdOn: "https://pump.fun",
      twitter: twitter ? twitter.trim() : "",
      telegram: telegram ? telegram.trim() : "",
      website: website ? website.trim() : "",
      attributes: [],
    };

    // 3. Pin metadata JSON to Pinata IPFS
    let metadataUri = "";
    if (process.env.PINATA_JWT) {
      try {
        const pinataRes = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.PINATA_JWT}`,
          },
          body: JSON.stringify({
            pinataContent: metadataPayload,
            pinataMetadata: { name: `${symbol}-pump-metadata.json` },
          }),
        });

        if (pinataRes.ok) {
          const pinData = (await pinataRes.json()) as { IpfsHash: string };
          metadataUri = getPinataGatewayUrl(pinData.IpfsHash);
        } else {
          const errText = await pinataRes.text();
          console.error("Pinata metadata pin failed:", pinataRes.status, errText);
        }
      } catch (pinErr) {
        console.warn("Pinata upload error:", pinErr);
      }
    }

    if (!metadataUri) {
      throw new Error("Failed to pin metadata to Pinata IPFS. Please verify PINATA_JWT configuration.");
    }

    const metadataId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    res.json({
      success: true,
      metadataUri,
      imageUri: finalImageUri,
      metadataId,
      metadata: metadataPayload,
    });
  } catch (error: any) {
    console.error("Error creating metadata:", error);
    res.status(500).json({ error: error.message || "Failed to create token metadata" });
  }
});

// Serve metadata JSON by ID (fallback / decentralized mirror)
app.get("/api/metadata/:id", (req, res) => {
  const meta = tokenMetadataRegistry.get(req.params.id);
  if (!meta) {
    return res.status(404).json({ error: "Token metadata not found" });
  }

  res.json({
    name: meta.name,
    symbol: meta.symbol,
    description: meta.description,
    image: meta.image,
    showName: true,
    createdOn: "https://pump.fun",
    twitter: meta.twitter || "",
    telegram: meta.telegram || "",
    website: meta.website || "",
    attributes: [],
  });
});

// Record confirmed launched token
app.post("/api/tokens/record", (req, res) => {
  try {
    const {
      mint,
      name,
      symbol,
      description,
      image,
      metadataUri,
      creator,
      txSignature,
      initialBuySol,
      network,
    } = req.body;

    if (!mint) {
      return res.status(400).json({ error: "Missing mint address" });
    }

    const record: TokenMetadataRecord = {
      mint,
      name: name || "Unknown Token",
      symbol: symbol || "TOKEN",
      description: description || "",
      image: image || "",
      metadataUri: metadataUri || "",
      creator: creator || "",
      createdAt: Date.now(),
      txSignature: txSignature || "",
      initialBuySol: initialBuySol ? Number(initialBuySol) : 0,
      network: network || (process.env.VITE_SOLANA_NETWORK || "devnet"),
      pumpFunUrl: `https://pump.fun/coin/${mint}`,
    };

    tokenMetadataRegistry.set(mint, record);

    res.json({ success: true, token: record });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all recorded launched tokens
app.get("/api/tokens", (_req, res) => {
  const list = Array.from(tokenMetadataRegistry.values());
  res.json({ success: true, tokens: list });
});

// Proxy for DexScreener/Pump token queries (to bypass browser CORS and keep queries reliable)
app.get("/api/pump/tokens/latest", async (req, res) => {
  try {
    const network = (req.query.network as string) || "mainnet";
    const solanaRpc = process.env.VITE_SOLANA_RPC_URL || (network === "devnet" ? "https://api.devnet.solana.com" : "https://api.mainnet-beta.solana.com");
    
    // Fetch live Pump.fun / Solana tokens from DexScreener token profiles / latest Solana boost pairs
    const dexRes = await fetch("https://api.dexscreener.com/token-profiles/latest/v1", {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!dexRes.ok) {
      return res.json({ success: false, tokens: [] });
    }

    const profiles = (await dexRes.json()) as any[];
    const solanaProfiles = (profiles || []).filter((p) => p.chainId === "solana").slice(0, 30);

    res.json({
      success: true,
      network,
      rpc: solanaRpc,
      tokens: solanaProfiles,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to query real tokens" });
  }
});

// Proxy for live token pairs & candlestick data
app.get("/api/pump/token/:mint", async (req, res) => {
  try {
    const { mint } = req.params;
    const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    if (!response.ok) {
      return res.status(404).json({ error: "Token not found on Solana indexer" });
    }
    const data = await response.json();
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// App configuration endpoint
app.get("/api/config", (_req, res) => {
  res.json({
    minLaunchBalanceSol: parseFloat(process.env.VITE_MIN_LAUNCH_BALANCE_SOL || "15.0"),
    network: process.env.VITE_SOLANA_NETWORK || "devnet",
    rpcUrl: process.env.VITE_SOLANA_RPC_URL || "https://api.devnet.solana.com",
    platformCreationFeeSol: 0,
    pumpFunProgramId: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
  });
});

async function start() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Express 5 wildcard
    app.get("*all", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Solana Launchpad Server running on port ${PORT}`);
  });
}

start();
