const resumeService = require('./resumeService');
const { successResponse, createdResponse } = require('../../utils/responseUtils');

const listResumes = async (req, res, next) => {
  try {
    const resumes = await resumeService.listUserResumes(req.user.id);
    return successResponse(res, 200, { resumes }, 'Resumes retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const getResume = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const resume = await resumeService.getResumeById(
      req.params.id,
      req.user,
      ipAddress,
      userAgent
    );

    return successResponse(res, 200, { resume }, 'Resume retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const createResume = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const resume = await resumeService.createResume(
      req.user.id,
      req.body,
      req.file || null,
      ipAddress,
      userAgent
    );

    return createdResponse(res, { resume }, 'Resume uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const updateResume = async (req, res, next) => {
  try {
    const resume = await resumeService.updateResume(
      req.user.id,
      req.params.id,
      req.body
    );

    return successResponse(res, 200, { resume }, 'Resume updated successfully');
  } catch (error) {
    next(error);
  }
};

const setPrimary = async (req, res, next) => {
  try {
    const resume = await resumeService.setPrimaryResume(
      req.user.id,
      req.params.id
    );

    return successResponse(res, 200, { resume }, 'Primary resume updated');
  } catch (error) {
    next(error);
  }
};

const deleteResume = async (req, res, next) => {
  try {
    await resumeService.deleteResume(req.user.id, req.params.id);
    return successResponse(res, 200, null, 'Resume deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listResumes,
  getResume,
  createResume,
  updateResume,
  setPrimary,
  deleteResume,
};
