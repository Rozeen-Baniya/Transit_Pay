const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require('crypto');
const User = require("../models/user.model");
const Role = require("../models/role.model");
const PasswordResetToken = require('../models/passwordResetToken.model');
const RefreshToken = require('../models/refreshToken.model');
const emailService = require('../services/email.service');

// Temporary route to list users
exports.listAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, '_id email username');
    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching users',
      error: error.message
    });
  }
};

exports.createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      dateOfBirth,
      nationalId,
      nationalIdNumber,
    } = req.body;
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(409).json({ message: "Email already registered" });

    // Assign default rider role
    const riderRole = await Role.findOne({ name: 'rider' });
    if (!riderRole) {
      console.error('Default rider role not found');
      return res.status(500).json({ message: "Error creating user - role not found" });
    }

    // Do NOT hash here; user model pre-save will hash the password
    const newUser = new User({
      username,
      email,
      password,
      firstName,
      lastName,
      phoneNumber,
      address,
      dateOfBirth,
      nationalId,
      nationalIdNumber,
      roles: [riderRole._id]
    });
    await newUser.save();
    const token = jwt.sign(
      { id: newUser._id },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );
    res.status(201).json({
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        address: newUser.address,
      },
      token,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Login attempt for email:', email);
    if (!email || !password  || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ message: "Credentials Tampered" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      console.log('User not found for email:', email);
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Account lockout logic
    const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
    const LOCK_TIME_BASE_MINUTES = parseInt(process.env.LOCK_TIME_MINUTES || '15', 10);
    const now = new Date();
    if (user.loginAttempts && user.loginAttempts.lockedUntil && user.loginAttempts.lockedUntil > now) {
      return res.status(423).json({ message: `Account locked until ${user.loginAttempts.lockedUntil.toISOString()}` });
    }

    try {
      const ok = await user.comparePassword(password);
      console.log('Password comparison result:', ok);
      if (!ok) {
        // Increment failed attempts
        user.loginAttempts = user.loginAttempts || { count: 0 };
        user.loginAttempts.count = (user.loginAttempts.count || 0) + 1;
        user.loginAttempts.lastAttempt = new Date();

        // If we've reached threshold, set lockedUntil with exponential backoff
        if (user.loginAttempts.count >= MAX_LOGIN_ATTEMPTS) {
          const cycles = Math.floor((user.loginAttempts.count - MAX_LOGIN_ATTEMPTS) / MAX_LOGIN_ATTEMPTS);
          const lockMinutes = LOCK_TIME_BASE_MINUTES * Math.pow(2, cycles);
          user.loginAttempts.lockedUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
          await user.save();
          return res.status(423).json({ message: `Account locked until ${user.loginAttempts.lockedUntil.toISOString()}` });
        }

        await user.save();
        return res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (bcryptErr) {
      console.error('bcrypt error:', bcryptErr);
      return res.status(500).json({ message: "Error verifying credentials" });
    }

    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'dev_secret',
      { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "30d" }
    );

    // Create refresh token (rotating)
    const refreshTokenPlain = crypto.randomBytes(64).toString('hex');
    const refreshTokenHash = crypto.createHash('sha256').update(refreshTokenPlain).digest('hex');
    const refreshDays = parseInt(process.env.REFRESH_TOKEN_DAYS || '30', 10);
    const refreshExpiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    try {
      // Persist refresh token
      await RefreshToken.create({ userId: user._id, tokenHash: refreshTokenHash, expiresAt: refreshExpiresAt, createdByIp: req.ip });
    } catch (err) {
      console.error('Failed to create refresh token:', err);
      return res.status(500).json({ message: 'Failed to create session' });
    }

    // On successful login, reset login attempts
    try {
      user.loginAttempts = { count: 0, lastAttempt: null, lockedUntil: null };
      await user.save();
    } catch (err) {
      console.warn('Failed to reset loginAttempts after successful login:', err.message);
    }
    res.status(200).json({
      status: "success",
      user: { id: user._id },
      token,
      refreshToken: refreshTokenPlain
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Rotate refresh token and issue new access token
exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });

    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const record = await RefreshToken.findOne({ tokenHash, revoked: false, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(401).json({ message: 'Invalid or expired refresh token' });

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Rotate: revoke current token and create a new one
    record.revoked = true;
    const newRefreshPlain = crypto.randomBytes(64).toString('hex');
    const newRefreshHash = crypto.createHash('sha256').update(newRefreshPlain).digest('hex');
    const refreshDays = parseInt(process.env.REFRESH_TOKEN_DAYS || '30', 10);
    const newExpiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);
    record.replacedByToken = newRefreshHash;
    await record.save();

    await RefreshToken.create({ userId: user._id, tokenHash: newRefreshHash, expiresAt: newExpiresAt, createdByIp: req.ip });

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: process.env.ACCESS_TOKEN_EXPIRES || '30d' });

    return res.json({ token: accessToken, refreshToken: newRefreshPlain });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Logout / Revoke refresh token
exports.logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ message: 'refreshToken is required' });
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const record = await RefreshToken.findOne({ tokenHash });
    if (record && !record.revoked) {
      record.revoked = true;
      await record.save();
    }
    return res.json({ message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Create initial admin user
exports.createAdmin = async (req, res) => {
  try {
    const { email, password, adminSecret } = req.body;

    // Verify admin creation secret
    if (adminSecret !== process.env.ADMIN_CREATION_SECRET) {
      return res.status(403).json({ message: "Invalid admin creation secret" });
    }

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({ message: "Admin email already registered" });
    }

    // Get admin role
    const adminRole = await Role.findOne({ name: 'admin' });
    if (!adminRole) {
      return res.status(500).json({ message: "Admin role not found. Please initialize RBAC first." });
    }

    // Create admin user
    // Let user model pre-save hash the password
    const adminUser = new User({
      email,
      password,
      firstName: "System",
      lastName: "Admin",
      phoneNumber: req.body.phoneNumber || "0000000000",
      address: req.body.address || "System Address",
      nationalId: "Citizenship",
      nationalIdNumber: req.body.nationalIdNumber || "ADMIN-" + Date.now(),
      dateOfBirth: req.body.dateOfBirth || new Date("1990-01-01"),
      roles: [adminRole._id],
      isVerified: true
    });

    await adminUser.save();

    const token = jwt.sign(
      { id: adminUser._id },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "7d" }
    );

    res.status(201).json({
      message: "Admin user created successfully",
      user: {
        id: adminUser._id,
        email: adminUser.email,
        roles: ['admin']
      },
      token
    });
  } catch (error) {
    console.error('Admin creation error:', error);
    res.status(500).json({ message: "Admin creation failed", error: error.message });
  }
};

