const { pool } = require("../lib/db");
const { sendEmail } = require("../utils");

const sendMail = async (req, res) => {
    const { jobId, body, subject, status } = req.body;
    console.log(body);
    const candidatesResult = await pool.query(
        "SELECT name, email FROM candidates WHERE job_id = $1 AND status = $2",
        [jobId, status]
    );
    const candidates = candidatesResult.rows;

    for (const candidate of candidates) {
        const emailContent = `
            <h3>Dear ${candidate.name}!</h3>
            <p>${body}</p>
        `;
        await sendEmail(candidate.email, subject, emailContent);
    }

    res.status(200).json({ message: "Acceptance emails sent successfully" });
};

module.exports = { sendMail };