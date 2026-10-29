const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  name: String,
  url: String,
}, { _id: false });

/**
 * details belongs to corporate 
 */
const corporateUserSchema = new mongoose.Schema({
  _id: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  wps: {
    employerId: String,
    employerRoutingCode: String,
    employerReference: String,
    registrationStatus: {
      type: String,
      enum: ['NONREGISTERED', 'INPROGRESS', 'FAILD', 'REGISTERED'],
      default: 'NONREGISTERED'
    },
    wpsDocuments: {
      type: [documentSchema],
      default: []
    }
  },
  isFreeZoneCompany: {
    type: Boolean,
    default: false
  },
  companyName: {
    type: String
  },
  logo: {
    type: String
  },
  country: {
    type: String
  },
  city: {
    type: String
  },
  mobileNo: {
    type: String
  },
  website: {
    type: String
  },
  onboardStatus:{
    type:String
  },
  isSkippedDasboard:{
    type:Boolean
  }
}, { timestamps: true });

corporateUserSchema.set('toJSON', {
  transform: function (doc, ret) {
    ret.id = ret._id;
    delete ret._id;
    delete ret.__v;
  },
});


const CorporateUser = mongoose.model('CorporateUser', corporateUserSchema);

module.exports = CorporateUser;
