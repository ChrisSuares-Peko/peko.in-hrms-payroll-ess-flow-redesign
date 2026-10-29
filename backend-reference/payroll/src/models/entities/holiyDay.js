const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
  },
  title: {
    type: String,
    required: true
  },
  isAllDay: {
    type: Boolean,
    required: true
  },
  start: {
    type: Date,
    required: true
  },
  end: {
    type: Date,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  sendPriorEmailDate:{
    type: Date,
    required: true
  },
  isEmailSent: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

holidaySchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});


const Holiday = mongoose.model('Holiday', holidaySchema);

module.exports = Holiday;