exports.me = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "Not found" });
    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber,
      address: user.address,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Request password reset - generates token, stores hashed token and sends reset link via email (or logs it)
exports.requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    // Quick dev log to confirm route invocation — safe in dev only
    if (process.env.NODE_ENV !== 'production') {
      console.log('requestPasswordReset called for', email);
    }
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });

    // Always return 202 to avoid leaking which emails exist
    if (!user) {
      return res.status(202).json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate a token and store a hash
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Invalidate previous tokens for this user
    await PasswordResetToken.updateMany({ userId: user._id, used: false }, { used: true }).catch(() => {});

    await PasswordResetToken.create({ userId: user._id, tokenHash, expiresAt, used: false });

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`;

    // Send email (or log) with token in the body, not URL
    await emailService.sendPasswordResetEmail(user.email, resetUrl, token);

    return res.status(202).json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    console.error('Request password reset error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Reset password using token
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ message: 'Token and newPassword are required' });

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await PasswordResetToken.findOne({ tokenHash, used: false, expiresAt: { $gt: new Date() } });
    if (!record) return res.status(400).json({ message: 'Invalid or expired token' });

    const user = await User.findById(record.userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update password (user pre-save will hash)
    user.password = newPassword;
    await user.save();

    // Mark token as used
    record.used = true;
    await record.save();

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Admin-only: unlock a user (clear loginAttempts)
exports.unlockUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Requester must be authenticated - auth middleware sets req.userId
    if (!req.userId) return res.status(401).json({ message: 'Unauthorized' });

    const requester = await User.findById(req.userId).populate('roles');
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    const isAdmin = (requester.roles || []).some(r => r.name === 'admin');
    if (!isAdmin) return res.status(403).json({ message: 'Forbidden - admin required' });

    const target = await User.findById(userId);
    if (!target) return res.status(404).json({ message: 'User not found' });

    target.loginAttempts = { count: 0, lastAttempt: null, lockedUntil: null };
    await target.save();

    return res.json({ message: 'User unlocked successfully' });
  } catch (error) {
    console.error('Unlock user error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};
