const { ensureSchema, sql, parseNumber } = require('../_lib/db');

module.exports = async function handler(req, res) {
  await ensureSchema();

  if (req.method === 'GET') {
    try {
      const { rows } = await sql`
        SELECT
          s.id,
          s.patient_id,
          p.full_name AS patient_name,
          s.scheduled_at,
          s.duration_minutes,
          s.therapy_type,
          s.therapist_name,
          s.notes,
          s.status,
          s.confirmation_status,
          s.confirmation_notes,
          s.payment_status,
          s.payment_amount,
          s.payment_method,
          s.paid_at,
          s.created_at
        FROM sessions s
        INNER JOIN patients p ON p.id = s.patient_id
        ORDER BY s.scheduled_at DESC;
      `;
      res.status(200).json(rows);
    } catch (error) {
      console.error('Error fetching sessions', error);
      res.status(500).json({ message: 'Error al obtener sesiones' });
    }
    return;
  }

  if (req.method === 'POST') {
    const {
      patient_id,
      scheduled_at,
      duration_minutes,
      therapy_type,
      therapist_name,
      notes = null,
      payment_amount = null,
      payment_method = null,
    } = req.body || {};

    if (!patient_id || !scheduled_at || !duration_minutes || !therapy_type || !therapist_name) {
      res.status(400).json({ message: 'Datos incompletos para crear la sesión' });
      return;
    }

    const durationValue = parseNumber(duration_minutes);
    const paymentValue = parseNumber(payment_amount);
    const scheduledDate = new Date(scheduled_at);

    if (durationValue === null || durationValue <= 0) {
      res.status(400).json({ message: 'La duración debe ser un número válido' });
      return;
    }

    if (Number.isNaN(scheduledDate.valueOf())) {
      res.status(400).json({ message: 'La fecha de la sesión no es válida' });
      return;
    }

    try {
      const { rows } = await sql`
        INSERT INTO sessions (
          patient_id,
          scheduled_at,
          duration_minutes,
          therapy_type,
          therapist_name,
          notes,
          payment_amount,
          payment_method
        )
        VALUES (
          ${patient_id},
          ${scheduledDate},
          ${durationValue},
          ${therapy_type},
          ${therapist_name},
          ${notes},
          ${paymentValue},
          ${payment_method || null}
        )
        RETURNING id;
      `;
      res.status(201).json({ id: rows[0].id });
    } catch (error) {
      console.error('Error creating session', error);
      res.status(500).json({ message: 'Error al crear sesión' });
    }
    return;
  }

  res.setHeader('Allow', 'GET,POST');
  res.status(405).json({ message: 'Método no permitido' });
};
