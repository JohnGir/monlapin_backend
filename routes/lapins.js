const express = require('express');
const {
  getLapins,
  getLapin,
  createLapin,
  updateLapin,
  deleteLapin,
  getMesLapins
} = require('../controllers/lapinController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes publiques
router.get('/', getLapins);
router.get('/:id', getLapin);

// Routes protégées
router.post('/', auth, authorize('eleveur'), createLapin);
router.put('/:id', auth, authorize('eleveur'), updateLapin);
router.delete('/:id', auth, authorize('eleveur'), deleteLapin);
router.get('/eleveur/mes-lapins', auth, authorize('eleveur'), getMesLapins);

module.exports = router;