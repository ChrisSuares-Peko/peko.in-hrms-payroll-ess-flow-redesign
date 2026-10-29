const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    corporateUser: {
        type: String,
        ref: 'CorporateUser',
        required: true,
    },
    departmentName: {
        type: String,
    },
    departmentCode: {
        type: String, 
    },
   
}, { timestamps: true });

departmentSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const Department = mongoose.model('Department', departmentSchema);

module.exports = Department;
