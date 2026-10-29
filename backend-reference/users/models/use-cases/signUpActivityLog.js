const asyncHandler = require("../../middlewares/async");
const signUpActivityLog = require("../entities/signUpActivityLog");
const { customLog } = require("../../utils/loggerHelper");


exports.createSignUpActivity = asyncHandler(async (data) => {
    try {
        customLog(null, "info", {
            message: "Creating signup activity log",
            data: JSON.stringify(data),
            timestamp: new Date().toISOString()
        });

        const result = await signUpActivityLog.create(data);

        customLog(null, "info", {
            message: "Signup activity log created successfully",
            createdId: result?.id,
            email: result?.email,
            mobileNo: result?.mobileNo,
            timestamp: new Date().toISOString()
        });

        return result;
    } catch (error) {
        customLog(null, "error", {
            message: "Failed to create signup activity log",
            error: error?.message,
            errorStack: error?.stack,
            inputData: JSON.stringify(data),
            timestamp: new Date().toISOString()
        });
        // Return null instead of throwing to not block signup process
        return null;
    }
});

exports.updateSignUpActivity = asyncHandler(async (query, data) => {
    try {
        customLog(null, "info", {
            message: "Starting updateSignUpActivity",
            query: JSON.stringify(query),
            updateData: JSON.stringify(data),
            timestamp: new Date().toISOString()
        });

        // Find the latest record with the specified email by sorting in descending order
        const latestRecord = await signUpActivityLog.findOne({
            where: query,
            order: [['createdAt', 'DESC']]
        });

        customLog(null, "info", {
            message: "Search for signup activity record",
            found: !!latestRecord,
            recordId: latestRecord?.id,
            email: latestRecord?.email,
            timestamp: new Date().toISOString()
        });

        if (latestRecord) {
            const updatedRecord = await latestRecord.update(data);

            customLog(null, "info", {
                message: "Signup activity log updated successfully",
                recordId: updatedRecord?.id,
                email: updatedRecord?.email,
                status: updatedRecord?.status,
                timestamp: new Date().toISOString()
            });

            return updatedRecord;
        } else {
            customLog(null, "info", {
                message: "No signup activity record found to update",
                query: JSON.stringify(query),
                timestamp: new Date().toISOString()
            });
            return null;
        }
    } catch (error) {
        customLog(null, "error", {
            message: "Error in updateSignUpActivity",
            error: error?.message,
            errorStack: error?.stack,
            query: JSON.stringify(query),
            updateData: JSON.stringify(data),
            timestamp: new Date().toISOString()
        });
        // Return null instead of throwing to not block signup process
        return null;
    }
});