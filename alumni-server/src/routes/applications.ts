import express from "express";
import db from "../db.js";

const router = express.Router();

// --- GET single application by ID ---
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [rows] = await db.execute(
      "SELECT * FROM applications WHERE id = ?",
      [id]
    );
    res.json(rows[0] || null);
  } catch (err) {
    console.error("Get application error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- GET all applications for a student ---
router.get("/mine", async (req, res) => {
  try {
    const uid = String(req.query.uid || "");
    if (!uid) return res.status(400).json({ error: "Missing uid" });

    const [rows] = await db.execute(
      "SELECT * FROM applications WHERE student_uid = ? ORDER BY created_at DESC",
      [uid]
    );
    res.json(rows);
  } catch (err) {
    console.error("Applications mine error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- UPDATE application status ---
router.put("/:id/status", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { status, requestedFields } = req.body;

    await db.execute(
      "UPDATE applications SET status = ?, payload = JSON_MERGE_PATCH(payload, ?) WHERE id = ?",
      [status, JSON.stringify({ requestedFields }), id]
    );

    res.json({ ok: true });
  } catch (err) {
    console.error("Update application status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// --- CREATE new application ---
router.post("/", async (req, res) => {
  try {
    const { student_uid, type, payload } = req.body;

    const safeUid = student_uid ?? null;
    const safeType = type ?? null;
    const safePayload = payload ? JSON.stringify(payload) : null;

    await db.execute(
      "INSERT INTO applications (student_uid, type, payload) VALUES (?, ?, ?)",
      [safeUid, safeType, safePayload]
    );

    res.status(201).json({ message: "Application submitted successfully" });
  } catch (err) {
    console.error("Submit application error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
