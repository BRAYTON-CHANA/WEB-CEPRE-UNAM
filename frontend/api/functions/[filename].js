import DatabaseManager from '../database/DatabaseManager.js';
import 'dotenv/config';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { filename } = req.query;

  if (req.method === 'POST') {
    const { params } = req.body;
    try {
      await DatabaseManager.connect();
      const result = await DatabaseManager.executeFunction(filename, params || {});
      res.json({ success: true, data: result });
    } catch (error) {
      console.error(`Error en /api/functions/${filename}:`, error);
      res.status(500).json({ success: false, message: error.message });
    }
  } else if (req.method === 'GET') {
    if (req.query.info) {
      try {
        const info = await DatabaseManager.getFunctionInfo(filename);
        res.json({ success: true, data: info });
      } catch (error) {
        res.status(500).json({ success: false, message: error.message });
      }
    } else {
      res.status(400).json({ success: false, message: 'Use POST para ejecutar o ?info=true para obtener info' });
    }
  } else {
    res.status(405).json({ success: false, message: 'Method not allowed' });
  }
}
