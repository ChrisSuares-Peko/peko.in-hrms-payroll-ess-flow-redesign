const mongoose = require('mongoose');

const employeeDocumentSchema = new mongoose.Schema({
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
    name: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
        required: false
    }
}, { timestamps: true });

employeeDocumentSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
        delete ret.createdAt;
        delete ret.updatedAt;
    },
});


const EmployeeDocument = mongoose.model('EmployeeDocument', employeeDocumentSchema);

module.exports = EmployeeDocument;
