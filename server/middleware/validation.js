const { body, validationResult } = require('express-validator');

// Validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Registration validation
const validateRegistration = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  body('birthDate')
    .isISO8601()
    .withMessage('Please provide a valid birth date in ISO format (YYYY-MM-DD)'),
  body('residency')
    .isLength({ min: 2, max: 100 })
    .withMessage('Residency must be between 2 and 100 characters'),
  body('idFaceImage')
    .notEmpty()
    .withMessage('ID face image is required'),
  body('liveFaceImage')
    .notEmpty()
    .withMessage('Live face image is required'),
  handleValidationErrors
];

// Login validation
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Face verification validation
const validateFaceVerification = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('faceImage')
    .notEmpty()
    .withMessage('Face image is required'),
  handleValidationErrors
];

// Liveness check validation
const validateLivenessCheck = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('faceImage')
    .notEmpty()
    .withMessage('Face image is required'),
  body('movement')
    .isIn(['turn_left', 'turn_right', 'blink', 'smile', 'nod'])
    .withMessage('Movement must be one of: turn_left, turn_right, blink, smile, nod'),
  handleValidationErrors
];

// Face matching validation
const validateFaceMatch = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  body('idFaceImage')
    .notEmpty()
    .withMessage('ID face image is required'),
  body('liveFaceImage')
    .notEmpty()
    .withMessage('Live face image is required'),
  handleValidationErrors
];

// User ID validation
const validateUserId = [
  body('userId')
    .isMongoId()
    .withMessage('Please provide a valid user ID'),
  handleValidationErrors
];

module.exports = {
  validateRegistration,
  validateLogin,
  validateFaceVerification,
  validateLivenessCheck,
  validateFaceMatch,
  validateUserId,
  handleValidationErrors
};
