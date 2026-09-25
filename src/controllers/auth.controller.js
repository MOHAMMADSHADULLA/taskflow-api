const bcrypt = require('bcryptjs');
const { User, RefreshToken } = require('../models');
const { signAccessToken, signRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { hashToken } = require('../utils/hash');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const REFRESH_COOKIE_DAYS = 7;

function refreshExpiryDate() {
  return new Date(Date.now() + REFRESH_COOKIE_DAYS * 24 * 60 * 60 * 1000);
}

async function issueTokenPair(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user);

  await RefreshToken.create({
    tokenHash: hashToken(refreshToken),
    userId: user.id,
    expiresAt: refreshExpiryDate(),
  });

  return { accessToken, refreshToken };
}

const signup = catchAsync(async (req, res) => {
  const { email, password, name } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) throw new AppError('An account with that email already exists', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ email, passwordHash, name });

  const tokens = await issueTokenPair(user);
  res.status(201).json({ user, ...tokens });
});

const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) throw new AppError('Invalid email or password', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid email or password', 401);

  const tokens = await issueTokenPair(user);
  res.json({ user, ...tokens });
});

const refresh = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) throw new AppError('refreshToken is required', 400);

  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const stored = await RefreshToken.findOne({ where: { tokenHash: hashToken(refreshToken) } });
  if (!stored || stored.expiresAt < new Date()) {
    throw new AppError('Refresh token has been revoked or expired', 401);
  }

  const user = await User.findByPk(payload.sub);
  if (!user) throw new AppError('User no longer exists', 401);

  // Rotate: invalidate the old refresh token, issue a fresh pair. This
  // limits how long a stolen refresh token stays useful.
  await stored.destroy();
  const tokens = await issueTokenPair(user);
  res.json({ user, ...tokens });
});

const logout = catchAsync(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) {
    await RefreshToken.destroy({ where: { tokenHash: hashToken(refreshToken) } });
  }
  res.status(204).send();
});

module.exports = { signup, login, refresh, logout };
