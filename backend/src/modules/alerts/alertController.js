const alertService = require('./alertService');
const { successResponse, createdResponse } = require('../../utils/responseUtils');

const createAlert = async (req, res, next) => {
  try {
    const alert = await alertService.createAlert(req.user.id, req.body);
    return createdResponse(res, { alert }, 'Job alert created successfully');
  } catch (error) {
    next(error);
  }
};

const getUserAlerts = async (req, res, next) => {
  try {
    const alerts = await alertService.getUserAlerts(req.user.id);
    return successResponse(res, 200, { alerts }, 'Job alerts retrieved');
  } catch (error) {
    next(error);
  }
};

const getAlertById = async (req, res, next) => {
  try {
    const alert = await alertService.getAlertById(req.user.id, req.params.id);
    return successResponse(res, 200, { alert }, 'Job alert retrieved');
  } catch (error) {
    next(error);
  }
};

const updateAlert = async (req, res, next) => {
  try {
    const alert = await alertService.updateAlert(req.user.id, req.params.id, req.body);
    return successResponse(res, 200, { alert }, 'Job alert updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteAlert = async (req, res, next) => {
  try {
    const result = await alertService.deleteAlert(req.user.id, req.params.id);
    return successResponse(res, 200, result, 'Job alert deleted successfully');
  } catch (error) {
    next(error);
  }
};

const triggerAlertDigest = async (req, res, next) => {
  try {
    const result = await alertService.triggerAlertDigest(req.user.id, req.params.id);
    return successResponse(res, 200, result, 'Job alert digest triggered successfully');
  } catch (error) {
    next(error);
  }
};

const getPreferences = async (req, res, next) => {
  try {
    const preferences = await alertService.getPreferences(req.user.id);
    return successResponse(res, 200, { preferences }, 'Notification preferences retrieved');
  } catch (error) {
    next(error);
  }
};

const updatePreferences = async (req, res, next) => {
  try {
    const preferences = await alertService.updatePreferences(req.user.id, req.body);
    return successResponse(res, 200, { preferences }, 'Notification preferences updated');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAlert,
  getUserAlerts,
  getAlertById,
  updateAlert,
  deleteAlert,
  triggerAlertDigest,
  getPreferences,
  updatePreferences,
};
