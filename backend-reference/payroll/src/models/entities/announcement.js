const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
  },
  subject: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: ['MAILED', 'FAILED', 'PENDING'],
    required: true,
  },
  excludedEmployees: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
  }],
}, { timestamps: true });

announcementSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = Announcement;
