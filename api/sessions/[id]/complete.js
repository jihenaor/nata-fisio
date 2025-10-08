const { ensureSchema, sql } = require('../../_lib/db');

module.exports = async function handler(req, res) {
  await ensureSchema();

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).json({ message: 'Método no permitido' });
    return;
  }

  const { id } = req.query;

  if (!id) {
    res.status(400).json({ message: 'ID de sesión requerido' });
    return;
  }

  try {
    const result = await sql`
      UPDATE sessions
      SET status = 'completed'
      WHERE id = ${id};
    `;
    if (!result.rowCount) {
      res.status(404).json({ message: 'Sesión no encontrada' });
      return;
    }
    res.status(200).json({ message: 'Sesión completada' });
  } catch (error) {
    console.error('Error completing session', error);
    res.status(500).json({ message: 'Error al completar sesión' });
  }
};
