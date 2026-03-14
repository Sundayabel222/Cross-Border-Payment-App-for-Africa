const { v4: uuidv4 } = require('uuid');
const db = require('../db');

async function getContacts(req, res, next) {
  try {
    const result = await db.query(
      'SELECT id, name, wallet_address, created_at FROM contacts WHERE user_id = $1 ORDER BY name',
      [req.user.userId]
    );
    res.json({ contacts: result.rows });
  } catch (err) { next(err); }
}

async function addContact(req, res, next) {
  try {
    const { name, wallet_address } = req.body;
    const id = uuidv4();
    await db.query(
      'INSERT INTO contacts (id, user_id, name, wallet_address) VALUES ($1,$2,$3,$4) ON CONFLICT (user_id, wallet_address) DO UPDATE SET name = $3',
      [id, req.user.userId, name, wallet_address]
    );
    res.status(201).json({ message: 'Contact saved', contact: { id, name, wallet_address } });
  } catch (err) { next(err); }
}

async function deleteContact(req, res, next) {
  try {
    await db.query('DELETE FROM contacts WHERE id = $1 AND user_id = $2', [req.params.id, req.user.userId]);
    res.json({ message: 'Contact deleted' });
  } catch (err) { next(err); }
}

module.exports = { getContacts, addContact, deleteContact };
