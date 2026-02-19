import { Connection, PublicKey, Keypair, Transaction, SystemProgram } from '@solana/web3.js';
import { getAssociatedTokenAddress, createAssociatedTokenAccountInstruction, createTransferCheckedInstruction, getMint, getAccount } from '@solana/spl-token';
import bs58 from 'bs58';

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
const GBUX_MINT = new PublicKey(process.env.GBUX_TOKEN_ADDRESS);
const GRENCH_PUBKEY = new PublicKey(process.env.GRENCH_WALLET_ADDRESS);
const CROSSMINT_API_KEY = process.env.CROSSMINT_API_KEY;
const CROSSMINT_BASE = 'https://www.crossmint.com/api/v1-alpha2';

let grenchKeypair = null;
try {
  const privKey = process.env.GRENCH_WALLET_PRIVATE_KEY;
  if (privKey) {
    const trimmed = privKey.trim();
    if (trimmed.startsWith('[') || trimmed.includes(',')) {
      const bytes = JSON.parse(privKey);
      grenchKeypair = Keypair.fromSecretKey(new Uint8Array(bytes));
    } else {
      let decoded = null;
      try {
        decoded = bs58.decode(trimmed);
      } catch {
        try {
          decoded = new Uint8Array(Buffer.from(trimmed, 'base64'));
        } catch {
          if (/^[0-9a-fA-F]+$/.test(trimmed)) {
            decoded = new Uint8Array(Buffer.from(trimmed, 'hex'));
          }
        }
      }
      if (decoded) {
        if (decoded.length === 64) {
          grenchKeypair = Keypair.fromSecretKey(decoded);
        } else if (decoded.length === 32) {
          grenchKeypair = Keypair.fromSeed(decoded);
        } else if (decoded.length > 64) {
          grenchKeypair = Keypair.fromSecretKey(decoded.slice(0, 64));
        } else if (decoded.length > 32 && decoded.length < 64) {
          grenchKeypair = Keypair.fromSeed(decoded.slice(0, 32));
          console.warn(`[GBuX] Key was ${decoded.length} bytes, used first 32 as seed`);
        } else {
          console.error(`[GBuX] Decoded key is ${decoded.length} bytes, expected 32 or 64`);
        }
      }
    }
    console.log('[GBuX] GRENCH keypair loaded, pubkey:', grenchKeypair.publicKey.toBase58());
  }
} catch (e) {
  console.error('[GBuX] Failed to load GRENCH keypair:', e.message);
  console.error('[GBuX] Key should be base58-encoded private key, JSON byte array, or base64');
}

const connection = new Connection(RPC_URL, 'confirmed');

let gbuxDecimals = null;
async function getGbuxDecimals() {
  if (gbuxDecimals !== null) return gbuxDecimals;
  try {
    const mint = await getMint(connection, GBUX_MINT);
    gbuxDecimals = mint.decimals;
    return gbuxDecimals;
  } catch (e) {
    console.error('[GBuX] Failed to get mint decimals:', e.message);
    return 9;
  }
}

const PRICING = {
  starter: { usdPrice: 10, gbuxAmount: 1000, label: 'Starter Pack', features: ['Account creation', '3 AI game generations', '1 deployment'] },
  creator: { usdPrice: 25, gbuxAmount: 3000, label: 'Creator Pack', features: ['10 AI game generations', '5 deployments', 'AI editor access', 'Priority generation'] },
  studio: { usdPrice: 50, gbuxAmount: 7500, label: 'Studio Pack', features: ['Unlimited AI generations', 'Unlimited deployments', 'AI editor access', 'Custom themes', 'Priority support'] },
};

const FEATURE_COSTS = {
  ai_generation: 100,
  deployment: 200,
  ai_editor_session: 50,
  image_generation: 75,
  custom_theme: 150,
};

