/**
 * OP_NET Wallet Copilot — Backend Server
 * 
 * This file connects to the real OP_NET network using the official SDK,
 * fetches live wallet data, and serves it to the frontend.
 * 
 * HOW IT WORKS (plain English):
 * - We create a "provider" — think of it as a phone line to the OP_NET network
 * - When someone enters a Bitcoin address, we ask OP_NET for their balance + tokens
 * - We send that data back to the browser as JSON
 * - The browser shows it in the beautiful UI we already built
 */

import express from 'express';
import cors from 'cors';
import { JSONRpcProvider } from 'opnet';
import { networks } from '@btc-vision/bitcoin';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─────────────────────────────────────────────────────────────────────────────
// OP_NET PROVIDER SETUP
// This is our connection to the OP_NET network.
// For now we use "testnet" — when OP_NET goes fully live, change to mainnet URL.
// ─────────────────────────────────────────────────────────────────────────────
const OPNET_RPC_URL = 'https://testnet.opnet.org'; // switch to mainnet when live
const network = networks.testnet;

let provider;
try {
  provider = new JSONRpcProvider(OPNET_RPC_URL, network);
  console.log('✅ OP_NET provider connected to:', OPNET_RPC_URL);
} catch (err) {
  console.error('❌ Failed to connect to OP_NET:', err.message);
}

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE: GET WALLET BALANCE
// Called when user enters a Bitcoin address in the UI
// Returns: BTC balance in satoshis, converted to BTC
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/balance/:address', async (req, res) => {
  const { address } = req.params;

  // Basic sanity check — Bitcoin addresses start with bc1, 1, 3, tb1, etc.
  if (!address || address.length < 26) {
    return res.status(400).json({ error: 'Invalid Bitcoin address' });
  }

  try {
    console.log(`📡 Fetching balance for: ${address}`);

    // This is the real OP_NET SDK call!
    // getBalance() returns the balance in satoshis (1 BTC = 100,000,000 satoshis)
    const balanceSatoshis = await provider.getBalance(address);

    // Convert satoshis → BTC (divide by 100 million)
    const balanceBTC = Number(balanceSatoshis) / 1e8;

    console.log(`✅ Balance: ${balanceBTC} BTC`);

    res.json({
      address,
      balanceSatoshis: balanceSatoshis.toString(),
      balanceBTC: balanceBTC.toFixed(8),
      network: 'testnet',
    });

  } catch (err) {
    console.error('❌ Balance fetch error:', err.message);
    res.status(500).json({
      error: 'Could not fetch balance from OP_NET',
      detail: err.message,
      // If OP_NET node is unavailable, return a graceful fallback
      fallback: true
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE: GET TRANSACTIONS
// Fetches recent transaction history for an address
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/transactions/:address', async (req, res) => {
  const { address } = req.params;

  try {
    console.log(`📡 Fetching transactions for: ${address}`);

    // Get recent transactions from OP_NET
    // The SDK returns full transaction objects including contract interactions
    const txList = await provider.getTransactionsByAddress(address, 0, 10);

    // Parse and clean up the data for the frontend
    const transactions = (txList || []).map(tx => ({
      txid: tx.hash || tx.id || 'unknown',
      type: detectTxType(tx),
      amount: tx.value ? (Number(tx.value) / 1e8).toFixed(8) : '0',
      timestamp: tx.blockTime || tx.timestamp || null,
      blockHeight: tx.blockHeight || tx.height || null,
      isContractCall: tx.isOPNET || tx.hasContractData || false,
      contractAddress: tx.contractAddress || null,
    }));

    res.json({ address, transactions, count: transactions.length });

  } catch (err) {
    console.error('❌ Transaction fetch error:', err.message);
    // Return empty array gracefully — don't crash the UI
    res.json({
      address,
      transactions: [],
      count: 0,
      error: err.message,
      fallback: true
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE: GET OP_20 TOKEN BALANCES
// Fetches which OP_20 tokens (like ERC-20 on Ethereum) this wallet holds
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/tokens/:address', async (req, res) => {
  const { address } = req.params;

  try {
    console.log(`📡 Fetching OP_20 tokens for: ${address}`);

    // Known OP_20 token contracts on OP_NET testnet
    // In a full version, you'd fetch the full token registry dynamically
    const KNOWN_TOKENS = [
      {
        address: 'tb1pexampletoken1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        symbol: 'MOTO',
        name: 'MotoToken',
        decimals: 8
      },
      // Add more tokens as the OP_NET ecosystem grows
    ];

    const tokenBalances = [];

    for (const token of KNOWN_TOKENS) {
      try {
        const { getContract, OP_20_ABI } = await import('opnet');
        const contract = getContract(token.address, OP_20_ABI, provider);
        const result = await contract.balanceOf(address);

        if (!('error' in result)) {
          const rawBalance = result.decoded?.[0] || 0n;
          const balance = Number(rawBalance) / Math.pow(10, token.decimals);

          if (balance > 0) {
            tokenBalances.push({
              ...token,
              balance: balance.toFixed(token.decimals),
              rawBalance: rawBalance.toString(),
            });
          }
        }
      } catch {
        // Skip tokens that error — don't block the whole response
      }
    }

    res.json({ address, tokens: tokenBalances, count: tokenBalances.length });

  } catch (err) {
    console.error('❌ Token fetch error:', err.message);
    res.json({ address, tokens: [], count: 0, error: err.message, fallback: true });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// API ROUTE: NETWORK STATUS
// Lets the UI show whether we're connected to OP_NET or not
// ─────────────────────────────────────────────────────────────────────────────
app.get('/api/status', async (req, res) => {
  try {
    const blockNumber = await provider.getBlockNumber();
    res.json({
      connected: true,
      network: 'testnet',
      latestBlock: blockNumber.toString(),
      rpcUrl: OPNET_RPC_URL,
    });
  } catch (err) {
    res.json({ connected: false, error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// HELPER: Detect transaction type from OP_NET tx object
// ─────────────────────────────────────────────────────────────────────────────
function detectTxType(tx) {
  if (tx.isOPNET || tx.hasContractData) return 'contract';
  if (tx.type === 'received' || (tx.outputs && tx.outputs.some(o => o.isOurs))) return 'receive';
  return 'send';
}

// Serve the main HTML app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n🚀 OP_NET Wallet Copilot running!`);
  console.log(`   Open your browser at: http://localhost:${PORT}`);
  console.log(`   API available at:     http://localhost:${PORT}/api/`);
  console.log(`   Network:              OP_NET Testnet\n`);
});
