const { extractEmail, getScore, extractNameFromFilename, getStatus } = require("../utils");
const { pool } = require("../lib/db");

const processResumes = async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" });
    }
    const { jobId } = req.params;
    const jobResult = await pool.query(
      "SELECT description, threshold FROM jobs WHERE id = $1",
      [jobId]
    );
    const jobDescription = jobResult.rows[0]?.description || "";
    const jobThreshold = jobResult.rows[0]?.threshold || 0;
    for (const file of req.files) {
      const email = await extractEmail(file.buffer);
      const name = extractNameFromFilename(file.originalname);
      const score = await getScore(file.buffer, jobDescription);
      const status = getStatus(score, jobThreshold);
      await pool.query(
        "INSERT INTO candidates (job_id, email, name, score, status, resume) VALUES ($1, $2, $3, $4, $5, $6)",
        [jobId, email, name, score, status, file.buffer]
      );
    }
    res.status(200).json({ message: "Resumes processed successfully" });
  } catch (error) {
    console.error("Error processing resumes:", error);
    res.status(500).json({ error: "Failed to process resumes" });
  }
};

const updateStatus = async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { status } = req.body;
    await pool.query(
      "UPDATE candidates SET status = $1 WHERE id = $2",
      [status, candidateId]
    );

    res.status(200).json({ message: "Candidate status updated successfully" });
  } catch (error) {
    console.error("Error updating candidate status:", error);
    res.status(500).json({ error: "Failed to update candidate status" });
  }
};


const fetchCandidates = async (req, res) => {
  try {
    const { jobId } = req.params;
    
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "10", 10);
    const offset = (page - 1) * limit;

    const candidatesPromise = pool.query(
      "SELECT * FROM candidates WHERE job_id = $1 ORDER BY score DESC LIMIT $2 OFFSET $3",
      [jobId, limit, offset]
    );

    const totalPromise = pool.query(
      "SELECT COUNT(*) FROM candidates WHERE job_id = $1",
      [jobId]
    );

    const jobPromise = pool.query(
      "SELECT title FROM jobs WHERE id = $1",
      [jobId]
    );

    const [candidatesResult, totalResult, jobResult] = await Promise.all([
      candidatesPromise,
      totalPromise,
      jobPromise,
    ]);

    const totalCandidates = parseInt(totalResult.rows[0].count, 10);
    const totalPages = Math.ceil(totalCandidates / limit);

    res.status(200).json({
      candidates: candidatesResult.rows,
      jobTitle: jobResult.rows[0]?.title,
      totalPages: totalPages,
      currentPage: page,
    });
    
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({ error: "Failed to fetch candidates" });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;
    await pool.query(
      "DELETE FROM candidates WHERE id = $1",
      [candidateId]
    );
    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({ error: "Failed to delete candidate" });
  }
};

module.exports = { processResumes, updateStatus, fetchCandidates, deleteCandidate };
