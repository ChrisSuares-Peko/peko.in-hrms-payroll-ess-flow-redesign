const asyncHandler = require("../middleware/async");
const { calculateExperience } = require("../services/calculateExperience")
const { calculateGratuity } = require("../services/calculateGratuity");

exports.calculateGratuity = asyncHandler(async (req, res) => {

  let { fromDate, toDate, basicSalary } = req.body
  basicSalary = parseFloat(basicSalary)
  //  const yearsOfExperience = calculateExperience(fromDate, toDate);
  const yearsOfExperience = calculateExperience(fromDate, toDate);

  let responseMessage;

  if (yearsOfExperience < 1) {
    responseMessage = 'Selected Employee have work experience less than one year'
  } else {
    responseMessage = 'Gratuity calculated successfully'
  }

  const gratuity = calculateGratuity(basicSalary, yearsOfExperience);
  console.log(`Gratuity entitlement: Dh${gratuity.toFixed(2)}`);

  return res.status(201).json({
    status: true,
    responseCode: '000',
    message: responseMessage,
    data: { gratuity: gratuity.toFixed(2), yearsOfExperience }
  });

})



