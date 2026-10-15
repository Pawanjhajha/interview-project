const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, getTokenFromRequest, setAuthCookie, clearAuthCookie } = require('../utils/token');

const sendAuthResponse = (res, statusCode, user) => {
  setAuthCookie(res, signToken(user.id));
  res.status(statusCode).json({ success: true, user });
};

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  sendAuthResponse(res, 201, user);
});

const login = asyncHandler(async (req, res) => {
  const user = await authService.login(req.body);
  sendAuthResponse(res, 200, user);
});

const logout = asyncHandler(async (req, res) => {
  await authService.logout(getTokenFromRequest(req));
  clearAuthCookie(res);
  res.status(200).json({ success: true, message: 'Logged out' });
});

const me = (req, res) => {
  res.status(200).json({ success: true, user: req.user });
};

module.exports = { register, login, logout, me };
