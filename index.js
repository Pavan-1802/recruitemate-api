const cors = require("cors");
require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const { connectToDb } = require("./lib/db");

const authRoutes = require("./routes/authRoutes");
const jobRoutes = require("./routes/jobRoutes");
const candidateRoutes = require("./routes/candidateRoutes");
const emailRoutes = require("./routes/emailRoutes");
const aiRoutes = require("./routes/aiRoutes");
const resumeRoutes = require("./routes/resumeRoutes");


app.use(cors());
app.use(express.json());
connectToDb();

app.use("/ai", aiRoutes);
app.use("/jobs", jobRoutes);
app.use("/auth", authRoutes);
app.use("/candidates", candidateRoutes);
app.use("/emails", emailRoutes);
app.use("/resumes", resumeRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome to recruitmate API" });
});

app.listen(port, () => {
  console.log("Server running at http://localhost:" + port);
});
