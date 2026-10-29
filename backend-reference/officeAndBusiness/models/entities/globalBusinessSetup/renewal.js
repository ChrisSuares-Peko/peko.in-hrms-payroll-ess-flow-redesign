const mongoose = require("mongoose");

// Cache of Global Business Setup renewal requests pulled from Base93 (via companySetup).
// Stores ONLY static fields + `due_date` (rarely changes; reconciled on detail
// fetch). Volatile vendor fields like `status` and `priority` are not cached —
// they're always read live from Base93 on detail view.

const GlobalBusinessSetupRenewalSchema = new mongoose.Schema(
    {
        vendor_renewal_id: { type: String, required: true, unique: true, index: true },
        reference_id:      { type: String, required: true, index: true },
        user_id:           { type: Number },

        renewal_type:      { type: String },
        company_name:      { type: String },
        country_name:      { type: String },
        freezone:          { type: String },
        due_date:          { type: Date },
        application_id:    { type: String, index: true },

        vendor_created_at: { type: Date },
        synced_at:         { type: Date, default: Date.now },
    },
    { timestamps: true }
);

module.exports = mongoose.model("GlobalBusinessSetupRenewal", GlobalBusinessSetupRenewalSchema);
