const Joi = require('joi');
const { isValidIvoirianCity } = require('../utils/cities');

// Validation pour l'inscription avec villes ivoiriennes - CORRIGÉE
const registerValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email doit être valide',
      'any.required': 'Email est requis'
    }),
    password: Joi.string().min(6).required().messages({
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'any.required': 'Mot de passe est requis'
    }),
    role: Joi.string().valid('client', 'eleveur').required().messages({
      'any.only': 'Le rôle doit être client ou eleveur',
      'any.required': 'Le rôle est requis'
    }),
    firstName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'any.required': 'Le prénom est requis'
    }),
    lastName: Joi.string().min(2).max(50).required().messages({
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'any.required': 'Le nom est requis'
    }),
    phone: Joi.string().pattern(/^\+?[0-9\s\-\(\)]{10,}$/).required().messages({
      'string.pattern.base': 'Numéro de téléphone invalide',
      'any.required': 'Le téléphone est requis'
    }),
    addressLine1: Joi.string().max(200).optional().allow(''),
    addressLine2: Joi.string().max(200).optional().allow(''),
    
    // 🔥 CORRECTION : city doit être allowed même si non fourni
    city: Joi.string().max(100).optional().allow('').custom((value, helpers) => {
      // Si une ville est fournie, on la valide
      if (value && value.trim() !== '' && !isValidIvoirianCity(value)) {
        return helpers.error('any.invalid');
      }
      return value;
    }, 'Ville ivoirienne validation').messages({
      'any.invalid': 'Ville ivoirienne non reconnue. Villes disponibles: Abidjan, Yamoussoukro, Bouaké, Daloa, Korhogo, San-Pédro, Abengourou, Man, Divo, Gagnoa, etc.'
    }),
    
    postalCode: Joi.string().max(20).optional().allow(''),
    farmName: Joi.string().max(100).optional().allow(''),
    description: Joi.string().max(500).optional().allow('')
  });

  return schema.validate(data);
};

// Validation pour la connexion
const loginValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email doit être valide',
      'any.required': 'Email est requis'
    }),
    password: Joi.string().required().messages({
      'any.required': 'Mot de passe est requis'
    })
  });

  return schema.validate(data);
};

// Validation pour créer un lapin
/* const lapinValidation = (data) => {
  const schema = Joi.object({
    /* breed: Joi.string().min(2).max(100).required().messages({
      'string.min': 'La race doit contenir au moins 2 caractères',
      'any.required': 'La race est requise'
    }), 
    age: Joi.number().integer().min(1).max(200).required().messages({
      'number.min': 'L\'âge doit être au moins 1 semaine',
      'any.required': 'L\'âge est requis'
    }),
    weight: Joi.number().min(0.1).max(50).required().messages({
      'number.min': 'Le poids doit être au moins 0.1 kg',
      'any.required': 'Le poids est requis'
    }),
    price: Joi.number().min(0).required().messages({
      'number.min': 'Le prix ne peut pas être négatif',
      'any.required': 'Le prix est requis'
    }),
    /* categories: Joi.string().valid('Lapin frais', 'Lapin fumé', 'Lapin prêt à cuire').required().messages({
      'any.only': 'La catégorie doit être: Lapin frais, Lapin fumé ou Lapin prêt à cuire',
      'any.required': 'La catégorie est requise'
    }), 
    categoryId: Joi.string().hex().length(24).required().messages({
      'string.hex': 'L\'ID de catégorie doit être un ObjectId valide',
      'string.length': 'L\'ID de catégorie doit contenir 24 caractères',
      'any.required': 'La catégorie est requise'
    }),
    description: Joi.string().max(1000).allow('').optional(),
    stock: Joi.number().integer().min(0).required().messages({
      'number.min': 'Le stock ne peut pas être négatif',
      'any.required': 'Le stock est requis'
    })
  });

  return schema.validate(data);
}; */

const lapinValidation = (data) => {
  const schema = Joi.object({
    breed: Joi.string().min(2).max(100).required().messages({
      'string.min': 'La race doit contenir au moins 2 caractères',
      'string.max': 'La race ne peut pas dépasser 100 caractères',
      'string.empty': 'La race est requise',
      'any.required': 'La race est requise'
    }),
    age: Joi.number().integer().min(1).max(200).required().messages({
      'number.base': 'L\'âge doit être un nombre',
      'number.min': 'L\'âge doit être au moins 1 semaine',
      'number.max': 'L\'âge ne peut pas dépasser 200 semaines',
      'any.required': 'L\'âge est requis'
    }),
    weight: Joi.number().min(0.1).max(50).required().messages({
      'number.base': 'Le poids doit être un nombre',
      'number.min': 'Le poids doit être au moins 0.1 kg',
      'number.max': 'Le poids ne peut pas dépasser 50 kg',
      'any.required': 'Le poids est requis'
    }),
    price: Joi.number().min(0).required().messages({
      'number.base': 'Le prix doit être un nombre',
      'number.min': 'Le prix ne peut pas être négatif',
      'any.required': 'Le prix est requis'
    }),
    categoryId: Joi.string().hex().length(24).required().messages({
      'string.hex': 'L\'ID de catégorie doit être un ObjectId valide',
      'string.length': 'L\'ID de catégorie doit contenir 24 caractères',
      'any.required': 'La catégorie est requise'
    }),
    description: Joi.string().max(1000).allow('', null).optional().messages({
      'string.max': 'La description ne peut pas dépasser 1000 caractères'
    }),
    stock: Joi.number().integer().min(0).required().messages({
      'number.base': 'Le stock doit être un nombre',
      'number.min': 'Le stock ne peut pas être négatif',
      'any.required': 'Le stock est requis'
    }),
    images: Joi.array().items(Joi.string()).optional() // ← AJOUT si votre modèle a ce champ
  });

  return schema.validate(data);
};

module.exports = {
  registerValidation,
  loginValidation,
  lapinValidation
};