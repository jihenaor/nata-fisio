const { sql } = require('@vercel/postgres');

let schemaInitialized = false;

async function ensureSchema() {
  if (schemaInitialized) {
    return;
  }

  await sql`
    CREATE TABLE IF NOT EXISTS patients (
      id SERIAL PRIMARY KEY,
      full_name TEXT NOT NULL,
      email TEXT,
      phone_number TEXT,
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
      scheduled_at TIMESTAMPTZ NOT NULL,
      duration_minutes INTEGER NOT NULL,
      therapy_type TEXT NOT NULL,
      therapist_name TEXT NOT NULL,
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'scheduled',
      confirmation_status TEXT NOT NULL DEFAULT 'pending',
      confirmation_notes TEXT,
      confirmed_at TIMESTAMPTZ,
      payment_status TEXT NOT NULL DEFAULT 'pending',
      payment_amount NUMERIC(12, 2),
      payment_method TEXT,
      paid_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `;

  schemaInitialized = true;
}

function parseNumber(value, fallback = null) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

module.exports = {
  sql,
  ensureSchema,
  parseNumber,
};
