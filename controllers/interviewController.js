const { pool } = require("../lib/db");

const scheduleInterview = async (req, res) => {
  const userId = req.userId;
  const { candidateId, startTime, duration, reminder, link } = req.body;
  try {
    const newInterview = await pool.query(
      `INSERT INTO interviews (candidate_id, user_id, start_time, duration, reminder, link)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [candidateId, userId, startTime, duration, reminder, link]
    );
    await pool.query("UPDATE candidates SET status = $1 WHERE id = $2", [
      "interview scheduled",
      candidateId,
    ]);
    res.status(201).json(newInterview.rows[0]);
  } catch (error) {
    console.error("Error scheduling interview:", error);
    res.status(500).json({ error: "Failed to schedule interview" });
  }
};

const fetchAcceptedCandidates = async (req, res) => {
  const userId = req.userId;
  try {
    const acceptedCandidates = await pool.query(
      `SELECT c.*, j.title AS job_title
       FROM candidates c
       JOIN jobs j ON c.job_id = j.id
       WHERE j.user_id = $1 AND c.status = 'accepted'
       ORDER BY c.score DESC`,
      [userId]
    );
    res.status(200).json(acceptedCandidates.rows);
  } catch (error) {
    console.error("Error fetching accepted candidates:", error);
    res.status(500).json({ error: "Failed to fetch accepted candidates" });
  }
};

const getInterviews = async (req, res) => {
  const userId = req.userId;
  try {
    const interviews = await pool.query(
      "SELECT i.*, c.name, j.title FROM interviews i JOIN candidates c ON i.candidate_id = c.id JOIN jobs j ON c.job_id = j.id WHERE i.user_id = $1",
      [userId]
    );
    res.status(200).json(interviews.rows);
  } catch (error) {
    console.error("Error fetching interviews:", error);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
};

const cancelInterview = async (req, res) => {
  const { id } = req.params;
  try {
    const candidateIdResult = await pool.query(
      "SELECT candidate_id FROM interviews WHERE id = $1",
      [id]
    );
    const candidateId = candidateIdResult.rows[0].candidate_id;
    await pool.query("DELETE FROM interviews WHERE id = $1", [id]);
    await pool.query("UPDATE candidates SET status = $1 WHERE id = $2", [
      "accepted",
      candidateId,
    ]);
    res.status(200).json({ message: "Interview cancelled successfully" });
  } catch (error) {
    console.error("Error cancelling interview:", error);
    res.status(500).json({ error: "Failed to cancel interview" });
  }
};

const rescheduleInterview = async (req, res) => {
  const { id } = req.params;
  const { startTime, duration, reminder, link } = req.body;
  console.log("Rescheduling interview with data:", { startTime, duration, reminder, link });
  try {
    const updatedInterview = await pool.query(
      `UPDATE interviews
            SET start_time = $1, duration = $2, reminder = $3, link = $4
            WHERE id = $5
            RETURNING *`,
      [startTime, duration, reminder, link, id]
    );
    res.status(200).json(updatedInterview.rows[0]);
  } catch (error) {
    console.error("Error rescheduling interview:", error);
    res.status(500).json({ error: "Failed to reschedule interview" });
  }
};

module.exports = {
  scheduleInterview,
  getInterviews,
  cancelInterview,
  rescheduleInterview,
  fetchAcceptedCandidates,
};
