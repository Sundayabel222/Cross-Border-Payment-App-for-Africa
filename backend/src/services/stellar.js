const StellarSdk = require('@stellar/stellar-sdk');
const crypto = require('crypto');

const isTestnet = process.env.STELLAR_NETWORK !== 'mainnet';
const server = new StellarSdk.Horizon.Server(
  process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org'
);
const networkPassphrase = isTestnet
  ? StellarSdk.Networks.TESTNET
  : StellarSdk.Networks.PUBLIC;

// Encrypt private key before storing
function encryptPrivateKey(secretKey) {
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  const encrypted = Buffer.concat([cipher.update(secretKey, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decryptPrivateKey(encryptedKey) {
  const [ivHex, encryptedHex] = encryptedKey.split(':');
  const key = Buffer.from(process.env.ENCRYPTION_KEY, 'utf8').slice(0, 32);
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}

// Generate a new Stellar keypair
async function createWallet() {
  const keypair = StellarSdk.Keypair.random();
  const publicKey = keypair.publicKey();
  const secretKey = keypair.secret();

  // Fund account on testnet via Friendbot
  if (isTestnet) {
    try {
      await fetch(`https://friendbot.stellar.org?addr=${publicKey}`);
    } catch (e) {
      console.warn('Friendbot funding failed:', e.message);
    }
  }

  return {
    publicKey,
    encryptedSecretKey: encryptPrivateKey(secretKey)
  };
}

// Get account balance
async function getBalance(publicKey) {
  try {
    const account = await server.loadAccount(publicKey);
    return account.balances.map(b => ({
      asset: b.asset_type === 'native' ? 'XLM' : b.asset_code,
      balance: b.balance
    }));
  } catch (e) {
    if (e.response?.status === 404) return [];
    throw e;
  }
}

// Send payment
async function sendPayment({ senderPublicKey, encryptedSecretKey, recipientPublicKey, amount, asset = 'XLM', memo }) {
  const secretKey = decryptPrivateKey(encryptedSecretKey);
  const senderKeypair = StellarSdk.Keypair.fromSecret(secretKey);

  const senderAccount = await server.loadAccount(senderPublicKey);

  const assetObj = asset === 'XLM'
    ? StellarSdk.Asset.native()
    : new StellarSdk.Asset(asset, process.env[`${asset}_ISSUER`]);

  const txBuilder = new StellarSdk.TransactionBuilder(senderAccount, {
    fee: await server.fetchBaseFee(),
    networkPassphrase
  })
    .addOperation(StellarSdk.Operation.payment({
      destination: recipientPublicKey,
      asset: assetObj,
      amount: String(amount)
    }))
    .setTimeout(30);

  if (memo) txBuilder.addMemo(StellarSdk.Memo.text(memo.slice(0, 28)));

  const transaction = txBuilder.build();
  transaction.sign(senderKeypair);

  const result = await server.submitTransaction(transaction);
  return {
    transactionHash: result.hash,
    ledger: result.ledger
  };
}

// Fetch recent transactions for an account
async function getTransactions(publicKey, limit = 20) {
  try {
    const records = await server
      .transactions()
      .forAccount(publicKey)
      .limit(limit)
      .order('desc')
      .call();
    return records.records.map(tx => ({
      id: tx.id,
      hash: tx.hash,
      createdAt: tx.created_at,
      memo: tx.memo,
      successful: tx.successful
    }));
  } catch (e) {
    return [];
  }
}

module.exports = { createWallet, getBalance, sendPayment, getTransactions, decryptPrivateKey };
