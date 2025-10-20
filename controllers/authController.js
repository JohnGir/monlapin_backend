const User = require('../models/User');
const Client = require('../models/Client');
const Eleveur = require('../models/Eleveur');
const { registerValidation, loginValidation } = require('../middleware/validation');
const jwt = require('jsonwebtoken');

// Générer le token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Inscription
exports.register = async (req, res) => {
  try {
    // Validation des données
    const { error } = registerValidation(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const { email, password, role, firstName, lastName, phone } = req.body;

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Un utilisateur avec cet email existe déjà'
      });
    }

    // Créer l'utilisateur
    const user = new User({
      email,
      passwordHash: password, // Serra hashé par le middleware pre-save
      role,
      profile: { firstName, lastName, phone }
    });

    await user.save();

    // Créer le profil spécifique selon le rôle
    if (role === 'client') {
      const client = new Client({
        userId: user._id,
        type: 'particulier'
      });
      await client.save();
    } else if (role === 'eleveur') {
      const eleveur = new Eleveur({
        userId: user._id,
        farmName: `${firstName} ${lastName}`,
        farmAddress: { addressLine1: 'À définir', city: 'Abidjan' }
      });
      await eleveur.save();
    }

    // Générer le token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });

  } catch (error) {
    console.error('Erreur inscription:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur lors de l\'inscription'
    });
  }
};

// Connexion
exports.login = async (req, res) => {
  try {
    // Validation des données
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

    // Générer le token
    const token = generateToken(user._id);

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
      message: 'Erreur serveur lors de la connexion'
    });
  }
};

// Profil utilisateur
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    
    let profileData = { user };

    // Ajouter les données spécifiques au rôle
    if (req.user.role === 'client') {
      const client = await Client.findOne({ userId: req.user.id });
      profileData.client = client;
    } else if (req.user.role === 'eleveur') {
      const eleveur = await Eleveur.findOne({ userId: req.user.id });
      profileData.eleveur = eleveur;
    }

    res.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Erreur profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur serveur'
    });
  }
};