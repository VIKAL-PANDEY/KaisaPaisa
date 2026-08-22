const User = require('../models/User');
const Category = require('../models/Category');
const Account = require('../models/Account');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const generateToken = (userId, email) => {
  return jwt.sign(
    { id: userId, email },
    process.env.JWT_SECRET || 'kaisapaisa_super_secret_jwt_key_2026',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password securely with bcrypt
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      passwordHash,
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata'
    });

    // Create default accounts for new user (e.g. Cash, HDFC Bank, UPI Wallet)
    await Account.create([
      { userId: user._id, name: 'HDFC Bank', type: 'Savings', initialBalance: 0 },
      { userId: user._id, name: 'UPI Wallet', type: 'UPI Wallet', initialBalance: 0 },
      { userId: user._id, name: 'Cash', type: 'Cash', initialBalance: 0 }
    ]);

    const token = generateToken(user._id, user.email);

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        currencySymbol: user.currencySymbol,
        timezone: user.timezone
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    User Login
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateToken(user._id, user.email);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        currencySymbol: user.currencySymbol,
        timezone: user.timezone,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout user / clear token client context
// @route   POST /api/auth/logout
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get Current Authenticated User Profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update User Settings / Profile
// @route   PUT /api/auth/profile
const updateProfile = async (req, res, next) => {
  try {
    const { name, currency, timezone, notificationPreferences } = req.body;
    
    const updates = {};
    if (name) updates.name = name;
    if (currency) {
      updates.currency = currency;
      updates.currencySymbol = currency === 'INR' ? '₹' : '$';
    }
    if (timezone) updates.timezone = timezone;
    if (notificationPreferences) updates.notificationPreferences = notificationPreferences;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true }).select('-passwordHash');

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Google OAuth / GIS Login & Registration
// @route   POST /api/auth/google
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '336826701835-93v5eq269ho5hisjrra0ofogtm1394t8.apps.googleusercontent.com';

const googleAuth = async (req, res, next) => {
  try {
    const { credential, profile } = req.body;

    let email = '';
    let name = '';
    let googleId = '';
    let avatarUrl = '';

    if (credential && typeof credential === 'string') {
      try {
        // Try verifying with Google tokeninfo endpoint if online
        try {
          const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${credential}`);
          if (verifyRes.ok) {
            const tokenInfo = await verifyRes.json();
            email = tokenInfo.email;
            name = tokenInfo.name || tokenInfo.given_name || (tokenInfo.email ? tokenInfo.email.split('@')[0] : '');
            googleId = tokenInfo.sub;
            avatarUrl = tokenInfo.picture || '';
          }
        } catch (fetchErr) {
          console.warn('Google online token verification failed, falling back to decode:', fetchErr.message);
        }

        // Fallback to JWT payload parsing if verify wasn't reached
        if (!email) {
          const parts = credential.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            email = payload.email;
            name = payload.name || payload.given_name || (payload.email ? payload.email.split('@')[0] : '');
            googleId = payload.sub;
            avatarUrl = payload.picture || '';
          }
        }
      } catch (err) {
        console.warn('Failed to parse Google credential:', err.message);
      }
    }

    if (!email && profile) {
      email = profile.email;
      name = profile.name || (profile.email ? profile.email.split('@')[0] : 'Google User');
      googleId = profile.googleId || profile.id || `google_${Date.now()}`;
      avatarUrl = profile.picture || profile.avatarUrl || '';
    }

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Google authentication failed: No valid email or ID token provided.'
      });
    }

    email = email.toLowerCase().trim();

    let user = await User.findOne({ email });

    if (!user) {
      // Auto-register new user authenticated with Google
      const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(randomPassword, salt);

      user = await User.create({
        name: name || email.split('@')[0],
        email,
        passwordHash,
        googleId,
        avatarUrl,
        authProvider: 'google',
        currency: 'INR',
        currencySymbol: '₹',
        timezone: 'Asia/Kolkata'
      });

      // Initialize default starter accounts
      await Account.create([
        { userId: user._id, name: 'HDFC Bank', type: 'Savings', initialBalance: 0 },
        { userId: user._id, name: 'UPI Wallet', type: 'UPI Wallet', initialBalance: 0 },
        { userId: user._id, name: 'Cash', type: 'Cash', initialBalance: 0 }
      ]);
    } else {
      let updated = false;
      if (googleId && !user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (avatarUrl && !user.avatarUrl) {
        user.avatarUrl = avatarUrl;
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    const token = generateToken(user._id, user.email);

    res.status(200).json({
      success: true,
      message: 'Signed in with Google successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        currencySymbol: user.currencySymbol,
        timezone: user.timezone,
        avatarUrl: user.avatarUrl || '',
        authProvider: user.authProvider || 'google',
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get Google OAuth Public Config (Client ID)
// @route   GET /api/auth/google-config
const getGoogleConfig = (req, res) => {
  res.status(200).json({
    clientId: GOOGLE_CLIENT_ID
  });
};

module.exports = {
  register,
  login,
  googleAuth,
  getGoogleConfig,
  logout,
  getMe,
  updateProfile
};
