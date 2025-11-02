const { pool } = require("../lib/db");
const {
  generateVerificationToken,
  sendVerificationEmail,
  verifyToken,
  sendPasswordResetEmail
} = require("../utils");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const register = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (existingUser.rows.length) {
      const user = existingUser.rows[0];

      if (user.is_email_verified) {
        return res
          .status(400)
          .json({
            error: "Email already registered and verified. Please login.",
          });
      }

      const verificationToken = generateVerificationToken(email);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await pool.query(
        "UPDATE users SET verification_token = $1, token_expiry = $2 WHERE email = $3",
        [verificationToken, expiresAt, email]
      );

      await sendVerificationEmail(email, verificationToken);

      return res
        .status(200)
        .json({
          message: "Verification link re-sent. Please check your email.",
        });
    }

    const verificationToken = generateVerificationToken(email);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await pool.query(
      `INSERT INTO users (name, email, password, is_email_verified, verification_token, token_expiry)
             VALUES ($1, $2, $3, false, $4, $5)
             RETURNING id, name, email`,
      [name, email, hashedPassword, verificationToken, expiresAt]
    );

    await sendVerificationEmail(email, verificationToken);

    res
      .status(201)
      .json({ message: "User registered. Please verify your email." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Registration failed" });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(400).json({ error: "Invalid or malformed token." });
    }

    const { email } = payload;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.is_email_verified) {
      return res
        .status(200)
        .json({ message: "Email already verified. You can log in now." });
    }

    if (user.token_expiry && new Date() > new Date(user.token_expiry)) {
      return res.status(400).json({
        error: "Verification link expired. Please request a new one.",
      });
    }

    await pool.query(
      `
      UPDATE users
      SET is_email_verified = true,
          verification_token = NULL,
          token_expiry = NULL
      WHERE email = $1
      `,
      [email]
    );

    res.status(200).json({ message: "Email verified successfully." });
  } catch (error) {
    console.error("Error verifying email:", error);
    res.status(500).json({ error: "Email verification failed due to a server error." });
  }
};


const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query(
      "SELECT id, name, email, is_email_verified, password FROM users WHERE email = $1",
      [email]
    );
    if (!user.rows.length) {
      return res.status(401).json({ error: "Invalid email" });
    }
    const isPasswordValid = await bcrypt.compare(password, user.rows[0].password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid password" });
    }
    const { id } = user.rows[0];
    const token = jwt.sign({ id }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const verificationToken = generateVerificationToken(email);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await pool.query(
      "UPDATE users SET verification_token = $1, token_expiry = $2 WHERE email = $3",
      [verificationToken, expiresAt, email]
    );

    await sendPasswordResetEmail(email, verificationToken);

    return res
      .status(200)
      .json({
        message: "Password reset link sent. Please check your email.",
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Password reset failed" });
  }
};

const resetPassword = async (req, res) => {
  const { token } = req.params;
  const { newPassword } = req.body;
  try {
    const payload = verifyToken(token);
    if (!payload) {
      return res.status(400).json({ error: "Invalid or malformed token." });
    }
    const { email } = payload;

    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );
    const user = userResult.rows[0];
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.token_expiry && new Date() > new Date(user.token_expiry)) {
      return res.status(400).json({
        error: "Password reset link expired. Please request a new one.",
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query(
      `
      UPDATE users
      SET password = $1,
          verification_token = NULL,
          token_expiry = NULL
      WHERE email = $2
      `,
      [hashedPassword, email]
    );
    res.status(200).json({ message: "Password reset successfully." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ error: "Password reset failed due to a server error." });
  }
};

module.exports = { register, verifyEmail, login, forgotPassword, resetPassword };
