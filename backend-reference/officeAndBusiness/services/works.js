const { findOne } = require("../models/use-cases/works");
const { findOnePlan } = require("../models/use-cases/works_plan");
const { worksVendorEmail } = require("../utils/emailTemplates/works/worksVendorEmail");
const { customLog } = require("../utils/loggerHelper");
const emailer = require('../utils/emailer');
const works = require("../models/entities/works");
const { Sequelize } = require("sequelize");
const sequelize = require('../configs/database/index');

exports.sedEmailToWorksVendor = async ({ serviceDetails, corporateTxnId, body, templateDetails, user }) => {
    try {
        const { vendorEmail: adminEmail } = serviceDetails?.vendor || {};
        const { workId, planId, pocName, email, mobile, requirement } = body

        const selectedWork = await findOne({ id: workId })
        const selectedPlan = await findOnePlan({ id: planId })
        const {
            name: workName,
            contactName: vendorName,
            contactEmail: vendorEmail,
            contactMobile: vendorMobile
        } = selectedWork

        const ccEmails = Array.isArray(adminEmail) ? adminEmail : [adminEmail];
        ccEmails.push(vendorEmail);

        const subject = `Service order ${corporateTxnId} for ${workName} – ${selectedPlan?.name} Plan from ${templateDetails?.branding}`
        const emailBody = worksVendorEmail({
            corporateTxnId,
            workName,
            planName: selectedPlan?.name || '',

            contactPersonName: pocName,
            companyName: user?.name,
            contactEmail: email,
            contactNumber: mobile ? `+971 ${mobile}` : '',
            requirement,

            vendorName: vendorName || '',
            vendorEmail: vendorEmail || '',
            vendorMobile: vendorMobile ? `+971 ${vendorMobile}` : '',
        }, templateDetails)
        emailer.sendEmailWithCC(email, ccEmails, subject, emailBody)


        return { status: true, message: 'success', data: {} }
    } catch (error) {
        customLog(null, "error", {
            error,
            location: 'sedEmailToWorksVendor'
        })
        return { status: false, message: '', data: {} }
    }
};

exports.validateWorkItem = async ({ credentialId, workId, name }) => {
    try {
        const whereClause = {
            credentialId,
            name
        };
        if (workId) {
            // Exclude the current workId if updating
            whereClause.id = { [Sequelize.Op.ne]: workId };
        }
        const existing = await works.findOne({ where: whereClause });
        if (existing) {
            return {
                status: false,
                message: 'Work name already exists under this partner.',
                data: {}
            };
        }

        return {
            status: true,
            message: 'Valid work item',
            data: {}
        };
    } catch (error) {
        customLog(null, "error", {
            error,
            location: 'validateWorkItem'
        });
        return {
            status: false,
            message: 'Something went wrong, please try again later',
            data: {}
        };
    }
};
exports.syncWorkPriority = async ({ priority, workId, credentialId }) => {
    const transaction = await sequelize.transaction();
    try {
        if (!Number.isInteger(priority) || priority < 1) {
            await transaction.rollback();
            return { status: false, message: 'Invalid priority value', data: {} };
        }
        // Fetch all works with the same credentialId, ordered properly
        const worksList = await works.findAll({
            where: { credentialId },
            order: [
                [Sequelize.literal('displayPriority IS NULL'), 'ASC'],
                ['displayPriority', 'ASC'],
                ['id', 'ASC']
            ],
            transaction
        });

        // Find the work to move
        const currentWork = worksList.find(work => work.id === Number(workId));
        if (!currentWork) {
            await transaction.rollback();
            return { status: false, message: 'Work not found', data: {} };
        }

        // Filter out the work being moved
        const filteredWorks = worksList.filter(work => work.id !== Number(workId));
        const updatedWorks = [];
        let inserted = false;

        // Reconstruct the updated priority list
        for (let i = 0; i < filteredWorks.length; i++) {
            if (!inserted && priority === i + 1) {
                updatedWorks.push(currentWork);
                inserted = true;
            }
            updatedWorks.push(filteredWorks[i]);
        }

        // If priority was greater than list length, insert at end
        if (!inserted) updatedWorks.push(currentWork);

        // Save updated priorities only if changed
        for (let i = 0; i < updatedWorks.length; i++) {
            const work = updatedWorks[i];
            const newPriority = i + 1;
            if (work.displayPriority !== newPriority) {
                work.displayPriority = newPriority;
                await work.save({ transaction });
            }
        }

        await transaction.commit();

        return {
            status: true,
            message: 'Priority sync successful',
            data: {}
        };
    } catch (error) {
        await transaction.rollback();

        customLog(null, 'error', {
            error,
            location: 'syncWorkPriority'
        });

        return {
            status: false,
            message: 'Something went wrong, please try again later',
            data: {}
        };
    }
};
