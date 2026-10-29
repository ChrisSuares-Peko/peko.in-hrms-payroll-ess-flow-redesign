const mongoose = require('mongoose');

const bonusSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true,
    },
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    bonusDate: {
        type: Date,
        required: true
    },
    // bonusPercentage: {
    //     type: Number,
    //     required: true
    // },
    bonusAmount: {
        type: Number,
        default: 0
    },
    // Sub-category shown in the merged "Bonus & Incentives" form — purely descriptive,
    // doesn't change how the amount is calculated or paid.
    type: {
        type: String,
        enum: ['BONUS', 'JOINING_REFERRAL_BONUS', 'COMMISSION', 'LEAVE_ENCASHMENT', 'SPOT_AWARD'],
        default: 'BONUS'
    },
    paymentStatus: {
        type: String,
        enum: ['PAID', 'UNPAID'],
        default: 'UNPAID'
    }
}, { timestamps: true });

bonusSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const Bonus = mongoose.model('Bonus', bonusSchema, 'bonus');

module.exports = Bonus;
