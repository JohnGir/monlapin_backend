const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Client = require('../models/Client');
const Eleveur = require('../models/Eleveur');
const { generateToken } = require('../utils/token');
const { registerValidation, loginValidation } = require('../middleware/validation'); // ⚠️ Ajouter loginValidation
const { getCityCoordinates } = require('../utils/cities');

// 🔐 ROUTE REGISTER
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
      email, password, role, firstName, lastName, phone,
      addressLine1, city, addressLine2, postalCode,
      farmName, description
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

    // 🔥 GÉNÉRATION AUTOMATIQUE DES COORDONNÉES
    const userCity = city || 'Abidjan';
    const cityData = getCityCoordinates(userCity);

    if (role === 'client') {
      const clientData = {
        userId: newUser._id,
        type: 'particulier',
        deliveryAddress: {
          addressLine1: addressLine1 || `Adresse de ${firstName} ${lastName}`,
          city: userCity,
          addressLine2: addressLine2 || undefined,
          postalCode: postalCode || undefined,
          coordinates: {
            type: 'Point',
            coordinates: cityData.coordinates
          }
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
          city: userCity,
          addressLine2: addressLine2 || undefined,
          coordinates: {
            type: 'Point',
            coordinates: cityData.coordinates
          }
        },
        isApproved: false,
        description: description || `Éleveur professionnel ${firstName} ${lastName}`
      };

      const eleveur = new Eleveur(eleveurData);
      await eleveur.save();
    }

    // Générer le token JWT
    const token = generateToken(newUser._id);
    await newUser.addToken(token);

    res.status(201).json({
      success: true,
      message: `✅ Utilisateur créé avec succès à ${userCity}!`,
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        profile: newUser.profile,
        city: userCity,
        region: cityData.region
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

// 🔐 ROUTE LOGIN - ⚠️ EN DEHORS DE REGISTER !
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

    // Stocker le nouveau token dans la base
    await user.addToken(token);

    // Récupérer les infos du profil selon le rôle
    let profileInfo = {};
    if (user.role === 'client') {
      const client = await Client.findOne({ userId: user._id });
      const cityData = getCityCoordinates(client?.deliveryAddress?.city || 'Abidjan');
      profileInfo = { 
        city: client?.deliveryAddress?.city,
        region: cityData.region
      };
    } else if (user.role === 'eleveur') {
      const eleveur = await Eleveur.findOne({ userId: user._id });
      const cityData = getCityCoordinates(eleveur?.farmAddress?.city || 'Abidjan');
      profileInfo = { 
        city: eleveur?.farmAddress?.city,
        farmName: eleveur?.farmName,
        region: cityData.region
      };
    }

    res.json({
      success: true,
      message: 'Connexion réussie',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile,
        ...profileInfo
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

// 🔧 ROUTE TEMPORAIRE POUR APPROUVER UN ÉLEVEUR (DÉVELOPPEMENT SEULEMENT)
router.patch('/dev/approve-eleveur/:email', async (req, res) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Fonction désactivée en production'
      });
    }

    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    const eleveur = await Eleveur.findOne({ userId: user._id });
    if (!eleveur) {
      return res.status(404).json({
        success: false,
        message: 'Profil éleveur non trouvé'
      });
    }

    eleveur.isApproved = true;
    await eleveur.save();

    res.json({
      success: true,
      message: `Éleveur ${user.email} approuvé avec succès`,
      eleveur: {
        farmName: eleveur.farmName,
        city: eleveur.farmAddress.city,
        isApproved: eleveur.isApproved
      }
    });

  } catch (error) {
    console.error('Erreur approbation éleveur:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
});

module.exports = router;