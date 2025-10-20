const express = require('express');
const {
  getMesCommandes,
  createCommande,
  getCommandesEleveur
} = require('../controllers/commandeController');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes clients
router.get('/mes-commandes', auth, authorize('client'), getMesCommandes);
router.post('/', auth, authorize('client'), createCommande);

// Routes éleveurs
router.get('/eleveur/mes-commandes', auth, authorize('eleveur'), getCommandesEleveur);

module.exports = router;