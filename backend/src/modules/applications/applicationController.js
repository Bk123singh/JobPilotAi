const applicationService = require('./applicationService');
const { successResponse, createdResponse } = require('../../utils/responseUtils');

/**
 * Candidate submits job application
 * POST /api/v1/applications/jobs/:jobId
 */
const applyForJob = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';
    const { jobId } = req.params;

    const application = await applicationService.applyForJob(
      req.user.id,
      jobId,
      req.body,
      ipAddress,
      userAgent
    );

    return createdResponse(res, { application }, 'Application submitted successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Candidate views their submitted applications
 * GET /api/v1/applications/me
 */
const getMyApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getCandidateApplications(req.user.id);
    return successResponse(res, 200, { applications }, 'Applications retrieved successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Candidate views single application detail
 * GET /api/v1/applications/:id
 */
const getApplicationDetail = async (req, res, next) => {
  try {
    const application = await applicationService.getCandidateApplicationById(
      req.user.id,
      req.params.id
    );
    return successResponse(res, 200, { application }, 'Application details retrieved');
  } catch (error) {
    next(error);
  }
};

/**
 * Candidate withdraws application
 * POST /api/v1/applications/:id/withdraw
 */
const withdrawApplication = async (req, res, next) => {
  try {
    const application = await applicationService.withdrawApplication(
      req.user.id,
      req.params.id
    );
    return successResponse(res, 200, { application }, 'Application withdrawn successfully');
  } catch (error) {
    next(error);
  }
};

/**
 * Recruiter lists candidates across job openings
 * GET /api/v1/recruiter/applications
 */
const getRecruiterApplications = async (req, res, next) => {
  try {
    const applications = await applicationService.getRecruiterApplications(
      req.user.id,
      req.query
    );
    return successResponse(
      res,
      200,
      { applications },
      'Candidate applications retrieved'
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Recruiter updates application status
 * PATCH /api/v1/recruiter/applications/:id/status
 */
const updateApplicationStatus = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const application = await applicationService.updateApplicationStatus(
      req.user.id,
      req.params.id,
      req.body,
      ipAddress,
      userAgent
    );

    return successResponse(
      res,
      200,
      { application },
      'Application status updated successfully'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  applyForJob,
  getMyApplications,
  getApplicationDetail,
  withdrawApplication,
  getRecruiterApplications,
  updateApplicationStatus,
};
