const asyncHandler = require("../middleware/async");
const {
  addEmployeeBankDetails,
  updateEmployeeBankDetails,
  deleteEmployeeBankDetails,
  getEmployeeBankDetails
} = require("../models/use-cases/bankDetails");
exports.createbankDetails = asyncHandler(async (req, res) => {
  try {
    const corporateUserID = req.user._id;
    const employeeId = req.params.id; 
    const bankDetailsData = req.body; 

    const result = await addEmployeeBankDetails({
      employeeId,
      bankDetailsData,
      corporateUserID,
    });

    console.log(result,"resultt")

    
    res.status(201).json({
        status: true,
        responseCode: '000',
        message: "Bank details added successfully",
      data: result.bankDetails,
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: error.message || "An error occurred while adding bank details",
    });
  }
});

exports.updateBankDetails = asyncHandler(async (req, res) => {
  try {
    const bankId = req.params.bankId;
    const bankDetailsData = req.body;
    const corporateUserID = req.user._id;

    const result = await updateEmployeeBankDetails({
      bankId,
      bankDetailsData,
      corporateUserID,
    });

    
    res.status(200).json({
        status: true,
        responseCode: '000',
      message: "Bank account updated successfully",
      data: result.bankDetails,
    });
  } catch (error) {
    
    res.status(500).json({
      success: false,
      message: error.message || "Unable to update bank details",
    });
  }
});



exports.deleteBankDetails = asyncHandler(async (req, res) => {
    try {
      const bankId = req.params.bankId; 
  
  
      const result = await deleteEmployeeBankDetails(bankId, req.user._id);
  
   
      res.status(200).json({
        success: true,
        message: result.message,
      });
    } catch (error) {
     
      res.status(500).json({
        success: false,
        message: error.message || 'Unable to delete bank details',
      });
    }
  });
  



  exports.listBankDetails = asyncHandler(async (req, res) => {
    try {
      const employeeId = req.params.employeeId; 
  
      
      const bankDetailsList = await getEmployeeBankDetails(employeeId, req.user._id);
  
      // Send a success response with the bank details
      res.status(200).json({
        status: true,
        responseCode:'000',
        message: 'Bank details retrieved successfully',
        data: bankDetailsList,
      });
    } catch (error) {
      // Handle errors and send a failure response
      res.status(500).json({
        success: false,
        message: error.message || 'Unable to fetch bank details',
      });
    }
  });
  
