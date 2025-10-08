const { ensureSchema, sql } = require('../_lib/db');

module.exports = async function handler(req, res) {
  await ensureSchema();

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT id, full_name, email, phone_number, notes, created_at
        FROM patients
        ORDER BY created_at DESC;
      `;
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching patients', error);
      res.status(500).json({ message: 'Error al obtener pacientes' });
    }
    return;
  }

  if (req.method === 'POST') {
    const { full_name, email = null, phone_number = null, notes = null } = req.body || {};

    if (!full_name || typeof full_name !== 'string') {
      res.status(400).json({ message: 'El nombre completo es obligatorio' });
      return;
    }

    try {
      const { rows } = await sql`
        INSERT INTO patients (full_name, email, phone_number, notes)
        VALUES (${full_name.trim()}, ${email}, ${phone_number}, ${notes})
        RETURNING id, full_name, email, phone_number, notes, created_at;
      `;
      res.status(201).json(rows[0]);
    } catch (error) {
      console.error('Error creating patient', error);
      res.status(500).json({ message: 'Error al crear paciente' });
    }
    return;
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).json({ message: 'Método no permitido' });
};
