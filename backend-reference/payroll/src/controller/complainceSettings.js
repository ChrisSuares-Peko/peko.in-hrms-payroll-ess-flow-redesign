const asyncHandler = require("../middleware/async");
const ComplianceSettings = require("../models/entities/complianceSettings");
const { 
    updateOrCreateEpfSettings,
    updateEsiSettings,
    updateProfessionalTaxSettings,
    updateLaborWelfareFundSettings,
    saveTdsSettings,
    getEpfApplicabilityContext,
    setEpfApplicability,
    setEpfEarningsLine,
} = require("../models/use-cases/complianceSettings");

exports.updateEpfEarningsLine = asyncHandler(async (req, res) => {
    const data = await setEpfEarningsLine(req.user._id, {
        showInEarnings: req.body.showInEarnings,
        changedBy: req.user?.email || req.user?._id?.toString() || null,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: req.body.showInEarnings
            ? "PF Employee's Contribution will be shown in Earnings"
            : "PF Employee's Contribution will be shown in Deductions only",
        data,
    });
});

exports.getEpfApplicability = asyncHandler(async (req, res) => {
    const data = await getEpfApplicabilityContext(req.user._id);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'EPF applicability fetched successfully',
        data,
    });
});

exports.updateEpfApplicability = asyncHandler(async (req, res) => {
    const data = await setEpfApplicability(req.user._id, {
        isApplicable: req.body.isApplicable,
        changedBy: req.user?.email || req.user?._id?.toString() || null,
    });

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: req.body.isApplicable ? 'EPF turned on for this establishment' : 'EPF turned off for this establishment',
        data,
    });
});



exports.saveEpfSettings = asyncHandler(async (req, res) => {
    const epfData = req.body;
    const corporateUserID = req.user._id;
  
   
    const updatedEpfSettings = await updateOrCreateEpfSettings(corporateUserID, epfData);
  
  
    
  
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'EPF settings updated successfully',
        data: updatedEpfSettings
    });
  });
  

  exports.saveEsiSettings = asyncHandler(async (req, res) => {
    const esiData = req.body; 
    const corporateUserID = req.user._id; 

    
    const updatedEsiSettings = await updateEsiSettings(corporateUserID, esiData);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'ESI settings updated successfully',
        data: updatedEsiSettings
    });
});


exports.saveProfessionalTaxSettings = asyncHandler(async (req, res) => {
    const professionalTaxData = req.body; 
    const corporateUserID = req.user._id; 

 
    const updatedProfessionalTaxSettings = await updateProfessionalTaxSettings(corporateUserID, professionalTaxData);

    
    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Professional tax settings saved successfully',
        data: updatedProfessionalTaxSettings
    });
});



exports.saveLaborWelfareFundSettings = asyncHandler(async (req, res) => {
    const laborWelfareFundData = req.body; 
    const corporateUserID = req.user._id; 

   
    const updatedLaborWelfareFundSettings = await updateLaborWelfareFundSettings(corporateUserID, laborWelfareFundData);

    return res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Labor Welfare Fund settings saved successfully',
        data: updatedLaborWelfareFundSettings
    });
});



exports.getAllComplianceSettings = asyncHandler(async (req, res) => {
    const corporateUserID = req.user._id;

    const complianceSettings = await ComplianceSettings.findOne({ corporateUser: corporateUserID });

   

    res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Compliance settings fetched successfully',
        data:complianceSettings
        
    });
});


exports.updateComplianceSettings = asyncHandler(async (req, res) => {
    const { id } = req.params;  
    const updateData = req.body;

    const complianceSettings = await ComplianceSettings.findOne({ _id: id, corporateUser: req.user._id });

    if (!complianceSettings) {
        return res.status(404).json({
            status: false,
            responseCode: '001',
            message: "Compliance settings not found",
        });
    }

   
    if (updateData.epf) {
        complianceSettings.epf = {
            ...complianceSettings.epf, 
            ...updateData.epf,          
        };
    }

    if (updateData.esi) {
        complianceSettings.esi = {
            ...complianceSettings.esi,
            ...updateData.esi,
        };
    }

    if (updateData.professionalTax) {
        complianceSettings.professionalTax = {
            ...complianceSettings.professionalTax,
            ...updateData.professionalTax,
        };
    }

    if (updateData.laborWelfareFund) {
        complianceSettings.laborWelfareFund = {
            ...complianceSettings.laborWelfareFund,
            ...updateData.laborWelfareFund,
        };
    }

    await complianceSettings.save();

    res.status(200).json({
        status: true,
        responseCode: '000',
        message: 'Compliance settings updated successfully',
        data: complianceSettings,
    });
});



exports.createTdsSettings = async (req, res) => {
    try {
      const tdsData = req.body;
      const corporateUserID=req.user._id;
      // Call the usecase function to save the data
      const result = await saveTdsSettings(corporateUserID,tdsData);
  
      res.status(201).json({
        message: 'TDS settings saved successfully',
        data: result,
        status:true,
        responseCode:'000'
      });
    } catch (error) {
      console.error('Error saving TDS settings:', error);
      res.status(500).json({
        message: 'Error saving TDS settings.',
        error: error.message,
      });
    }
  };