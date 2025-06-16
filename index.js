require("dotenv").config();
const express = require("express");
const axios = require("axios");
const admin = require("firebase-admin");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// 🔥 Firebase Setup - HARDCODED FALLBACK (bypass all credential issues)
let firebaseConfig;
try {
  // Try file first
  firebaseConfig = require("./firebase-service-account.json");
  console.log("✅ Using file-based Firebase credentials");
} catch (fileError) {
  console.log("📁 File not found, trying environment variable...");
  try {
    const fixedConfig = process.env.FIREBASE_CONFIG.replace(/\\\\n/g, '\n');
    firebaseConfig = JSON.parse(fixedConfig);
    console.log("✅ Using environment Firebase credentials");
  } catch (envError) {
    console.log("🔧 Environment variable failed, using hardcoded credentials...");
    // HARDCODED CREDENTIALS (temporary tactical fix)
    firebaseConfig = {
      "type": "service_account",
      "project_id": "project-pig-1a8d7",
      "private_key_id": "2c629fe1d6656519500650c31aaf80b823fce7d0",
      "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC4H8c020sujUtw\nbtw3mfQ7PjSUVz8/5Se69tHi8sBn1mIiLkuh9ipqdrMN5C60d49E5aCkTxSXP+F3\n+TwxoWbRANubJ+x3KBKQgY2nYDSHwABrUuUKJpSzFAFMITLXO5Lxvl8xj6GN9Vdo\nghUZ24fMuemum6py7W28K508xD4fQlifuFQEPFN3vHFdpmOL7q4+J4OLBUwHbj19\nkQWgo9aftR3L6/EfmgYbxVI5dlfucEF5GtjVloxTOT5eqrC3PzQy87SdZKEmu2mg\nIjPm9/tiN0hvsioP4DeXrDTN0aIapQQo5DfXBjDaCpSLPLYR/RSpCBxjBTeF1u8u\n1S38mGWzAgMBAAECggEAOHB9RsWFyTJEkqVY2a5WgCZ0RZhs6fAbeqMX+UJCGlJL\n6IBabL4hiFr0TejJLEaN4yekU1luTWKmgXkjq273Lk/eATR+tpPRBPzBaDIESCxh\ntIRHcxIaeL5EG4r9o54+T930HiQR+IrhDUb6ot95RBck+4H6AJqpDYos+6iIBlpw\nVSGyiUpFaBRUd5oJQ1L6BgJFek0RphmG3cLZ60+98pNIYOhN9FeumIPQdhuxdbjy\nzAYXxY6ir7h3VB4BizeO4hSYNQgkIfOnJWkrMhjeKL/4Wkt41GtEKQiEflv4FDAA\nvGPcEK0Q5QDWPL5SI7R7BUW5A3eqtZVpUWUtC/XbwQKBgQD9KYnD0yTzsfeggUOI\nwAJDwIRUGkpvpwbVlJAic2AXYkO+HGT1D0k4b1NwLWZFJPLnqi/JmlFGaNTgAwha\nCBy13jfkkwpFyo9ynpRSzxYtbfI/XVJAKGt7LbFTF6N7vXu+rkpwjvenGjMqca9h\nUG0W8qK6BVJgfuyWXX/dC/MGEwKBgQC6MCGyXpMXAP2A+VukyTGBdFF+nrAhsqwh\ngzaxk+3NjzaxBg7rSQppBkrmzSWtxAR/4rW+gdm6t1CkLwqE88GN0ZYaAdyKTh5d\n1LTg9mRRazoGH+xKzjXXKIjZFgRFEsCJBq4cZlvRoicr8YFq51Nf7Z2xdhFeEIJz\nvyrzq42V4QKBgQCVZrIakry35EsSubY1ObscaLyvNWTAR33NBYOaESSgKCl6RB+A\nT6kSWQCQrvovzAJdnR3eh+d2+d7G5INFPoxS9/VcOzpQvZ2yMsutovCflsbjhhtI\nKZJkey6ursCYAdbJTOo5SuX0A442eijZ8TCv3jkSNpnKwJy2kC8pMCgXaQKBgHep\nR37j2ZUHReYGXSfjRrX0lAvU4U5HDuna8uPeNw/N41CSnDQLlW06Zhk/799mA55N\njpEJ0211M5bRxOj94H/NG7NLTvp0in+znSyYLpFFYN1e1vac4W2O16TtyYC7NJLc\ngDowbwKkPJi5dnvGgIc+qALN5wuVgMHzMx+4Oh8BAoGAcrXqfUPtI5XNXrbO8duB\nMttP48Km6ZEQY/EKfiFmde9W2EQumeGMoZHm9Ih+Z6lEJlLx0i3nnufm6NW9lFaM\n3RF3SNxSMvNPN/QWmP1bPIzaBZjQtkFTF+YUDVU7ghTQ7nSnkr7XL0nQyEGgCSQN\naosdT1TyZG1vpZLqYWxaKiM=\n-----END PRIVATE KEY-----\n",
      "client_email": "firebase-adminsdk-fbsvc@project-pig-1a8d7.iam.gserviceaccount.com",
      "client_id": "103476632740940565991",
      "auth_uri": "https://accounts.google.com/o/oauth2/auth",
      "token_uri": "https://oauth2.googleapis.com/token",
      "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
      "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40project-pig-1a8d7.iam.gserviceaccount.com",
      "universe_domain": "googleapis.com"
    };
    console.log("✅ Using hardcoded Firebase credentials");
  }
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