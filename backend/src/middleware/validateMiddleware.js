const AppError = require('../errors/AppError');

/**
 * Validates request data against a Zod schema.
 * @param {object} schemas - Object containing optional schemas for `body`, `query`, and `params`.
 */
const validate = (schemas) => {
  return (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        req.query = schemas.query.parse(req.query);
      }
      if (schemas.params) {
        req.params = schemas.params.parse(req.params);
      }
      next();
    } catch (error) {
      next(error);
    }
  };
};

module.exports = validate;
