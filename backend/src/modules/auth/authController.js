const authService = require('./authService');
const { successResponse, createdResponse } = require('../../utils/responseUtils');
const env = require('../../config/env');

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

const register = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await authService.register(req.body, ipAddress, userAgent);

    // Set refresh token in secure HTTP-only cookie
    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return createdResponse(
      res,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken, // Also return in body for mobile/Postman convenience
      },
      'User registered successfully'
    );
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await authService.login(req.body, ipAddress, userAgent);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return successResponse(
      res,
      200,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Login successful'
    );
  } catch (error) {
    next(error);
  }
};

const refresh = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const result = await authService.refreshAccessToken(token);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return successResponse(
      res,
      200,
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Token refreshed successfully'
    );
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken || req.body?.refreshToken;
    const userId = req.user?.id;

    await authService.logout(token, userId);

    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return successResponse(res, 200, null, 'Logged out successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return successResponse(res, 200, { user }, 'User profile retrieved');
  } catch (error) {
    next(error);
  }
};

const googleAuth = async (req, res, next) => {
  try {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || '';

    const result = await authService.googleAuth(req.body, ipAddress, userAgent);

    res.cookie('refreshToken', result.refreshToken, COOKIE_OPTIONS);

    return successResponse(
      res,
      200,
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      },
      'Google authentication successful'
    );
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  refresh,
  logout,
  getMe,
  googleAuth,
};
