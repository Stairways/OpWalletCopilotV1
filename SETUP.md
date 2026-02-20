# 🚀 OP_NET Wallet Copilot — Setup Guide
## Written for beginners — no coding experience needed!

---

## What you've built
A Wallet Copilot app that connects to the real OP_NET network on Bitcoin Layer 1.
It shows live BTC balances, OP_20 token holdings, and transaction history — all
cryptographically verified by OP_NET.

---

## STEP 1: Install the tools you need (one time only)

### Install Node.js v22
This is the engine that runs your app.
→ Go to: https://nodejs.org
→ Download "v22 LTS" (the left button)
→ Install it (just click Next through the installer)

To check it worked, open a "Terminal" (Mac/Linux) or "Command Prompt" (Windows):
```
node --version
```
You should see something like: v22.x.x

---

## STEP 2: Download your project files

You have two options:

**Option A — Copy from this folder**
Take the entire `opnet-wallet-copilot` folder and put it somewhere you'll find it,
like your Desktop or Documents.

**Option B — Use GitHub (recommended for competition)**
1. Create a free account at https://github.com
2. Create a new repository called "opnet-wallet-copilot"
3. Upload all these files to it

---

## STEP 3: Install the OP_NET packages

Open Terminal / Command Prompt, then navigate to your project folder:
```
cd Desktop/opnet-wallet-copilot
```
(adjust the path to wherever you saved the folder)

Then run:
```
npm install
```

This downloads the OP_NET SDK and all the tools the project needs.
It might take 1-2 minutes. You'll see a "node_modules" folder appear — that's normal!

---

## STEP 4: Run the app!

Still in Terminal, run:
```
npm start
```

You'll see:
```
🚀 OP_NET Wallet Copilot running!
   Open your browser at: http://localhost:3000
```

Open your browser and go to: **http://localhost:3000**

Your app is now live and connected to OP_NET testnet! 🎉

---

## STEP 5: Test it with a real address

Use the "Demo" button to load a sample testnet address, OR
enter any Bitcoin testnet address (starts with tb1p).

You can get a testnet address from OP_NET's Discord or docs:
→ https://docs.opnet.org

---

## STEP 6: Deploy to the internet (show the world!)

We'll use **Vercel** — it's free and takes 5 minutes.

1. Go to https://vercel.com and sign up (use your GitHub account)
2. Click "Add New Project"
3. Connect your GitHub repo
4. Vercel will detect it automatically and deploy it!
5. You'll get a live URL like: https://opnet-wallet-copilot.vercel.app

⚠️ One extra step for Vercel: you need to tell Vercel to run the server.
Add a file called `vercel.json` in your project root with this content:
```json
{
  "version": 2,
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```

---

## HOW THE APP WORKS (plain English)

```
Your Browser (the UI)
       ↕  asks for wallet data
Your Server (server.js)
       ↕  fetches live data using the OP_NET SDK
OP_NET Testnet (opnet.org nodes)
       ↕  reads from
Bitcoin Blockchain (the source of truth)
```

1. User enters a Bitcoin address in the browser
2. The browser asks your server: "what's the balance for this address?"
3. Your server asks OP_NET's nodes using the official SDK
4. OP_NET returns the data with cryptographic proof
5. Your server sends it to the browser
6. The browser displays it in the beautiful UI

---

## TROUBLESHOOTING

**"npm: command not found"**
→ Node.js didn't install correctly. Try reinstalling from nodejs.org

**"Cannot connect to OP_NET"**
→ OP_NET testnet might be temporarily down. Try again in a few minutes.
→ Check https://opnet.org for status updates.

**"Address has no data"**
→ The address hasn't been used on OP_NET testnet yet.
→ Try the Demo button to use a known active address.

**The app works but shows no real data**
→ OP_NET is still in testnet phase. Real mainnet data will be available when
   OP_NET officially launches on Bitcoin mainnet.

---

## NEXT STEPS (building the DeFi Dashboard)

Once this is working, we'll build the DeFi Position Dashboard which will:
- Show liquidity pool positions (what you've staked on OP_NET DEXes)
- Show estimated earnings / yields
- Show impermanent loss calculations
- Use the same server.js pattern but with different API routes

---

## Questions?
- OP_NET Discord: https://discord.gg/opnet
- OP_NET Docs: https://docs.opnet.org
- OP_NET GitHub: https://github.com/btc-vision

Good luck in the competition! 🏆
