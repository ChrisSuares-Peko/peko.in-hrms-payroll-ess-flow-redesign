const mongoose = require("mongoose");

// Tracks whether we've done the one-time fallback backfill of Base93 data into
// our local cache for each user + each collection. Without this flag, a single
// submission (which writes to the cache) would flip `hasAnyApplication` to true
// and prevent the backfill from ever running for a user who already had older
// applications on the vendor side.

const GlobalBusinessSetupUserSyncSchema = new mongoose.Schema(
    {
        reference_id:          { type: String, required: true, unique: true, index: true },
        user_id:               { type: Number },
        applications_synced_at: { type: Date, default: null },
        renewals_synced_at:     { type: Date, default: null },
    },
    { timestamps: true }
);

module.exports = mongoose.model("GlobalBusinessSetupUserSync", GlobalBusinessSetupUserSyncSchema);
