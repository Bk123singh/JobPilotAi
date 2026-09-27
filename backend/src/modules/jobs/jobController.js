const jobService = require('./jobService');
const { successResponse, createdResponse } = require('../../utils/responseUtils');

const listJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.listJobs(req.query, req.user?.id || null);
    return successResponse(res, 200, { jobs }, 'Jobs retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getJob = async (req, res, next) => {
  try {
    const job = await jobService.getJobById(req.params.id, req.user?.id || null);
    return successResponse(res, 200, { job }, 'Job details retrieved');
  } catch (error) {
    next(error);
  }
};

const createJob = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const job = await jobService.createJob(
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );

    return createdResponse(res, { job }, 'Job posted successfully');
  } catch (error) {
    next(error);
  }
};

const updateJob = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const job = await jobService.updateJob(
      req.user.id,
      req.params.id,
      req.body,
      ipAddress,
      userAgent
    );

    return successResponse(res, 200, { job }, 'Job updated successfully');
  } catch (error) {
    next(error);
  }
};

const closeJob = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const job = await jobService.closeJob(
      req.user.id,
      req.params.id,
      ipAddress,
      userAgent
    );

    return successResponse(res, 200, { job }, 'Job closed successfully');
  } catch (error) {
    next(error);
  }
};

const listRecruiterJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.listRecruiterJobs(req.user.id);
    return successResponse(res, 200, { jobs }, 'Recruiter jobs retrieved');
  } catch (error) {
    next(error);
  }
};

const toggleSaveJob = async (req, res, next) => {
  try {
    const result = await jobService.toggleSaveJob(req.user.id, req.params.id);
    const message = result.isSaved ? 'Job saved to your bookmarks' : 'Job removed from bookmarks';
    return successResponse(res, 200, result, message);
  } catch (error) {
    next(error);
  }
};

const listSavedJobs = async (req, res, next) => {
  try {
    const jobs = await jobService.listSavedJobs(req.user.id);
    return successResponse(res, 200, { jobs }, 'Saved jobs retrieved');
  } catch (error) {
    next(error);
  }
};

const getJobMatchScore = async (req, res, next) => {
  try {
    const matchBreakdown = await jobService.getJobMatchScore(req.params.id, req.user.id);
    return successResponse(res, 200, { matchBreakdown }, 'Match score calculated successfully');
  } catch (error) {
    next(error);
  }
};

const getRecommendedJobs = async (req, res, next) => {
  try {
    const limit = req.query.limit || 10;
    const jobs = await jobService.getRecommendedJobs(req.user.id, limit);
    return successResponse(res, 200, { jobs }, 'Personalized recommended jobs retrieved');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listJobs,
  getJob,
  createJob,
  updateJob,
  closeJob,
  listRecruiterJobs,
  toggleSaveJob,
  listSavedJobs,
  getJobMatchScore,
  getRecommendedJobs,
};
