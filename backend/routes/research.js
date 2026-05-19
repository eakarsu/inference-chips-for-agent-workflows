const router = require('express').Router();
const db = require('../db');
const verifyToken = require("../middleware/auth");
router.get('/', verifyToken, async (req, res) => {
  try { res.json((await db.query('SELECT * FROM research ORDER BY citations DESC')).rows); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT * FROM research WHERE id=$1', [req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { title, focus_area, findings, chip_mentioned, published_date, citations, journal, breakthrough } = req.body;
  try { const r = await db.query('INSERT INTO research (title,focus_area,findings,chip_mentioned,published_date,citations,journal,breakthrough) VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *', [title, focus_area, findings, chip_mentioned, published_date||null, citations||0, journal, breakthrough||false]); res.status(201).json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { title, focus_area, findings, chip_mentioned, published_date, citations, journal, breakthrough } = req.body;
  try { const r = await db.query('UPDATE research SET title=$1,focus_area=$2,findings=$3,chip_mentioned=$4,published_date=$5,citations=$6,journal=$7,breakthrough=$8 WHERE id=$9 RETURNING *', [title, focus_area, findings, chip_mentioned, published_date||null, citations, journal, breakthrough, req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM research WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
