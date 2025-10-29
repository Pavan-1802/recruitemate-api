const { pool } = require("../lib/db");
const {
  generateVerificationToken,
  sendVerificationEmail,
  verifyToken,
} = require("../utils");
const jwt = require("jsonwebtoken");

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

    const user = await pool.query(
      `INSERT INTO users (name, email, password, is_email_verified, verification_token, token_expiry)
             VALUES ($1, $2, $3, false, $4, $5)
             RETURNING id, name, email`,
      [name, email, password, verificationToken, expiresAt]
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

    if (user.token_expires_at && new Date() > new Date(user.token_expires_at)) {
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
      "SELECT id, name, email, is_email_verified FROM users WHERE email = $1 AND password = $2",
      [email, password]
    );
    if (!user.rows.length) {
      return res.status(401).json({ error: "Invalid email or password" });
    }
    const { id } = user.rows[0];
    const token = jwt.sign({ id }, process.env.JWT_SECRET);
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
};

module.exports = { register, verifyEmail, login };
