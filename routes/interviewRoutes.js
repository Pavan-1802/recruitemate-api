const express = require("express");
const router = express.Router();
const {
  scheduleInterview,
  getInterviews,
  cancelInterview,
  rescheduleInterview,
  fetchAcceptedCandidates,
} = require("../controllers/interviewController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, scheduleInterview);
router.get("/accepted", authMiddleware, fetchAcceptedCandidates);
router.get("/", authMiddleware, getInterviews);
router.delete("/:id", cancelInterview);
router.put("/:id", rescheduleInterview);

module.exports = router;
