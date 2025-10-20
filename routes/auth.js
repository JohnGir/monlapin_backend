const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Client = require('../models/Client');
const Eleveur = require('../models/Eleveur');
const { generateToken } = require('../utils/token');
const { registerValidation, loginValidation } = require('../middleware/validation');

// 🔐 Route de création d'utilisateur - AVEC VALEURS DYNAMIQUES
router.post('/register', async (req, res) => {
  try {
    const { error } = registerValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { 
      email, 
      password, 
      role, 
      firstName, 
      lastName, 
      phone,
      // Données optionnelles pour l'adresse
      addressLine1,
      addressLine2,
      city,
      postalCode,
      farmName, // Pour les éleveurs
      description // Pour les éleveurs
    } = req.body;

    // Vérifier si l'utilisateur existe déjà
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'Un utilisateur avec cet email existe déjà' 
      });
    }

    // Créer le nouvel utilisateur
    const newUser = new User({
      email,
      passwordHash: password,
      role,
      profile: {
        firstName,
        lastName,
        phone
      }
    });

    await newUser.save();

    // 🔥 CRÉATION DU PROFIL AVEC VALEURS DYNAMIQUES
    if (role === 'client') {
      const clientData = {
        userId: newUser._id,
        type: 'particulier',
        deliveryAddress: {
          addressLine1: addressLine1 || `Adresse de ${firstName} ${lastName}`,
          addressLine2: addressLine2 || 'non-definie',
          city: city || 'Abidjan',
          postalCode: postalCode || 'non-definie'
        }
      };

      const client = new Client(clientData);
      await client.save();

    } else if (role === 'eleveur') {
      const eleveurData = {
        userId: newUser._id,
        farmName: farmName || `Ferme de ${firstName} ${lastName}`,
        farmAddress: {
          addressLine1: addressLine1 || `Adresse de la ferme ${firstName} ${lastName}`,
          addressLine2: addressLine2 || 'non-definie',
          city: city || 'Abidjan'
        },
        isApproved: false,
        description: description || `Éleveur professionnel ${firstName} ${lastName}`
      };

      const eleveur = new Eleveur(eleveurData);
      await eleveur.save();
    }

    // Générer un token JWT
    const token = generateToken(newUser._id);

    // 🔥 STOCKER LE TOKEN DANS LA BASE DE DONNÉES
    await newUser.addToken(token);

    res.status(201).json({
      success: true,
      message: '✅ Utilisateur créé avec succès!',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        profile: newUser.profile
      }
    });
  } catch (error) {
    console.error('Erreur création utilisateur:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur serveur lors de la création',
      error: error.message 
    });
  }
});

// 🔐 Route de connexion - CORRIGÉE
router.post('/login', async (req, res) => {
  try {
    const { error } = loginValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      });
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Votre compte a été désactivé'
      });
    }

    // Générer un nouveau token
    const token = generateToken(user._id);

    // 🔥 STOCKER LE NOUVEAU TOKEN DANS LA BASE DE DONNÉES
    await user.addToken(token);

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Erreur connexion:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de la connexion',
      error: error.message
    });
  }
});

// 🔐 Route pour voir tous les tokens d'un utilisateur (debug)
router.get('/debug/tokens/:userId', async (req, res) => {
  try {
    const user = await User.findById(req.params.userId).select('email tokens');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    res.json({
      success: true,
      email: user.email,
      total_tokens: user.tokens.length,
      tokens: user.tokens.map(t => ({
        token_preview: t.token.substring(0, 30) + '...',
        createdAt: t.createdAt,
        _id: t._id
      }))
    });

  } catch (error) {
    console.error('Erreur debug tokens:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;