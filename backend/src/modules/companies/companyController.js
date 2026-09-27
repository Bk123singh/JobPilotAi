const companyService = require('./companyService');
const { successResponse, createdResponse } = require('../../utils/responseUtils');

const getMyCompany = async (req, res, next) => {
  try {
    const company = await companyService.getMyCompany(req.user.id);
    return successResponse(res, 200, { company }, 'Recruiter company retrieved');
  } catch (error) {
    next(error);
  }
};

const createCompany = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const company = await companyService.createCompany(
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );

    return createdResponse(res, { company }, 'Company created successfully');
  } catch (error) {
    next(error);
  }
};

const updateCompany = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const company = await companyService.updateCompany(
      req.user.id,
      req.params.id,
      req.body,
      ipAddress,
      userAgent
    );

    return successResponse(res, 200, { company }, 'Company updated successfully');
  } catch (error) {
    next(error);
  }
};

const getCompany = async (req, res, next) => {
  try {
    const company = await companyService.getCompanyById(req.params.id);
    return successResponse(res, 200, { company }, 'Company details retrieved');
  } catch (error) {
    next(error);
  }
};

const listCompanies = async (req, res, next) => {
  try {
    const companies = await companyService.listCompanies();
    return successResponse(res, 200, { companies }, 'Companies retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyCompany,
  createCompany,
  updateCompany,
  getCompany,
  listCompanies,
};
