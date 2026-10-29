const mongoose = require("mongoose");

const incrementSchema = new mongoose.Schema({
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
    basicSalary: {
        type: Number,
        required: true
    },
    // incrementPercentage: {
    //     type: Number,
    //     required: true
    // },
    amount: {
        type: Number,
        min: 0,
        default: 0,
        required: true
    },
    // incrementAmount: {
    //     type: Number,
    //     min: 0,
    //     default: 0,
    //     required: true
    // },
    newBasicSalary: {
        type: Number,
        min: 0,
        required: true
    },
    effectiveDate: {
        type: Date,
        required: true
    },
    attachment: {
        type: String
    },
    status: {
        type: String,
        enum: ['reflected', 'pending'],
        default: 'pending'
    },
    incrementType: {
        type: String,
        enum: ['percentage', 'flat']
    }

}, { timestamps: true });

incrementSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
})

const Increment = mongoose.model('Increment', incrementSchema, 'increment');

module.exports = Increment;