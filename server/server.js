import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  connectionLimit: 10,
  dateStrings: true, // les dates restent des chaînes 'YYYY-MM-DD'
});

const STATUTS_VEHICULE = ['ok', 'entretien', 'panne'];
const JOURS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

// ---------- Utilitaires ----------
const handle = (fn) => async (req, res) => {
  try {
    await fn(req, res);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

const addDays = (dateStr, n) => {
  const d = new Date(dateStr + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

// ---------- Authentification ----------
const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Non authentifié' });
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Session invalide ou expirée' });
  }
};

const requireRole = (...roles) => (req, res, next) =>
  roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: 'Accès refusé' });

const gestionnaireOnly = [requireAuth, requireRole('gestionnaire', 'admin')];

app.post('/api/auth/login', handle(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email et mot de passe requis' });
  }
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  const ok = user && (await bcrypt.compare(password, user.password_hash));
  if (!ok) return res.status(401).json({ error: 'Identifiants incorrects' });

  const token = jwt.sign(
    { id: user.id, nom: user.nom, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } });
}));

app.get('/api/auth/me', requireAuth, (req, res) => res.json(req.user));

// ---------- Tableau de bord ----------
app.get('/api/dashboard/summary', requireAuth, handle(async (_req, res) => {
  const [[actifs]] = await pool.query("SELECT COUNT(*) AS n FROM vehicles WHERE statut = 'ok'");
  const [[alertes]] = await pool.query("SELECT COUNT(*) AS n FROM vehicles WHERE statut = 'panne'");
  const [[entretiens]] = await pool.query(
    'SELECT COUNT(*) AS n FROM maintenances WHERE date_effectuee IS NULL AND date_prevue >= CURDATE()'
  );
  res.json({
    vehiculesActifs: actifs.n,
    entretiensAVenir: entretiens.n,
    panneauxAlerte: alertes.n,
  });
}));

app.get('/api/revenues/weekly', requireAuth, handle(async (_req, res) => {
  const [[{ lundi }]] = await pool.query(
    'SELECT CURDATE() - INTERVAL WEEKDAY(CURDATE()) DAY AS lundi'
  );
  const lundiPrec = addDays(lundi, -7);

  const [rows] = await pool.query(
    `SELECT date_transaction AS jour, SUM(montant) AS total
     FROM revenues
     WHERE type = 'recette' AND date_transaction >= ? AND date_transaction < ?
     GROUP BY date_transaction`,
    [lundiPrec, addDays(lundi, 7)]
  );
  const parJour = Object.fromEntries(rows.map((r) => [r.jour, Number(r.total)]));

  const jours = JOURS.map((label, i) => {
    const date = addDays(lundi, i);
    return { jour: label, date, total: parJour[date] || 0 };
  });

  const totalSemaine = jours.reduce((s, j) => s + j.total, 0);
  let totalPrecedente = 0;
  for (let i = 0; i < 7; i++) totalPrecedente += parJour[addDays(lundiPrec, i)] || 0;

  const variationPct = totalPrecedente > 0
    ? Math.round(((totalSemaine - totalPrecedente) / totalPrecedente) * 1000) / 10
    : null;
  const totaux = jours.map((j) => j.total);

  res.json({
    jours,
    total: totalSemaine,
    variationPct, // null si la semaine précédente est vide
    haut: Math.max(...totaux),
    bas: Math.min(...totaux),
  });
}));

// ---------- Véhicules ----------
app.get('/api/vehicles', requireAuth, handle(async (req, res) => {
  const q = req.query.q ? `%${req.query.q}%` : '%';
  const [rows] = await pool.query(
    'SELECT * FROM vehicles WHERE nom LIKE ? ORDER BY created_at DESC',
    [q]
  );
  res.json(rows);
}));

app.post('/api/vehicles', ...gestionnaireOnly, handle(async (req, res) => {
  const { nom, kilometrage = 0, statut = 'ok', derniere_revision = null } = req.body;
  if (!nom) return res.status(400).json({ error: 'Le nom est requis' });
  if (!STATUTS_VEHICULE.includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  const [r] = await pool.query(
    'INSERT INTO vehicles (nom, kilometrage, statut, derniere_revision) VALUES (?, ?, ?, ?)',
    [nom, kilometrage, statut, derniere_revision]
  );
  res.status(201).json({ id: r.insertId });
}));

app.put('/api/vehicles/:id', ...gestionnaireOnly, handle(async (req, res) => {
  const { nom, kilometrage, statut, derniere_revision } = req.body;
  if (statut && !STATUTS_VEHICULE.includes(statut)) {
    return res.status(400).json({ error: 'Statut invalide' });
  }
  const [r] = await pool.query(
    `UPDATE vehicles SET
       nom = COALESCE(?, nom),
       kilometrage = COALESCE(?, kilometrage),
       statut = COALESCE(?, statut),
       derniere_revision = COALESCE(?, derniere_revision)
     WHERE id = ?`,
    [nom ?? null, kilometrage ?? null, statut ?? null, derniere_revision ?? null, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Véhicule introuvable' });
  res.json({ ok: true });
}));

app.delete('/api/vehicles/:id', ...gestionnaireOnly, handle(async (req, res) => {
  const [r] = await pool.query('DELETE FROM vehicles WHERE id = ?', [req.params.id]);
  if (!r.affectedRows) return res.status(404).json({ error: 'Véhicule introuvable' });
  res.json({ ok: true });
}));

// ---------- Entretiens ----------
app.get('/api/maintenances', requireAuth, handle(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT m.*, v.nom AS vehicule
     FROM maintenances m
     JOIN vehicles v ON v.id = m.vehicle_id
     ORDER BY m.date_prevue DESC`
  );
  res.json(rows);
}));

app.post('/api/maintenances', ...gestionnaireOnly, handle(async (req, res) => {
  const { vehicle_id, description, date_prevue, cout = 0 } = req.body;
  if (!vehicle_id || !description || !date_prevue) {
    return res.status(400).json({ error: 'vehicle_id, description et date_prevue requis' });
  }
  const [r] = await pool.query(
    'INSERT INTO maintenances (vehicle_id, description, date_prevue, cout) VALUES (?, ?, ?, ?)',
    [vehicle_id, description, date_prevue, cout]
  );
  res.status(201).json({ id: r.insertId });
}));

app.patch('/api/maintenances/:id/complete', ...gestionnaireOnly, handle(async (req, res) => {
  const { cout } = req.body;
  const [r] = await pool.query(
    `UPDATE maintenances
     SET date_effectuee = CURDATE(), statut = 'fait', cout = COALESCE(?, cout)
     WHERE id = ?`,
    [cout ?? null, req.params.id]
  );
  if (!r.affectedRows) return res.status(404).json({ error: 'Entretien introuvable' });
  res.json({ ok: true });
}));

// ---------- Revenus ----------
app.get('/api/revenues', requireAuth, handle(async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT r.*, v.nom AS vehicule
     FROM revenues r
     LEFT JOIN vehicles v ON v.id = r.vehicle_id
     ORDER BY r.date_transaction DESC`
  );
  res.json(rows);
}));

app.listen(process.env.PORT || 4000, () =>
  console.log(`API prête sur http://localhost:${process.env.PORT || 4000}`)
);
