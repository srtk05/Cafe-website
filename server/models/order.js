const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    /* ---------------- CUSTOMER INFO ---------------- */
    customerName: {
      type: String,
      required: true,
      trim: true
    },

    mobileNumber: {
      type: String,
      default: "N/A"
    },

    /* ---------------- ORDER TYPE ---------------- */
    orderType: {
      type: String,
      enum: ["Dine In", "Take Away", "Takeaway"],
      required: true
    },
    /* ---------------- TABLE NUMBER ---------------- */
    tableNumber: {
      type: Number,
      min: 1,
      max: 9,
      required: function () {
        return this.orderType === "Dine In";
      }
    },

    /* ---------------- ITEMS ---------------- */
    cart: [
      {
        item: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        qty: {
          type: Number,
          required: true
        }
      }
    ],

    /* ---------------- TOTAL ---------------- */
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },

    /* ---------------- STATUS ---------------- */
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending"
    },

    /* ---------------- PAYMENT ---------------- */
    paymentMode: {
      type: String,
      enum: ["cash", "online", "unpaid"],
      default: "unpaid"
    },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending"
    }
  },
  {
    timestamps: true   // createdAt & updatedAt auto
  }
);

// Auto-delete orders older than 7 days
orderSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model("Order", orderSchema);
