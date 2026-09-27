const profileService = require('./profileService');
const { successResponse } = require('../../utils/responseUtils');

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getProfileByUserId(req.user.id);
    return successResponse(res, 200, { profile }, 'Profile retrieved successfully');
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const profile = await profileService.updateProfile(
      req.user.id,
      req.body,
      ipAddress,
      userAgent
    );

    return successResponse(res, 200, { profile }, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getPublicProfile(req.params.userId);
    return successResponse(res, 200, { profile }, 'Candidate profile retrieved');
  } catch (error) {
    next(error);
  }
};

const getSkillGapIntelligence = async (req, res, next) => {
  try {
    const intelligence = await profileService.getSkillGapIntelligence(req.user.id);
    return successResponse(res, 200, { intelligence }, 'Skill gap intelligence calculated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  getPublicProfile,
  getSkillGapIntelligence,
};
