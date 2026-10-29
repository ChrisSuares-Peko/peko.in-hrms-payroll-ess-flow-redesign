const mongoose = require('mongoose');

const leaveApplicationSchema = new mongoose.Schema({
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
    // //-----------data from api
    // managerEmail: {
    //     type: String,
    //     required: true
    // },
    start: {
        type: Date,
        required: true
    },
    end: {
        type: Date,
        required: true
    },
    // leaveHours: {  //it will be net hours after deducting holidays and off days 
    //     type: Number,
    //     required: true
    // },
    leaveCount: { //netHours / employee day hours
        type: Number,
        required: true
    },
    typeOfLeave: {  //this option will comes under api call with employee id
        type: String,
        enum: ['annualLeave', 'sickLeave', 'parentalLeave', 'sabbaticalLeave', 'studyLeave', 'HajjAndUmrahLeave',
            'maternityLeave', 'officialLeavesAndVacations', 'otherPaidLeaves', 'otherPaidLeaves', 'UNPAID'],
        required: true
    },
    leaveSupportingDocs: {  //store the url after doc upload
        type: String
    },
}, { timestamps: true });

leaveApplicationSchema.set('toJSON', {
    transform: function (doc, ret) {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
    },
});


const LeaveApplication = mongoose.model('LeaveApplication', leaveApplicationSchema);

module.exports = LeaveApplication;
