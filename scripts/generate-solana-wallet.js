// Script to generate a new Solana wallet for certificate minting
// Run with: node scripts/generate-solana-wallet.js

const { Keypair } = require("@solana/web3.js");

const keypair = Keypair.generate();

console.log("\n🔐 New Solana Wallet Generated!\n");
console.log("=".repeat(60));
console.log("\n📍 Public Key (Wallet Address):");
console.log(keypair.publicKey.toBase58());
console.log("\n🔑 Secret Key (Add to .env.local as SOLANA_WALLET_SECRET_KEY):");
console.log(Buffer.from(keypair.secretKey).toString("base64"));
console.log("\n" + "=".repeat(60));
console.log("\n⚠️  IMPORTANT:");
console.log("1. Save the secret key securely - it cannot be recovered!");
console.log("2. Add the secret key to your .env.local file");
console.log("3. Fund the wallet with SOL on devnet:");
console.log("   https://faucet.solana.com/");
console.log("\n💡 To fund your wallet, visit the faucet and paste your public key.");
console.log("   You'll need at least 0.01 SOL for transaction fees.\n");
