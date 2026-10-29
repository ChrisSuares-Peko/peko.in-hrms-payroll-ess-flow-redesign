const mongoose = require("mongoose");

// Cache of Global Business Setup applications pulled from Base93 (via companySetup).
// Stores ONLY static/self-owned fields — no volatile vendor state like
// `status` (Base93 owns those transitions). Dynamic fields are always read
// from Base93 on detail fetch; that same call reconciles any drift on the
// static fields we do cache.

const GlobalBusinessSetupApplicationSchema = new mongoose.Schema(
    {
        vendor_app_id:     { type: String, required: true, unique: true, index: true },
        reference_id:      { type: String, required: true, index: true },
        user_id:           { type: Number },

        proposed_name:     { type: String },
        country:           {
            _id:  String,
            name: String,
        },
        type:              { type: String },
        freezone:          { type: String },
        // is_paid kept: flips only on our payment event, never silently on Base93.
        is_paid:           { type: Boolean, default: false, index: true },

        provider_id:       { type: String },
        application_id:    { type: String },
        tracking_id:       { type: String },

        vendor_created_at: { type: Date },
        synced_at:         { type: Date, default: Date.now },
    },
    { timestamps: true }
);

GlobalBusinessSetupApplicationSchema.index({ reference_id: 1, is_paid: 1 });

module.exports = mongoose.model("GlobalBusinessSetupApplication", GlobalBusinessSetupApplicationSchema);
