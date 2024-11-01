const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect("mongodb://mongo-service:27017/mydb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define Report Schema for Aggregate Data
const reportSchema = new mongoose.Schema({
  avgContentPercentage: Number,
  avgLength: Number,
  totalSequences: Number,
  motifCounts: Object,
  motifUsed: String, // Track the motif used for this report
  timestamp: { type: Date, default: Date.now },
});

const Report = mongoose.model("Report", reportSchema);

// Middleware
app.use(express.json());

// Helper function to calculate aggregate data from sequences
const calculateAggregates = (sequences) => {
  const totalSequences = sequences.length;
  let totalContentPercentage = 0;
  let totalLength = 0;
  let motifCounts = {};

  sequences.forEach((seq) => {
    totalContentPercentage += seq.contentPercentage;
    totalLength += seq.length;

    // Count motif occurrences
    seq.motifMatches.forEach((match) => {
      motifCounts[match.match] = (motifCounts[match.match] || 0) + 1;
    });
  });

  const avgContentPercentage = (
    totalContentPercentage / totalSequences
  ).toFixed(2);
  const avgLength = (totalLength / totalSequences).toFixed(2);

  return { avgContentPercentage, avgLength, totalSequences, motifCounts };
};

// Route to fetch data from the DNA analyzer and create a report
app.post("/generate-report", async (req, res) => {
  const { motif } = req.body;
  const motifUsed = motif || "GC";

  try {
    // Fetch sequences from DNA Analyzer Service, filtering by motifUsed
    const response = await axios.get("http://analyzer-service:3000/sequences");
    const sequences = response.data.filter(
      (seq) => seq.motifUsed === motifUsed
    );

    if (sequences.length === 0) {
      return res
        .status(404)
        .json({ error: `No sequences found for motif: ${motifUsed}` });
    }

    // Calculate aggregates for the specific motif
    const reportData = calculateAggregates(sequences);
    reportData.motifUsed = motifUsed; // Record motif used for this report

    // Save the report in MongoDB
    const report = new Report(reportData);
    await report.save();
    res.json(report);
  } catch (error) {
    console.error("Error generating report:", error);
    res
      .status(500)
      .json({ error: "Failed to generate report" + JSON.stringify(error) });
  }
});

// Route to get all reports
app.get("/reports", async (req, res) => {
  const reports = await Report.find();
  res.json(reports);
});

// Start Server
app.listen(port, () => {
  console.log(`Genetic Data Aggregator running on port ${port}`);
});
