const db = require('../db');
const { getBalance, getTransactions } = require('../services/stellar');
const QRCode = require('qrcode');

async function getWallet(req, res, next) {
  try {
    const result = await db.query(
      'SELECT public_key FROM wallets WHERE user_id = $1',
      [req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Wallet not found' });

    const { public_key } = result.rows[0];
    const balances = await getBalance(public_key);

    res.json({ public_key, balances });
  } catch (err) {
    next(err);
  }
}

async function getQRCode(req, res, next) {
  try {
    const result = await db.query(
      'SELECT public_key FROM wallets WHERE user_id = $1',
      [req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Wallet not found' });

    const qrDataUrl = await QRCode.toDataURL(result.rows[0].public_key);
    res.json({ qr_code: qrDataUrl, public_key: result.rows[0].public_key });
  } catch (err) {
    next(err);
  }
}

async function getWalletTransactions(req, res, next) {
  try {
    const result = await db.query(
      'SELECT public_key FROM wallets WHERE user_id = $1',
      [req.user.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Wallet not found' });

    // Get from local DB first
    const txResult = await db.query(
      `SELECT * FROM transactions
       WHERE sender_wallet = $1 OR recipient_wallet = $1
       ORDER BY created_at DESC LIMIT 50`,
      [result.rows[0].public_key]
    );

    res.json({ transactions: txResult.rows });
  } catch (err) {
    next(err);
  }
}

module.exports = { getWallet, getQRCode, getWalletTransactions };
