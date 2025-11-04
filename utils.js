const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const pdf = require("pdf-parse");
const { pipeline } = require("@xenova/transformers");

const JWT_SECRET = process.env.JWT_SECRET;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

let embedder;
(async () => {
  console.log("Loading sentence transformer model...");
  embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  console.log("Model loaded successfully ✅");
})();

const generateVerificationToken = (email) => {
  return jwt.sign({ email }, JWT_SECRET);
};

const getStatus = (score, threshold) => {
  return score >= threshold ? "accepted" : "rejected";
}

const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return null;
  }
};

const sendVerificationEmail = async (email, token) => {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/verify/${token}`;

    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
      to: email,
      subject: "Verify your email - Recruitmate",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Email Verification - Recruitmate</h2>
                    <p>Hello,</p>
                    <p>Please click the link below to verify your email address:</p>
                    <a href="${verificationLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Verify Email</a>
                    <p>If you didn’t request this email verification, please ignore this email.</p>
                    <p><strong>Note:</strong> This link will expire in 1 hour for security reasons.</p>
                    <br>
                    <p>Best regards,<br>Recruitmate Team</p>
                </div>
            `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Verification email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending verification email:", error);
    throw new Error("Failed to send verification email");
  }
};

const sendPasswordResetEmail = async (email, token) => {
  try {
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset - Recruitmate",
      html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Password Reset - Recruitmate</h2>
                    <p>Hello,</p>
                    <p>Please click the link below to reset your password:</p>
                    <a href="${resetLink}" style="display: inline-block; background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin: 20px 0;">Reset Password</a>
                    <p>If you didn’t request this password reset, please ignore this email.</p>
                    <p><strong>Note:</strong> This link will expire in 15 minutes for security reasons.</p>
                    <br>
                    <p>Best regards,<br>Recruitmate Team</p>
                </div>
            `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Password reset email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending password reset email:", error);
    throw new Error("Failed to send password reset email");
  }
};

const extractEmail = async (buffer) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const data = await pdf(buffer);
  const text = data.text;
  const matches = text.match(emailRegex);
  const email = matches && matches.length > 0 ? String(matches[0]) : null;
  return email;
};

const cosineSimilarity = (vecA, vecB) => {
  const dot = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dot / (magA * magB);
};

const getScore = async (buffer, jobDescription) => {
  try {
    const data = await pdf(buffer);
    const resumeText = data.text;

    if (!embedder) throw new Error("Model not loaded yet");

    const [resumeEmbedding, jobEmbedding] = await Promise.all([
      embedder(resumeText, { pooling: "mean", normalize: true }),
      embedder(jobDescription, { pooling: "mean", normalize: true }),
    ]);

    const score = cosineSimilarity(
      resumeEmbedding.data,
      jobEmbedding.data
    );

    return (score * 100);
  } catch (error) {
    console.error("Error calculating semantic similarity:", error);
    throw new Error("Failed to calculate similarity score");
  }
};

const extractNameFromFilename = (filename) => {
  const namePart = filename.replace(/\.[^/.]+$/, ""); 
  const cleanName = namePart.replace(/(resume|cv)/gi, "").trim();
  const parts = cleanName.split(/[_\-\s]+/).filter(Boolean);
  const formattedName = parts
    .map(
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
  return formattedName || "Unknown";
};

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      from: process.env.FROM_EMAIL || process.env.EMAIL_USER,
      to,
      subject,
      html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send email");
  }
};

module.exports = {
  generateVerificationToken,
  verifyToken,
  sendVerificationEmail,
  extractEmail,
  getScore,
  extractNameFromFilename,
  getStatus,
  sendEmail,
  sendPasswordResetEmail,
};
