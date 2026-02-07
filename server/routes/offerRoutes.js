const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");

// No default image
let currentOffer = {
  image: ""
};

function isValidImage(image) {
  if (!image || typeof image !== "string") return false;
  if (image.startsWith("http") || image.startsWith("/")) return true;
  if (image.startsWith("data:image")) {
    const parts = image.split(",");
    if (parts.length !== 2) return false;
    const base64 = parts[1];
    const sizeBytes = (base64.length * 3) / 4;
    return sizeBytes <= 3 * 1024 * 1024; // 3MB
  }
  return false;
}

// Public route (for home page)
router.get("/", (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json(currentOffer);
});

// Admin only update
router.post("/", auth, (req, res) => {
  const { image } = req.body || {};
  if (!isValidImage(image)) {
    return res.status(400).json({ success: false, message: "Invalid image" });
  }
  currentOffer.image = image;
  res.json({ success: true });
});

module.exports = router;
