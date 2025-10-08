const { ensureSchema, sql, parseNumber } = require('../_lib/db');

module.exports = async function handler(req, res) {
  await ensureSchema();
  const { id } = req.query;

  if (!id) {
    res.status(400).json({ message: 'ID de sesión requerido' });
    return;
  }

  if (req.method === 'PATCH') {
    const payload = req.body || {};
    const fields = [];

    if (payload.status) {
      fields.push(sql`status = ${payload.status}`);
    }
    if (payload.confirmation_status) {
      fields.push(sql`confirmation_status = ${payload.confirmation_status}`);
    }
    if (payload.confirmation_notes !== undefined) {
      fields.push(sql`confirmation_notes = ${payload.confirmation_notes}`);
    }
    if (payload.payment_status) {
      fields.push(sql`payment_status = ${payload.payment_status}`);
    }
    if (payload.payment_method !== undefined) {
      fields.push(sql`payment_method = ${payload.payment_method}`);
    }
    if (payload.paid_at) {
      fields.push(sql`paid_at = ${new Date(payload.paid_at)}`);
    }

    const paymentAmount = parseNumber(payload.payment_amount, undefined);
    if (paymentAmount !== undefined) {
      fields.push(sql`payment_amount = ${paymentAmount}`);
    }

    if (!fields.length) {
      res.status(400).json({ message: 'No hay campos para actualizar' });
      return;
    }

    try {
      const result = await sql`
        UPDATE sessions
        SET ${sql.join(fields, sql`, `)}
        WHERE id = ${id};
      `;
      if (!result.rowCount) {
        res.status(404).json({ message: 'Sesión no encontrada' });
        return;
      }
      const { rows } = await sql`
        SELECT id, status, confirmation_status, payment_status
        FROM sessions
        WHERE id = ${id};
      `;
      res.status(200).json(rows[0]);
    } catch (error) {
      console.error('Error updating session', error);
      res.status(500).json({ message: 'Error al actualizar sesión' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const result = await sql`DELETE FROM sessions WHERE id = ${id};`;
      if (!result.rowCount) {
        res.status(404).json({ message: 'Sesión no encontrada' });
        return;
      }
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting session', error);
      res.status(500).json({ message: 'Error al eliminar sesión' });
    }
    return;
  }

  res.setHeader('Allow', 'PATCH,DELETE');
  res.status(405).json({ message: 'Método no permitido' });
};
