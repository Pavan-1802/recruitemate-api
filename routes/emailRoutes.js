const {
  sendMail,
} = require("../controllers/emailControllers");
const express = require("express");
const router = express.Router();

router.post("/send-email", sendMail);

module.exports = router;
