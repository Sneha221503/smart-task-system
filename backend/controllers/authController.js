const pool = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// Register new user
const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    // Check if user already exists
    const userExists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    if (userExists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists with this email." });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await pool.query(
      "INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name, email, hashedPassword]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error during registration." });
  }
};

// Login user
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required." });
  }

  try {
    const result = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login." });
  }
};

// Get current logged-in user
const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Forgot Password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: "Email is required." });

  try {
    const userResult = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "There is no user with that email address." });
    }

    const user = userResult.rows[0];
    // Use hex token (URL-safe, no special characters)
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token before saving in DB
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    console.log("[ForgotPassword] Generated token:", resetToken);
    console.log("[ForgotPassword] Token hash to save:", resetTokenHash);

    await pool.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = NOW() + INTERVAL '1 hour' WHERE id = $2",
      [resetTokenHash, user.id]
    );

    // Verify it was saved
    const verifyResult = await pool.query(
      "SELECT reset_password_token FROM users WHERE id = $1",
      [user.id]
    );
    console.log("[ForgotPassword] Token saved in DB:", verifyResult.rows[0]?.reset_password_token);

    // Create reset URL (token is hex so URL-safe)
    const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    console.log("[ForgotPassword] Reset URL:", resetUrl);

    const message = `You requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "Password Reset Token",
        message: `You requested a password reset.\n\nClick the link below to reset your password:\n\n${resetUrl}\n\nThis link expires in 1 hour.`,
        html: `<p>You requested a password reset.</p><p>Click this <a href="${resetUrl}">link</a> to reset your password.</p><p>This link expires in 1 hour.</p>`
      });
      res.status(200).json({ message: "Email sent!" });
    } catch (err) {
      // If email fails, clear the token fields
      await pool.query(
        "UPDATE users SET reset_password_token = NULL, reset_password_expires = NULL WHERE id = $1",
        [user.id]
      );
      console.error("Email send error:", err);
      return res.status(500).json({ message: "Email could not be sent." });
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

// Reset Password
const resetPassword = async (req, res) => {
  // Decode token in case it was URL-encoded
  const rawToken = req.params.token;
  const token = decodeURIComponent(rawToken);
  const { password } = req.body;

  console.log("[ResetPassword] Raw token from URL:", rawToken);
  console.log("[ResetPassword] Decoded token:", token);

  if (!password) return res.status(400).json({ message: "New password is required." });

  try {
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");
    console.log("[ResetPassword] Computed hash:", resetTokenHash);

    const userResult = await pool.query(
      "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()",
      [resetTokenHash]
    );

    console.log("[ResetPassword] Users found:", userResult.rows.length);

    if (userResult.rows.length === 0) {
      // Extra debug — check if token exists but expired
      const anyUser = await pool.query(
        "SELECT id, reset_password_expires FROM users WHERE reset_password_token = $1",
        [resetTokenHash]
      );
      if (anyUser.rows.length > 0) {
        return res.status(400).json({ 
          message: "Token has expired. Please request a new password reset.",
          expiredAt: anyUser.rows[0].reset_password_expires
        });
      }
      return res.status(400).json({ message: "Invalid or expired token. Please request a new password reset." });
    }

    const user = userResult.rows[0];
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await pool.query(
      "UPDATE users SET password = $1, reset_password_token = NULL, reset_password_expires = NULL WHERE id = $2",
      [hashedPassword, user.id]
    );

    res.status(200).json({ message: "Password reset successful! You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports = { register, login, getMe, forgotPassword, resetPassword };
