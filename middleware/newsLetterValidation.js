const Joi = require('joi');

const newsletterValidation = (data) => {
  const schema = Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Email doit être valide',
      'any.required': 'Email est requis'
    }),
    source: Joi.string().valid('site_vitrine', 'application', 'evenement', 'reseau_social').optional(),
    preferences: Joi.object({
      notifications: Joi.boolean().optional(),
      promotions: Joi.boolean().optional(),
      nouvelles: Joi.boolean().optional()
    }).optional()
  });

  return schema.validate(data);
};

module.exports = { newsletterValidation };