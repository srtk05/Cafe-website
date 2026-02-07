const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const Gallery = require("../models/gallery");

function isValidReview(text) {
  if (!text) return false;
  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  return lines.length <= 2;
}

function sanitize(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function validateImageData(image) {
  if (!image || typeof image !== "string") return false;
  const match = image.match(/^data:(image\/(jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/);
  if (!match) return false;
  const base64 = match[3];
  const sizeBytes = (base64.length * 3) / 4 - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);
  return sizeBytes <= 2.5 * 1024 * 1024; // 2.5MB
}

// Public: approved gallery items
router.get("/", async (req, res) => {
  try {
    const items = await Gallery.find({ status: "approved" }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to load gallery" });
  }
});

// Public: submit gallery request (pending)
router.post("/", async (req, res) => {
  try {
    const { image, review, name } = req.body || {};

    if (!image || !review || !name) {
      return res.status(400).json({ message: "Image, review, and name are required" });
    }

    if (!isValidReview(review)) {
      return res.status(400).json({ message: "Review must be within 2 lines" });
    }

    if (!validateImageData(image)) {
      return res.status(400).json({ message: "Invalid image data (must be JPEG/PNG/WebP under 2.5MB)" });
    }

    const item = new Gallery({
      image,
      review: sanitize(review),
      name: sanitize(name)
    });

    await item.save();
    res.json({ success: true, message: "Submitted for approval" });
  } catch (err) {
    res.status(500).json({ message: "Failed to submit" });
  }
});

// Admin: pending items
router.get("/pending", auth, async (req, res) => {
  try {
    const items = await Gallery.find({ status: "pending" }).sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Failed to load pending items" });
  }
});

// Admin: approve
router.put("/:id/approve", auth, async (req, res) => {
  try {
    const updated = await Gallery.findByIdAndUpdate(
      req.params.id,
      { status: "approved" },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to approve" });
  }
});

// Admin: reject
router.put("/:id/reject", auth, async (req, res) => {
  try {
    const updated = await Gallery.findByIdAndUpdate(
      req.params.id,
      { status: "rejected" },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Failed to reject" });
  }
});

module.exports = router;
