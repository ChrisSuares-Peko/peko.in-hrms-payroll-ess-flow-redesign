/* eslint-disable no-undef */
const Joi = require('@hapi/joi');
////////////////////Adding System User////////////////////////////////
exports.validateAddingSystemUser = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().required(),
            username: Joi.string().required(),
            email: Joi.string().required().email(),
            mobileNo: Joi.string().required(),
            //isActive: Joi.string().required(), 
            role: Joi.string().required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }

        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

exports.validateGetOtp = (req, res, next) => {
    try {
        const schema = Joi.object({
            mobileNo: Joi.string().required(),
            email: Joi.string().min(6).required().email(),
            scope: Joi.string().required(),
            panNumber: Joi.string().min(6).max(10).required(),
            gstNumber: Joi.string().min(6).max(15).required(),
            resend: Joi.boolean().required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


exports.validateSetNewPassword = (req, res, next) => {
    try {
        const schema = Joi.object({
            password: Joi.string().required(),
            username: Joi.string().required(),
            token: Joi.string().required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Updating SystemUser////////////////////////////

////////////////////Adding Corporate  User////////////////////////////////
exports.validateAddingCorporateUser = (req, res, next) => {
    try {
        // const schema = Joi.object({
        //     // // name: Joi.string().min(3).required(),
        //     // username: Joi.string().min(6).required(),
        //     // email: Joi.string().min(6).required().email(),
        //     // //password: Joi.string().min(6).required(),
        //     // mobileNo: Joi.string().min(6).required(),
        //     // website: Joi.string().min(6).required(),
        //     // country: Joi.string().min(3).required(),
        //     // city: Joi.string().min(3).required(),
        //     // //address: Joi.string().min(6).required(),
        //     // poBox: Joi.string().min(4).required(),
        //     // countryCode: Joi.string().min(1).required(),
        //     // contactPersonName: Joi.string().min(6).required(),
        //     // contactPersonEmail: Joi.string().min(6).required(),
        //     // contactPersonPhone: Joi.string().min(7).required(),
        //     // latLng: Joi.string().min(6).required(),
        //     // logo: Joi.string().min(7).required(),
        //     // isActive: Joi.string().required(),
        //     // registeredBy: Joi.string().min(4).required()
        // });
        // const result = schema.validate(req.body);
        // if (result.error) {
        //     return res.status(203).json({
        //         code: 400,
        //         status: 'error',
        //         errors: [result.error.details[0].message]
        //     });
        // }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Updating System  User////////////////////////////
exports.validateUpdatingSystemUser = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).optional(),
            username: Joi.string().min(3).optional(),
            email: Joi.string().min(6).optional().email(),
            mobileNo: Joi.string().required(),
            isActive: Joi.string().optional(),
            registeredBy: Joi.string().min(4).optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}
////////////////////Updating Corporate User////////////////////////////
exports.validateUpdatingCorporateUser = (req, res, next) => {
    try {
        const schema = Joi.object({
            name: Joi.string().min(3).optional(),
            username: Joi.string().min(3).optional(),
            email: Joi.string().min(6).optional().email(),
            password: Joi.string().min(6).optional(),
            mobileNo: Joi.string().min(6).optional(),
            website: Joi.string().min(6).optional(),
            country: Joi.string().min(3).optional(),
            sector: Joi.string().min(2).optional(),
            activity: Joi.string().min(3).optional(),
            city: Joi.string().min(3).optional(),
            address: Joi.string().min(1).optional(),
            poBox: Joi.string().min(4).optional(),
            countryCode: Joi.string().min(1).optional(),
            contactPersonName: Joi.string().min(6).optional(),
            contactPersonEmail: Joi.string().min(6).optional(),
            contactPersonPhone: Joi.string().min(7).optional(),
            latLng: Joi.string().min(6).optional(),
            logo: Joi.string().min(7).optional(),
            isActive: Joi.string().optional(),
            kycStatus: Joi.string().optional(),
            registeredBy: Joi.string().min(4).optional(),
            packageId: Joi.string().optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}
////////////////////Adding Commission////////////////////////////////


exports.validateAddingCommission = (req, res, next) => {
    try {
        const schema = Joi.object({
            serviceProvider: Joi.string().min(3).required(),
            accessKey: Joi.string().min(1).required(),
            commission: Joi.string().required(),
            surcharge: Joi.string().required(),
            adminCommission: Joi.string().required(),
            merchantCommission: Joi.string().required(),
            commissionType: Joi.string().min(4).required(),
            merchantName: Joi.string().min(3).required(),
            serviceType: Joi.string().min(3).required(),
            vendorName: Joi.string().min(3).required(),
            status: Joi.string().required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Updating Commission////////////////////////////////
exports.validateUpdatingCommission = (req, res, next) => {
    try {
        const schema = Joi.object({
            serviceProvider: Joi.string().min(3).optional(),
            accessKey: Joi.string().min(1).optional(),
            commission: Joi.string().optional(),
            surcharge: Joi.string().optional(),
            adminCommission: Joi.string().optional(),
            merchantCommission: Joi.string().optional(),
            commissionType: Joi.string().min(4).optional(),
            merchantName: Joi.string().min(3).optional(),
            serviceType: Joi.string().min(3).optional(),
            vendorName: Joi.string().min(3).optional(),
            status: Joi.string().optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Adding Notification////////////////////////////////
exports.validateAddingNotification = (req, res, next) => {
    try {
        const schema = Joi.object({
            notificationTitle: Joi.string().min(3).max(150).required(),
            notificationBrief: Joi.string().min(3).max(250).required(),
            notificationCategory: Joi.string().required(),
            notificationTo: Joi.string().required(),
            notificationBy: Joi.string().optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Updating Notification////////////////////////////////
exports.validateUpdatingNotification = (req, res, next) => {
    try {
        const schema = Joi.object({
            notificationTitle: Joi.string().min(3).optional(),
            notificationBrief: Joi.string().min(3).optional(),
            notificationCategory: Joi.string().optional(),
            notificationTo: Joi.string().optional(),
            notificationBy: Joi.string().optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Adding Service Operators////////////////////////////////
exports.validateAddingServiceOperator = (req, res, next) => {
    try {
        /* const schema = Joi.object({
             serviceImage: Joi.string().min(4).optional(),
             imageFormat: Joi.string().min(1).optional(),
             serviceProvider: Joi.string().min(2).required(),
             providerCommission: Joi.string().optional(),
             serviceCategory: Joi.string().min(3).required(),
             accessKey: Joi.string().min(1).required(),
             countryName: Joi.string().min(3).required(),
             countryCode: Joi.string().min(1).required(),
             vendorId: Joi.string().required(),
             commissionType: Joi.string().min(4).optional(),
             balanceMethod: Joi.string().optional(),
             serviceType: Joi.string().required(),
             serviceStatus: Joi.string().optional(),
             _csrf: Joi.string().optional()

         });

         const result = schema.validate(req.body);
         //console.log(result)
         if (result.error) {
             return res.status(203).json({
                 code: 400,
                 status: 'error',
                 errors: [result.error.details[0].message]
             });
         }*/
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Updating Service Operators////////////////////////////////
exports.validateUpdatingServiceOperator = (req, res, next) => {
    try {
        /*const schema = Joi.object({
            serviceProvider: Joi.string().min(3).optional(),
            accessKey: Joi.string().min(3).optional(),
            isTUFlexiAvailable: Joi.string().optional(),
            isTUFixedAvailable: Joi.string().optional(),
            isBPFlexiAvailable: Joi.string().optional(),
            isBPFixedAvailable: Joi.string().optional(),
            serviceStatus: Joi.string().optional(),
            commission: Joi.string().optional(),
            serviceCategory: Joi.string().min(3).optional(),
            remarks: Joi.string().optional(),
            countryName: Joi.string().min(3).optional(),
            countryCode: Joi.string().min(1).optional(),
            vendorCode: Joi.string().min(3).optional(),
            vendorName: Joi.string().min(4).optional(),
            balanceMethod: Joi.string().optional(),
            surCharge: Joi.string().optional(),
            optional1: Joi.string().min(4).optional(),
            optional2: Joi.string().min(4).optional(),
            optional3: Joi.string().min(4).optional(),
            optional4: Joi.string().min(4).optional(),
            optional5: Joi.string().min(4).optional(),
            optional6: Joi.string().min(4).optional(),
            commissionType: Joi.string().min(4).optional(),
            isPlanAvailable: Joi.string().optional(),
            optionalsRequired: Joi.string().optional(),
            serviceImage: Joi.string().min(4).optional(),
            isActive: Joi.string().optional()

        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }*/
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Adding Beneficiary////////////////////////////////
exports.validateAddingBeneficiary = (req, res, next) => {
    try {
        /*  const schema = Joi.object({
              name: Joi.string().min(3).required(),
              accountNo: Joi.string().min(6).required(),
              accessKey: Joi.string().min(1).required(),
              isActive: Joi.string().required(),
              credentialId: Joi.string().required(),
              optional1: Joi.string().optional(),
              _csrf: Joi.string().optional()
          });
          const result = schema.validate(req.body);
          if (result.error) {
              return res.status(203).json({
                  code: 203,
                  status: 'error',
                  errors: [result.error.details[0].message]
              });
          }*/
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Updating Beneficiary////////////////////////////////
exports.validateUpdatingBeneficiary = (req, res, next) => {
    try {
        /* const schema = Joi.object({
             name: Joi.string().min(3).optional(),
             accountNo: Joi.string().min(6).optional(),
             accessKey: Joi.string().min(1).optional(),
             optional1: Joi.string().optional(),
             isActive: Joi.string().optional(),
             _csrf: Joi.string().optional()
         });
         const result = schema.validate(req.body);
         if (result.error) {
             return res.status(203).json({
                 code: 203,
                 status: 'error',
                 errors: [result.error.details[0].message]
             });
         }*/
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Adding Vendor////////////////////////////////
exports.validateAddingVendor = (req, res, next) => {
    try {
        const schema = Joi.object({
            vendorName: Joi.string().min(4).required(),
            // isActive: Joi.string().required(),
            apiUrl: Joi.string().uri().required(),
            healthUrl: Joi.string().uri().optional(),
            //optional1: Joi.string().min(4). optional(),
            //optional2: Joi.string().min(4). optional(),
            //optional3: Joi.string().min(4). optional(),
            //optional4: Joi.string().min(4). optional(),
            type: Joi.string().min(1).required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

/////////////////////Updating Vendor////////////////////////////////
exports.validateUpdatingVendor = (req, res, next) => {
    try {
        const schema = Joi.object({
            vendorName: Joi.string().min(4).optional(),
            isActive: Joi.string().optional(),
            apiUrl: Joi.string().min(4).optional(),
            healthUrl: Joi.string().min(4).optional(),
            isVoucherAvailable: Joi.string().min(4).optional(),
            isBillPaymentAvailable: Joi.string().min(4).optional(),
            isTopUpAvailable: Joi.string().min(4).optional(),
            isAirlineAvailable: Joi.string().min(4).optional(),
            currency: Joi.string().min(3).optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Adding Sign Up////////////////////////////////
exports.validateAddingSignUp = (req, res, next) => {
    try {
        const schema = Joi.object({
            firstName: Joi.string().min(3).required(),
            lastName: Joi.string().min(3).required(),
            password: Joi.string().min(8).required(),
            designation: Joi.string().min(2).required(),
            mobileNo: Joi.string().min(9).required(),
            companySize: Joi.string().min(1).required(),
            email: Joi.string().min(6).required().email(),
            name: Joi.string().min(1).required(),
            country: Joi.string().min(1).required(),
            countryCode: Joi.string().min(1).required(),
            city: Joi.string().min(4).required(),
            panNumber: Joi.string().min(6).max(10).required(),
            gstNumber: Joi.string().min(6).max(15).required(),
            gstOtp: Joi.string().min(6).required(),
            _csrf: Joi.string().optional(),
            referralCode: Joi.string().optional(),
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Updating Sign Up////////////////////////////////
exports.validateUpdatingSignUp = (req, res, next) => {
    try {
        const schema = Joi.object({
            firstName: Joi.string().min(1).optional(),
            username: Joi.string().min(1).optional(),
            name: Joi.string().min(1).optional(),
            address: Joi.string().min(1).optional(),
            status: Joi.string().min(1).optional(),
            lastName: Joi.string().min(1).optional(),
            designation: Joi.string().min(1).optional(),
            mobileNo: Joi.string().min(7).optional(),
            companySize: Joi.string().min(1).optional(),
            email: Joi.string().min(6).optional().email(),
            companyName: Joi.string().min(1).optional(),
            country: Joi.string().min(1).optional(),
            countryCode: Joi.string().min(1).optional(),
            city: Joi.string().min(1).optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////Updating  Up////////////////////////////////
exports.validateUpdatingMessage = (req, res, next) => {
    try {
        /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////Updating  Up////////////////////////////////
exports.validateSystemServer = (req, res, next) => {
    try {
        /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Adding  Document////////////////////////////////
exports.validateAddingDocument = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentType: Joi.string().required(),
            documentName: Joi.string().required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Updating  Document////////////////////////////////
exports.validateUpdateDocument = (req, res, next) => {
    try {
        const schema = Joi.object({
            documentId: Joi.string().required(),
            documentType: Joi.string().required(),
            documentName: Joi.string().required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}

////////////////////Adding  Cashback  Up////////////////////////////////
exports.validateAddingCashback = (req, res, next) => {
    try {
        const schema = Joi.object({
            packageId: Joi.string().required(),
            serviceOperatorId: Joi.string().required(),
            cashbackType: Joi.string().required(),
            cashback: Joi.number().required(),
            surcharge: Joi.number().required(),
            serviceStatus: Joi.string().optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}
////////////////////Updating Cashback  Up////////////////////////////////
////////////////////Adding  Cashback  Up////////////////////////////////
exports.validateAddingDisableService = (req, res, next) => {
    try {
        const schema = Joi.object({
            credentialId: Joi.string().required(),
            serviceOperatorId: Joi.string().required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}
////////////////////Updating Cashback  Up////////////////////////////////
exports.validateupdateCashback = (req, res, next) => {
    try {
        /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
        const schema = Joi.object({
            packageId: Joi.string().required(),
            serviceOperatorId: Joi.string().required(),
            cashbackType: Joi.string().optional(),
            cashback: Joi.number().min(0).optional(),
            surcharge: Joi.number().min(0).optional(),
            // serviceStatus: Joi.string().optional(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////Updating Cashback  Up////////////////////////////////
////////////////////Updating Cashback  Up////////////////////////////////
exports.validateSelfTransfer = (req, res, next) => {
    try {
        const schema = Joi.object({
            credentialId: Joi.string().min(1).required(),
            type: Joi.string().min(3).required(),
            amount: Joi.string().min(1).required(),
            password: Joi.string().min(4).max(20).required(),
            _csrf: Joi.string().optional()


        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////Updating Cashback  Up////////////////////////////////
////////////////////validateTransferFunds////////////////////////////////
exports.validateTransferFunds = (req, res, next) => {
    try {
        const schema = Joi.object({
            credentialId: Joi.string().required(),
            amount: Joi.string().min(1).required(),
            password: Joi.string().min(3).required(),
            remarks: Joi.string().min(6).required(),
            type: Joi.string().required(),
            _csrf: Joi.string().optional()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////validateTransferFunds///////////////////////////////

////////////////////validate Password////////////////////////////////
exports.validatePassword = (req, res, next) => {
    try {
        const schema = Joi.object({
            oldPassword: Joi.string(),
            newPassword: Joi.string()
        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////validate Password////////////////////////////////

////////////////////validate Payment////////////////////////////////
exports.validatePayment = (req, res, next) => {
    try {
        /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////validate Password////////////////////////////////

////////////////////validate Payment////////////////////////////////
exports.validateCreateMessage = (req, res, next) => {
    try {
        /* const schema = Joi.object({
             username: Joi.string().min(6).optional(),
             firstName: Joi.string().min(3).optional(),
             lastName: Joi.string().min(3).optional(),
             emailId: Joi.string().min(6).optional().email(),
             phoneNo: Joi.string().min(7).optional(),
             businessRegNo: Joi.string().min(5).optional(),
             contactPersonName: Joi.string().min(6).optional(),
             contactPersonNumber: Joi.string().min(7).optional(),
             address: Joi.string().min(6).optional(),
             companyName: Joi.string().min(3).optional(),
             country: Joi.string().min(3).optional(),
             countryCode: Joi.string().min(1).optional(),
             city: Joi.string().min(3).optional(),
             currency: Joi.string().min(3).optional(),
             status: Joi.string().optional()
         });*/
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////validate Password////////////////////////////////


////////////////////VALIDATING GIFT CARD UPLOAD////////////////////////////////

exports.validateGiftCard = (req, res, next) => {
    console.log(req.body)
    try {
        const schema = Joi.object({
            serviceOperatorId: Joi.number().valid(15, 35, 43).required(),
            product_id: Joi.required(),
            brand_code: Joi.when('serviceOperatorId', {
                is: 35,
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            name: Joi.string().trim().required(),
            image: Joi.alternatives().try(
                Joi.string().required(),
                Joi.object({
                    imageBase: Joi.string().required(),
                    imageFormat: Joi.string().required()
                }).required()
            ),
            priceType: Joi.string().valid('FIXED', 'FLEXI').required(),
            denominations: Joi.when('priceType', {
                is: 'FIXED',
                then: Joi.array()
                    .items(Joi.number().required())
                    .required()
                    .error(() => {
                        return {
                            message: 'Denominations are required and must be an array of numbers for FIXED price type.',
                        };
                    }),
                otherwise: Joi.array()
                    .items(Joi.number())
                    .default([])
                    .error(() => {
                        return {
                            message: 'Denominations must be an array of numbers.',
                        };
                    }),
            }),
            minDenomination: Joi.when('priceType', {
                is: 'FIXED',
                then: Joi.number()
                    .valid(Joi.ref('denominations'))
                    .required()
                    .min(Joi.ref('denominations'))
                    .error(() => {
                        return {
                            message: 'minDenomination must be the minimum value in the denominations array for FIXED price type.',
                        };
                    }),
                otherwise: Joi.number().required(),
            }),
            maxDenomination: Joi.when('priceType', {
                is: 'FIXED',
                then: Joi.number()
                    .valid(Joi.ref('denominations'))
                    .required()
                    .max(Joi.ref('denominations'))
                    .error(() => {
                        return {
                            message: 'maxDenomination must be the maximum value in the denominations array for FIXED price type.',
                        };
                    }),
                otherwise: Joi.number().required(),
            }),
            activation_fee: Joi.when('serviceOperatorId', {
                is: 43,
                then: Joi.number().precision(2).required(),
                otherwise: Joi.optional()
            }),
            currency: Joi.string().valid('INR').required(),
            description: Joi.string().optional(),
            redemption_instructions: Joi.string().optional(),
            status: Joi.boolean().optional(),
            _csrf: Joi.string().optional()

        });
        const result = schema.validate(req.body);
        if (result.error) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: [result.error.details[0].message]
            });
        }
        if (parseFloat(req.body.minDenomination) > parseFloat(req.body.maxDenomination)) {
            return res.status(203).json({
                code: 203,
                status: 'error',
                errors: ['Min denomination must be less than max denomination']
            });
        }
        next()
    } catch (err) {
        err.code ? console.log(`Error:${err.message}`) : console.log(err)
        res.json({
            code: err.code,
            status: 'error',
            errors: [err.message]
        })
    }
}


////////////////////VALIDATING GIFT CARD BULK UPLOAD////////////////////////////////
exports.validateBulkUploadsGiftCards = (req, res, next) => {
    if (!req.excelToJsonData) {
        return next(new ErrorResponse(`Something went wrong!`, 200));
    }
    const jsonData = req.excelToJsonData;
    console.log({
        jsonData
    })

    try {
        const schema = Joi.object({
            serviceOperatorId: Joi.number().valid(15, 35, 43).required(),
            product_id: Joi.required(),
            brand_code: Joi.when('serviceOperatorId', {
                is: 35,
                then: Joi.required(),
                otherwise: Joi.optional()
            }),
            name: Joi.string().trim().required(),
            image: Joi.string().required(),
            priceType: Joi.string().valid('FIXED', 'FLEXI').required(),
            denominations: Joi.when('priceType', {
                is: 'FIXED',
                then: Joi.array()
                    .items(Joi.number().required())
                    .required()
                    .error(() => {
                        return {
                            message: 'Denominations are required and must be an array of numbers for FIXED price type.',
                        };
                    }),
                otherwise: Joi.array()
                    .items(Joi.number())
                    .default([])
                    .error(() => {
                        return {
                            message: 'Denominations must be an array of numbers.',
                        };
                    }),
            }),
            minDenomination: Joi.when('priceType', {
                is: 'FIXED',
                then: Joi.number()
                    .valid(Joi.ref('denominations'))
                    .required()
                    .min(Joi.ref('denominations'))
                    .error(() => {
                        return {
                            message: 'minDenomination must be the minimum value in the denominations array for FIXED price type.',
                        };
                    }),
                otherwise: Joi.number().required(),
            }),
            maxDenomination: Joi.when('priceType', {
                is: 'FIXED',
                then: Joi.number()
                    .valid(Joi.ref('denominations'))
                    .required()
                    .max(Joi.ref('denominations'))
                    .error(() => {
                        return {
                            message: 'maxDenomination must be the maximum value in the denominations array for FIXED price type.',
                        };
                    }),
                otherwise: Joi.number().required(),
            }),
            activation_fee: Joi.when('serviceOperatorId', {
                is: 43,
                then: Joi.number().precision(2).required(),
                otherwise: Joi.number().precision(2).optional()
            }),
            currency: Joi.string().valid('INR').required(),
            description: Joi.string().optional(),
            redemption_instructions: Joi.string().optional()
        });

        const validationErrors = [];

        for (const [index, item] of jsonData.entries()) {
            if (typeof item.denominations === 'string') {
                const denominationsArray = item.denominations.split(',').map(Number);
                item.denominations = denominationsArray;
            } else {
                item.denominations = []
            }

            const result = schema.validate(item);
            if (result.error) {
                validationErrors.push(`${result.error.details[0].message} in ${index + 2} row`);
            } else {
                if (item.priceType === 'FIXED') {
                    const [min, max] = findMinAndMax(item.denominations)
                    item.minDenomination = min
                    item.maxDenomination = max
                }
            }
        }
        //next check duplicate entries with the array of gift cards(ie, product_id, brand_code, name should be unique to each serviceOperator)
        let duplicates = findDuplicates(jsonData)
        if (duplicates.length > 0) {
            duplicates.forEach(element => {
                validationErrors.push(`${element.name} is a duplicate Entry`);
            });
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                code: 400,
                status: 'error',
                errors: validationErrors
            });
        }


        next();
    } catch (err) {
        console.error(err);
        res.status(500).json({
            code: 500,
            status: 'error',
            errors: ['Internal Server Error']
        });
    }

    function findDuplicates(arr) {
        const duplicates = [];
        for (let i = 0; i < arr.length; i++) {
            for (let j = i + 1; j < arr.length; j++) {
                if (arr[i].serviceOperatorId == arr[j].serviceOperatorId &&
                    (arr[i].product_id == arr[j].product_id ||
                        arr[i].name == arr[j].name ||
                        arr[i].brand_code == arr[j].brand_code)) {
                    duplicates.push(arr[j]);
                }
            }
        }
        return duplicates;
    }

    function findMinAndMax(arr) {
        if (arr.length === 0) {
            return [undefined, undefined];
        }
        let min = parseFloat(arr[0]);
        let max = parseFloat(arr[0]);

        for (let i = 1; i < arr.length; i++) {
            let x = parseFloat(arr[i])
            if (x < min) {
                min = x;
            } else if (x > max) {
                max = x;
            }
        }
        return [min, max];
    }
}

exports.validateBulkPayment = (req,res,next) =>{
    try {
      const schema = Joi.object({
        bulkPaymentData: Joi.array().items(
            Joi.object({
                account: Joi.string().required().messages({
                    'any.required': 'Account is required.',
                    'string.empty': 'Account cannot be empty.',
                }),
                transactionId: Joi.string().required().messages({
                    'any.required': 'Transaction ID is required.',
                    'string.empty': 'Transaction ID cannot be empty.',
                }),
                providerTransactionId: Joi.string().optional(),
                amount: Joi.alternatives()
                    .try(
                        Joi.string().required().pattern(/^\d+(\.\d+)?$/).custom((value, helpers) => {
                            if (parseFloat(value) <= 0) {
                                return helpers.message('Amount must be greater than zero.');
                            }
                            return value;
                        }).messages({
                            'any.required': 'Amount must be a non-empty string.',
                            'string.empty': 'Amount cannot be empty.',
                            'string.pattern.base': 'Amount must be a non-negative number.',
                        }),
                        Joi.number().required().greater(0).messages({
                            'any.required': 'Amount must be a number.',
                            'number.base': 'Amount must be a number.',
                            'number.greater': 'Amount must be greater than zero.',
                        })
                    ).messages({
                        'alternatives.match': 'Amount must be greater than zero.',
                    }),
                lastBalance: Joi.string().optional(),
                flexiKey: Joi.string().required().messages({
                    'any.required': 'Flexi key is required.',
                    'string.empty': 'Flexi key cannot be empty.',
                }),
                typeKey: Joi.number().required().messages({
                    'any.required': 'Type key is required.',
                    'number.base': 'Type key must be a number.',
                }),
                type: Joi.string().allow(null, "").optional(),
                contractId: Joi.string().optional(),
                pin: Joi.string().allow(null, "").optional(),
                optional1: Joi.string().optional(),
                optional2: Joi.string().optional(),
            })
        ).min(1).required().messages({
            'array.min': 'At least one payment data item is required.',
            'any.required': 'Bulk payment data is required.',
        }),
        amount: Joi.number().positive().required().messages({
            'any.required': 'Amount is required.',
            'number.base': 'Amount must be a number.',
            'number.positive': 'Amount must be greater than zero.',
        }),
        accessKey: Joi.string().required().messages({
            'any.required': 'Access Key is required.',
            'string.empty': 'Access Key cannot be empty.',
        }),
        paytmResponse: Joi.object().optional(),
        paytmAmount: Joi.number().positive().optional().messages({
            'number.base': 'PG Amount must be a number.',
            'number.positive': 'PG Amount must be greater than zero.',
        }),
        successUrl: Joi.string().optional().messages({
            'string.base': 'Success URL must be a string.',
        }),
        failureUrl: Joi.string().optional().messages({
            'string.base': 'Failure URL must be a string.',
        }),
    })
  
    const result = schema.validate(req.body);
  
    if (result.error) {
      throw new Error(result.error.details[0].message);
    }
    next();
      
    } catch (err) {
        console.error(err);
        next(err);
    }
  }
  exports.validateKYBDetailsAdminUpdate = (req, res, next) => {
    try {
        const schema = Joi.object({
            status: Joi.string()
                .valid('RE UPLOAD', 'COMPLETED')
                .required()
                .messages({
                    'any.required': 'Status is required.',
                    'any.only': 'Status must be either "RE UPLOAD" or "COMPLETED".'
                }),
            remarks: Joi.string().when('status', {
                is: 'RE UPLOAD',
                then: Joi.string().required()
                    .messages({
                        'any.required': 'Remarks are required for status RE UPLOAD.'
                    }),
                otherwise: Joi.forbidden() // Disallow remarks for status other than "RE UPLOAD"
            }),
          
        })
        const result = schema.validate(req.body);
        if (result.error) {
            throw new Error(result.error.details[0].message);
        }
        next();
    } catch (err) {
        console.error(err);
        next(err);
    }
  };