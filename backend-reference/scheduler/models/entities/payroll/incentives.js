const mongoose = require('mongoose');

const incentivesSchema = new mongoose.Schema({
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
    //-----------data from api
    incentiveDate: {
        type: Date, 
    },
    monthlyTarget: {
        type: String,
    },
    achievedTarget: {  
        type: String
    },
    achievedSaleInPercent: {
        type: String,
    },
    amount: {
        type: Number,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['PAID', 'UNPAID'],
        default: 'UNPAID'
    }
}, { timestamps: true });

incentivesSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const Incentives = mongoose.model('Incentives', incentivesSchema);

module.exports = Incentives;
