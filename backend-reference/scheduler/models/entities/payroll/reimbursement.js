const mongoose = require('mongoose');

const reimbursementSchema = new mongoose.Schema({
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
    expenseDate: {
        type: Date,
        required: true
    },
    // managerEmail: {
    //     type: String,
    // },
    supportingDocs: {  //store the url after doc upload
        type: String
    },
    expenseDetails: {
        type: String,
    },
    totalPay: {
        type: Number,
        default: 0
    },
    transferMethod: {
        type: String,
        enum: ['BANK', 'SALARY', 'OTHERS']
    },
    paymentStatus: {
        type: String,
        enum: ['PAID', 'UNPAID'],// processing if it attached to salary calculation
        default: 'UNPAID'
    }
}, { timestamps: true });

reimbursementSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const Reimbursement = mongoose.model('Reimbursement', reimbursementSchema, 'reimbursement');

module.exports = Reimbursement;
