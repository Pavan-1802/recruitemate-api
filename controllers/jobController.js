const { pool } = require("../lib/db");
const { getScore, getStatus } = require("../utils");

const createJob = async (req, res) => {
  const { title, description, threshold } = req.body;
  const userId = req.userId;
  try {
    const newJob = await pool.query(
      `INSERT INTO jobs (user_id, title, description, threshold)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, title, description, threshold]
    );

    res.status(201).json(newJob.rows[0]);
  } catch (error) {
    console.error("Error creating job:", error);
    res.status(500).json({ error: "Failed to create job" });
  }
};

const getJobs = async (req, res) => {
  const userId = req.userId;
  try {
    const jobs = await pool.query("SELECT * FROM jobs WHERE user_id = $1", [
      userId,
    ]);

    res.status(200).json(jobs.rows);
  } catch (error) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ error: "Failed to fetch jobs" });
  }
};

const editJob = async (req, res) => {
  const { id } = req.params;
  const { title, description, threshold } = req.body;
  const userId = req.userId;

  try {
    const result = await pool.query(
      "UPDATE jobs SET title = $1, description = $2, threshold = $3 WHERE id = $4 AND user_id = $5 RETURNING *",
      [title, description, threshold, id, userId]
    );

    const candidates = await pool.query(
      "SELECT * FROM candidates WHERE job_id = $1",
      [id]
    );

    for (const candidate of candidates.rows) {
      const score = await getScore(candidate.resume, description);
      const status = getStatus(score, threshold);
      await pool.query(
        "UPDATE candidates SET score = $1, status = $2 WHERE id = $3",
        [score, status, candidate.id]
      );
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error("Error updating job:", error);
    res.status(500).json({ error: "Failed to update job" });
  }
};

const deleteJob = async (req, res) => {
  const { id } = req.params;
  const userId = req.userId;
  try {
    const result = await pool.query(
      "DELETE FROM jobs WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Job not found" });
    }

    await pool.query(
      "DELETE FROM candidates WHERE job_id = $1",
      [id]
    );

    res.status(200).json({ message: "Job deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error);
    res.status(500).json({ error: "Failed to delete job" });
  }
};

module.exports = { createJob, getJobs, deleteJob, editJob };
