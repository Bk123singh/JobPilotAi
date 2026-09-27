const interviewService = require('./interviewService');
const { successResponse, createdResponse } = require('../../utils/responseUtils');

const scheduleInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.scheduleInterview(req.user.id, req.body);
    return createdResponse(res, { interview }, 'Interview scheduled successfully');
  } catch (error) {
    next(error);
  }
};

const getCandidateInterviews = async (req, res, next) => {
  try {
    const interviews = await interviewService.getCandidateInterviews(req.user.id);
    return successResponse(res, 200, { interviews }, 'Scheduled interviews retrieved');
  } catch (error) {
    next(error);
  }
};

const getRecruiterInterviews = async (req, res, next) => {
  try {
    const interviews = await interviewService.getRecruiterInterviews(req.user.id);
    return successResponse(res, 200, { interviews }, 'Recruiter interviews retrieved');
  } catch (error) {
    next(error);
  }
};

const updateInterview = async (req, res, next) => {
  try {
    const interview = await interviewService.updateInterview(
      req.user.id,
      req.params.id,
      req.body
    );
    return successResponse(res, 200, { interview }, 'Interview updated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  scheduleInterview,
  getCandidateInterviews,
  getRecruiterInterviews,
  updateInterview,
};
