const mongoose = require('mongoose');

const form24QSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        required: true,
    },
   
    quarter: {
        type: String,
        required: true,
        enum: ['Q1', 'Q2', 'Q3', 'Q4', 'Annual'],
    },
    file: {
        type: String,
        required: true,
    },
    data: {
        tan: { type: String, required: true },
        panOfDeductor: { type: String, required: true },
        financialYear: { type: String, required: true },
        assessmentYear: { type: String, required: true },
        statementFiledEarlier: { type: String },
        nameOfEmployer: { type: String },
        typeOfDeductor: { type: String },
        branch: { type: String },
        flatNo1: { type: String },
        buildingName1: { type: String },
        street1: { type: String },
        area1: { type: String },
        city1: { type: String },
        state1: { type: String },
        pin1: { type: String },
        phone1: { type: String },
        email: { type: String },
        name: { type: String },
        flatNo2: { type: String },
        buildingName2: { type: String },
        street2: { type: String },
        area2: { type: String },
        city2: { type: String },
        state2: { type: String },
        pin2: { type: String },
        phone2: { type: String },
        tdsAmount: { type: String }
    }
}, { timestamps: true });

module.exports = mongoose.model('Form24Q', form24QSchema);
