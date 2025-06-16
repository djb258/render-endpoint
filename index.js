require("dotenv").config();
const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Firebase Setup (dual-mode for Render or local) - HARDENED
let firebaseConfig;
if (process.env.FIREBASE_CONFIG) {
  // Fix malformed newlines from Render environment variables
  const fixedConfig = process.env.FIREBASE_CONFIG.replace(/\\\\n/g, '\n');
  firebaseConfig = JSON.parse(fixedConfig);
} else {
  firebaseConfig = require("./firebase-service-account.json");
}

admin.initializeApp({
  credential: admin.credential.cert(firebaseConfig),
});

const db = admin.firestore();

// ------------------ ROUTES ------------------

// ✅ Health check with Firebase validation
app.get("/health", async (req, res) => {
  try {
    // Test Firebase connection
    await db.collection("health_check").doc("test").set({
      timestamp: new Date().toISOString(),
      status: "healthy"
    });
    res.status(200).json({ 
      status: "ok", 
      source: "render-endpoint",
      firebase: "connected"
    });
  } catch (error) {
    res.status(500).json({ 
      status: "degraded", 
      source: "render-endpoint",
      firebase: "error",
      error: error.message
    });
  }
});

// ✅ Firestore write test
app.post("/test-save", async (req, res) => {
  try {
    const { agent_id, message } = req.body;
    await db.collection("agent_ingest_queue").add({
      agent_id,
      message,
      timestamp_created: new Date().toISOString(),
    });
    res.status(200).json({ result: "Saved to Firebase" });
  } catch (error) {
    console.error("Write error:", error);
    res.status(500).json({ error: "Failed to write to Firebase" });
  }
});

// ✅ Generate UI via GPT-4 or Claude
app.post("/generate-ui", async (req, res) => {
  const { prompt, model = "gpt-4o", docId } = req.body;

  try {
    const apiKey =
      model === "claude"
        ? process.env.CLAUDE_API_KEY
        : process.env.OPENAI_API_KEY;

    let responseText = "";

    if (model === "claude") {
      const r = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-3-opus-20240229",
          max_tokens: 1024,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
        }
      );
      responseText = r.data.content?.[0]?.text || "Error: No Claude content";
    } else {
      const r = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: model,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
        }
      );
      responseText =
        r.data.choices?.[0]?.message?.content || "Error: No GPT content";
    }

    // Write to Firebase with error handling
    await db.collection("agent_task").doc(docId).update({
      output_code: responseText,
      validated: false,
      timestamp_last_touched: new Date().toISOString(),
    });

    res.json({ status: "success", responseText });
  } catch (e) {
    console.error("🔥 LLM error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// ------------------ START SERVER ------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🔥 render-endpoint listening on port ${PORT}`)
);

