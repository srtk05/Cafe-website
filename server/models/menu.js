const mongoose = require("mongoose");

const menuSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },

    price: {
      type: Number,
      required: true,
      min: 0
    },

    category: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },

    available: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true   // 👈 createdAt & updatedAt (VERY useful later)
  }
);

module.exports = mongoose.model("Menu", menuSchema);
