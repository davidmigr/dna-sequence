const express = require("express");
const mongoose = require("mongoose");
const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect("mongodb://mongo-service:27017/mydb", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Define DNA Sequence Schema
const dnaSchema = new mongoose.Schema({
  sequence: String,
  contentPercentage: Number,
  length: Number,
  motifMatches: Array,
  motifUsed: String, // Track the motif used for analysis
  timestamp: { type: Date, default: Date.now },
});

const DnaSequence = mongoose.model("DnaSequence", dnaSchema);

// Middleware
app.use(express.json());

// Helper function to calculate motif-specific or GC content
const calculateContentPercentage = (sequence, motif = "GC") => {
  let count;
  if (motif === "GC") {
    count = (sequence.match(/[GC]/gi) || []).length;
  } else {
    const regex = new RegExp(motif, "gi");
    count = (sequence.match(regex) || []).length;
  }
  return ((count / sequence.length) * 100).toFixed(2);
};

// Helper function to find motif occurrences
const findMotifs = (sequence, motif) => {
  const regex = new RegExp(motif, "gi");
  let match;
  const matches = [];
  while ((match = regex.exec(sequence)) !== null) {
    matches.push({ index: match.index, match: match[0] });
  }
  return matches;
};

// Routes
app.post("/analyze", async (req, res) => {
  const { sequence, motif } = req.body;
  if (!sequence || typeof sequence !== "string") {
    return res.status(400).json({ error: "Invalid DNA sequence" });
  }

  // Determine the motif to analyze
  const motifUsed = motif || "GC";
  const contentPercentage = calculateContentPercentage(sequence, motifUsed);
  const motifMatches = findMotifs(sequence, motifUsed);

  const dnaData = new DnaSequence({
    sequence,
    contentPercentage: parseFloat(contentPercentage),
    length: sequence.length,
    motifMatches,
    motifUsed,
  });

  await dnaData.save();
  res.json(dnaData);
  console.log(`Analyzed the DNA sequence with id ${dnaData._id}`);
});

app.get("/sequences", async (req, res) => {
  const sequences = await DnaSequence.find();
  res.json(sequences);
});

// Start Server
app.listen(port, () => {
  console.log(`DNA Analysis Service running on port ${port}`);
});
