// routes/commandes.js
const express = require('express');
const router = express.Router();
const commandeController = require('../controllers/commandeController');
const { auth } = require('../middleware/auth');

// POST /api/commandes
router.post('/', auth, commandeController.createCommande);

// GET /api/commandes/mes-commandes
router.get('/mes-commandes', auth, commandeController.getMesCommandes);

// GET /api/commandes/eleveur/mes-commandes  
router.get('/eleveur/mes-commandes', auth, commandeController.getCommandesEleveur);

module.exports = router;