export async function createCrossmintWallet(userId) {
  try {
    const res = await fetch(`${CROSSMINT_BASE}/wallets`, {
      method: 'POST',
      headers: {
        'X-API-KEY': CROSSMINT_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'solana-custodial-wallet',
        linkedUser: `userid:${userId}`,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Crossmint wallet creation failed: ${err}`);
    }
    return await res.json();
  } catch (e) {
    console.error('[GBuX] Crossmint wallet error:', e.message);
    throw e;
  }
}

export async function getCrossmintWallet(userId) {
  try {
    const res = await fetch(`${CROSSMINT_BASE}/wallets?linkedUser=userid:${userId}`, {
      headers: {
        'X-API-KEY': CROSSMINT_API_KEY,
        'Content-Type': 'application/json',
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) return data[0];
    if (data.address) return data;
    return null;
  } catch (e) {
    console.error('[GBuX] Get wallet error:', e.message);
    return null;
  }
}

export async function getGbuxBalance(walletAddress) {
  try {
    const pubkey = new PublicKey(walletAddress);
    const ata = await getAssociatedTokenAddress(GBUX_MINT, pubkey);
    const account = await getAccount(connection, ata);
    const decimals = await getGbuxDecimals();
    return Number(account.amount) / Math.pow(10, decimals);
  } catch (e) {
    if (e.message?.includes('could not find account') || e.name === 'TokenAccountNotFoundError') {
      return 0;
    }
    console.error('[GBuX] Balance check error:', e.message);
    return 0;
  }
}

export async function getAdminBalance() {
  try {
    const gbux = await getGbuxBalance(GRENCH_PUBKEY.toBase58());
    const solBalance = await connection.getBalance(GRENCH_PUBKEY);
    return {
      gbux,
      sol: solBalance / 1e9,
      address: GRENCH_PUBKEY.toBase58(),
    };
  } catch (e) {
    console.error('[GBuX] Admin balance error:', e.message);
    return { gbux: 0, sol: 0, address: GRENCH_PUBKEY.toBase58() };
  }
}

export async function transferGbux(recipientAddress, amount) {
  if (!grenchKeypair) throw new Error('Admin wallet not configured');

  const decimals = await getGbuxDecimals();
  const rawAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
  const recipientPubkey = new PublicKey(recipientAddress);

  const senderAta = await getAssociatedTokenAddress(GBUX_MINT, GRENCH_PUBKEY);
  const recipientAta = await getAssociatedTokenAddress(GBUX_MINT, recipientPubkey);

  const transaction = new Transaction();

  try {
    await getAccount(connection, recipientAta);
  } catch (e) {
    transaction.add(
      createAssociatedTokenAccountInstruction(
        GRENCH_PUBKEY,
        recipientAta,
        recipientPubkey,
        GBUX_MINT
      )
    );
  }

  transaction.add(
    createTransferCheckedInstruction(
      senderAta,
      GBUX_MINT,
      recipientAta,
      GRENCH_PUBKEY,
      rawAmount,
      decimals
    )
  );

  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = GRENCH_PUBKEY;

  transaction.sign(grenchKeypair);

  const signature = await connection.sendRawTransaction(transaction.serialize());
  await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

  return signature;
}

export async function checkFeatureAccess(walletAddress, feature) {
  const balance = await getGbuxBalance(walletAddress);
  const cost = FEATURE_COSTS[feature] || 0;
  return {
    hasAccess: balance >= cost,
    balance,
    cost,
    feature,
  };
}

export async function deductFeatureCost(walletAddress, feature) {
  const cost = FEATURE_COSTS[feature];
  if (!cost) throw new Error(`Unknown feature: ${feature}`);

  const balance = await getGbuxBalance(walletAddress);
  if (balance < cost) {
    throw new Error(`Insufficient GBuX. Need ${cost}, have ${balance}`);
  }

  return { success: true, cost, remaining: balance - cost };
}

export { PRICING, FEATURE_COSTS, GBUX_MINT, GRENCH_PUBKEY };
