const express = require('express');
const router = express.Router();
const { validateAnnoucementCreate } = require('../utils/apiValidation');
const { getAllAnnouncements, getEmployee, postAnnouncement, deleteAnnouncement } = require('../controller/announcement');

// Fetch all announcements for a specific corporateUser
router.get('/', getAllAnnouncements)

// get employee
router.get('/employees', getEmployee)

// Create a new announcement
// router.post('/', async (req, res, next) => {
//     try {
//         const userId = req.user._id;
//         const { subject, details, excludedEmployees, companyName, sender } = req.body;
//         if (!companyName || !sender) {
//             return next(new ErrorResponse('companyName, sender are required to send email', 400))
//         }

//         //need to fetch employees email and name as array to send email
//         const allEmployeesExceptExcluded = await Employee.find({
//             _id: { $nin: excludedEmployees },
//             corporateUser: userId,
//             'employeeInformation.status': { $nin: ['SUSPENDED', 'RESIGNED'] }
//         }, 'fullName personalEmail');

//         const emails = allEmployeesExceptExcluded.map(employee => employee.personalEmail);
//         if (!emails || emails.length < 1) {
//             return next(new ErrorResponse('No valid emails found. It is possible that all relevant employees have been excluded or there are no active employees available.', 400))
//         }
//         let hrSettings = await findOneHrSettings(userId)
//         let announcement = announcementTemplate(req.body, hrSettings)
//         let to = emails
//         let { status, message } = await emailer.email(to, subject || 'Announcement', announcement)
//         if (!status) {
//             return next(new ErrorResponse(message || 'Faild to send emails', 400))
//         }
//         //save to database
//         const savedAnnouncement = await Announcement.create({
//             corporateUser: userId,
//             subject,
//             details,
//             status: 'MAILED',
//             excludedEmployees // Array of employee IDs
//         });

//         return res.status(200).json({
//             status: true,
//             responseCode: '000',
//             message: 'Announcement mailed successfully',
//             data: savedAnnouncement
//         });

//     } catch (error) {
//         next(error);
//     }
// });

//create new announcement
router.post('/', validateAnnoucementCreate, postAnnouncement)

//delete announcement
router.delete('/:id', deleteAnnouncement)

module.exports = router;
