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
    const resetToken = crypto.randomBytes(32).toString("hex");
    
    // Hash token for saving in DB (security best practice)
    const resetTokenHash = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Set expiry to 1 hour from now
    const expiryTime = new Date(Date.now() + 60 * 60 * 1000);

    await pool.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3",
      [resetTokenHash, expiryTime, user.id]
    );

    // Create reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;

    const message = `You requested a password reset. Please make a PUT request to: \n\n ${resetUrl}`;

    try {
      await sendEmail({
        email: user.email,
        subject: "🔐 SmartFlow - Password Reset Request",
        message: `You requested a password reset.\n\nYour Reset Token: ${resetToken}\n\nGo to: ${resetUrl}\n\nThis token expires in 1 hour.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; background: #f9f9f9; padding: 30px; border-radius: 10px;">
            <h2 style="color: #6c63ff; text-align: center;">🔐 SmartFlow Password Reset</h2>
            <p style="color: #333;">You requested a password reset. Use the button or token below.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${resetUrl}" 
                 style="background: #6c63ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #555; font-size: 13px; text-align: center;">
              <strong>Button काम नाही केली? (localhost वर आहात?)</strong><br/>
              खालील token copy करा आणि app मध्ये paste करा:
            </p>
            
            <div style="background: #1a1a2e; color: #a78bfa; padding: 15px; border-radius: 8px; text-align: center; font-family: monospace; font-size: 13px; word-break: break-all; margin: 10px 0;">
              ${resetToken}
            </div>
            
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px;">
              ⏳ हा token <strong>1 तास</strong> valid राहील.<br/>
              तुम्ही request केली नसेल तर हा email ignore करा.
            </p>
          </div>
        `
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
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: "New password is required." });

  try {
    const resetTokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const userResult = await pool.query(
      "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expires > NOW()",
      [resetTokenHash]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ message: "Invalid or expired token." });
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
