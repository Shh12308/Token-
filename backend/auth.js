const crypto = require('node:crypto');
const argon2 = require('argon2');
const { pool } = require('./db');

const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function normalizeEmail(value) {
  if (typeof value !== 'string') return null;
  const email = value.trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return null;
  }
  return email;
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function register(emailInput, password) {
  const email = normalizeEmail(emailInput);

  if (!email) {
    return { ok: false, status: 400, error: 'Enter a valid email address' };
  }

  if (typeof password !== 'string' || password.length < 12 || password.length > 128) {
    return { ok: false, status: 400, error: 'Password must be between 12 and 128 characters' };
  }

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19456,
    timeCost: 2,
    parallelism: 1
  });

  try {
    const result = await pool.query(
      'INSERT INTO customers (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    return { ok: true, customer: result.rows[0] };
  } catch (error) {
    if (error.code === '23505') {
      return { ok: false, status: 409, error: 'An account with this email may already exist' };
    }
    throw error;
  }
}

async function login(emailInput, password) {
  const email = normalizeEmail(emailInput);

  if (!email || typeof password !== 'string' || password.length > 128) {
    return { ok: false, status: 401, error: 'Invalid email or password' };
  }

  const result = await pool.query(
    'SELECT id, email, password_hash FROM customers WHERE email = $1',
    [email]
  );

  const customer = result.rows[0];

  if (!customer) {
    return { ok: false, status: 401, error: 'Invalid email or password' };
  }

  const valid = await argon2.verify(customer.password_hash, password).catch(() => false);

  if (!valid) {
    return { ok: false, status: 401, error: 'Invalid email or password' };
  }

  const token = crypto.randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await pool.query(
    'INSERT INTO customer_sessions (customer_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [customer.id, hashToken(token), expiresAt]
  );

  return {
    ok: true,
    token,
    expiresAt: expiresAt.toISOString(),
    customer: { id: customer.id, email: customer.email }
  };
}

async function authenticate(token) {
  if (typeof token !== 'string' || token.length < 40 || token.length > 200) {
    return null;
  }

  const result = await pool.query(
    `SELECT c.id, c.email
       FROM customer_sessions s
       JOIN customers c ON c.id = s.customer_id
      WHERE s.token_hash = $1 AND s.expires_at > NOW()`,
    [hashToken(token)]
  );

  return result.rows[0] || null;
}

async function logout(token) {
  if (typeof token !== 'string' || token.length < 40 || token.length > 200) {
    return;
  }

  await pool.query(
    'DELETE FROM customer_sessions WHERE token_hash = $1',
    [hashToken(token)]
  );
}

module.exports = { register, login, authenticate, logout };
