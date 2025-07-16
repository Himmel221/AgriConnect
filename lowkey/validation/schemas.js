import Joi from 'joi';

export const registerSchema = Joi.object({
  first_name: Joi.string().min(1).max(50).required(),
  middle_name: Joi.string().allow('').max(50),
  last_name: Joi.string().min(1).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).max(100).required(),
  confirm_password: Joi.ref('password'),
  birthDate: Joi.alternatives().try(
    Joi.date(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
    Joi.string().pattern(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).required()
  ).required()
});