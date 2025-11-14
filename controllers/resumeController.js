const { pool } = require("../lib/db");

const fetchResumes = async (req, res) => {
    const userId = req.userId;
    console.log('Fetching resumes for user ID:', userId);
    try {
        const query = 'select c.id, c.name, c.email, c.resume, c.score, j.id as job_id, j.title as job_title from candidates c join jobs j on c.job_id = j.id where j.user_id = $1 AND c.status = $2';
        const { rows } = await pool.query(query, [userId,'on hold']);
        res.status(200).json({ resumes: rows });
    } catch (error) {
        console.error('Error fetching resumes:', error);
        res.status(500).json({ error: 'Failed to fetch resumes' });
    }
}

const updateResumeStatus = async (req, res) => {
    const { candidateId } = req.params;
    const { status } = req.body;
    try {
        const query = 'UPDATE candidates SET status = $1 WHERE id = $2 RETURNING *';
        const { rows } = await pool.query(query, [status, candidateId]);
        res.status(200).json({ candidate: rows[0] });
    } catch (error) {
        console.error('Error updating resume status:', error);
        res.status(500).json({ error: 'Failed to update resume status' });
    }
}

module.exports = { fetchResumes, updateResumeStatus };