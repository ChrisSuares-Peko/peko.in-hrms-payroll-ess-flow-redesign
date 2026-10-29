const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true,
    },
    assetName: {
        type: String,
        required: true,
    },
    assetId: {
        type: String,
        required: true,
    },
    purchasedDate: {
        type: Date,
        required: true,
    },
    assetType: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ['ACTIVE', 'AVAILABLE', 'IN USE'],
        required: true,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    batchNo: {
        type: String
    }
}, { timestamps: true });

assetSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});

const Asset = mongoose.model('Asset', assetSchema);

module.exports = Asset;
