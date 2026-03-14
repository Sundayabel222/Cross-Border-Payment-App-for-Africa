const router = require('express').Router();
const authMiddleware = require('../middleware/auth');
const { getWallet, getQRCode, getWalletTransactions } = require('../controllers/walletController');
const { getContacts, addContact, deleteContact } = require('../controllers/contactsController');

router.use(authMiddleware);

router.get('/balance', getWallet);
router.get('/qr', getQRCode);
router.get('/transactions', getWalletTransactions);
router.get('/contacts', getContacts);
router.post('/contacts', addContact);
router.delete('/contacts/:id', deleteContact);

module.exports = router;
