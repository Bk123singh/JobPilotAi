const adminService = require('./adminService');
const { successResponse, createdResponse } = require('../../utils/responseUtils');

const getPlatformStats = async (req, res, next) => {
  try {
    const stats = await adminService.getPlatformStats();
    return successResponse(res, 200, { stats }, 'Platform analytics retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getCompanies = async (req, res, next) => {
  try {
    const companies = await adminService.getCompanies(req.query);
    return successResponse(res, 200, { companies }, 'Companies retrieved for administration');
  } catch (error) {
    next(error);
  }
};

const verifyCompany = async (req, res, next) => {
  try {
    const { isVerified, notes } = req.body;
    const company = await adminService.verifyCompany(req.params.id, req.user, {
      isVerified,
      notes,
    });
    return successResponse(res, 200, { company }, 'Company verification status updated');
  } catch (error) {
    next(error);
  }
};

const getJobs = async (req, res, next) => {
  try {
    const jobs = await adminService.getJobs(req.query);
    return successResponse(res, 200, { jobs }, 'Platform jobs retrieved for administration');
  } catch (error) {
    next(error);
  }
};

const moderateJob = async (req, res, next) => {
  try {
    const { status, moderationReason } = req.body;
    const job = await adminService.moderateJob(req.params.id, req.user, {
      status,
      moderationReason,
    });
    return successResponse(res, 200, { job }, 'Job posting moderated successfully');
  } catch (error) {
    next(error);
  }
};

const getUsers = async (req, res, next) => {
  try {
    const users = await adminService.getUsers(req.query);
    return successResponse(res, 200, { users }, 'Platform users retrieved');
  } catch (error) {
    next(error);
  }
};

const updateUserStatus = async (req, res, next) => {
  try {
    const result = await adminService.updateUserStatus(req.params.id, req.user, req.body);
    return successResponse(res, 200, { user: result }, 'User status updated');
  } catch (error) {
    next(error);
  }
};

const getAuditLogs = async (req, res, next) => {
  try {
    const auditLogs = await adminService.getAuditLogs(req.query.limit);
    return successResponse(res, 200, { auditLogs }, 'Platform audit logs retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPlatformStats,
  getCompanies,
  verifyCompany,
  getJobs,
  moderateJob,
  getUsers,
  updateUserStatus,
  getAuditLogs,
};
