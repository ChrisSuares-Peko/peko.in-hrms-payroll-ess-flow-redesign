const mongoose = require('mongoose');

const documentRequestSchema = new mongoose.Schema({
  corporateUser: {
    type: String,
    ref: 'CorporateUser',
    required: true,
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true,
  },
  userId: {
    type: String,
  },
  documentType: {
    type: String,
    required: true,
  },
  purpose: {
    type: String,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'rejected'],
    default: 'pending',
  },
  uploadedDocument: {
    name: String,
    url: String,
    format: String,
    uploadedAt: Date,
    uploadedBy: String,
  },
  remarks: {
    type: String,
  },
  completedAt: {
    type: Date,
  },
}, { timestamps: true });

documentRequestSchema.index({ corporateUser: 1, status: 1 });
documentRequestSchema.index({ employee: 1, createdAt: -1 });

documentRequestSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});

module.exports = mongoose.model('DocumentRequest', documentRequestSchema);
