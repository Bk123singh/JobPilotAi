const express = require('express');
const router = express.Router();
const companyController = require('./companyController');
const { authenticate, authorize } = require('../../middleware/authMiddleware');
const validate = require('../../middleware/validateMiddleware');
const { createCompanySchema, updateCompanySchema } = require('./companyValidators');

router.get('/me', authenticate, authorize('RECRUITER', 'ADMIN'), companyController.getMyCompany);
router.post('/', authenticate, authorize('RECRUITER', 'ADMIN'), validate({ body: createCompanySchema }), companyController.createCompany);
router.patch('/:id', authenticate, authorize('RECRUITER', 'ADMIN'), validate({ body: updateCompanySchema }), companyController.updateCompany);
router.get('/:id', authenticate, companyController.getCompany);
router.get('/', authenticate, companyController.listCompanies);

module.exports = router;
