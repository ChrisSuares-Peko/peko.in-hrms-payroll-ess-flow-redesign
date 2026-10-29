/* eslint-disable no-useless-catch */
const EmployeeDocument = require("../entities/employeeDocument");
const { escapeSearch } = require('../../utils/escapeRegex');


exports.createEmployeeDocument = async (employeeId, corporateUserId, documentData) => {
    try {
        const employeeDocument = new EmployeeDocument({
            employee: employeeId,
            corporateUser: corporateUserId,
            name: documentData.name,
            url: documentData.url,
            expiryDate: documentData.expiryDate
        });
        return await employeeDocument.save();
    } catch (error) {
        throw error;
    }
}

exports.findAllEmployeeDocuments = async ({employeeId,corporateUserId,name,page=1,limit=10,search}) => {
    try {
        const query = { employee: employeeId,corporateUser:corporateUserId };
        if (name) {
            query.name = name;
        }
        if(search){
            query.name = {$regex: escapeSearch(search), $options: 'i'};
        }
        const countDocuments = await EmployeeDocument.countDocuments(query);
        const documents = await EmployeeDocument.find(query).skip((page - 1) * limit).limit(limit);
        return {documents,countDocuments};
    } catch (error) {
        throw error;
    }
}

exports.deleteEmployeeDocument = async (documentId,employeeId,corporateUserId) => {
    try {
        return await EmployeeDocument.findOneAndDelete({_id:documentId,employee:employeeId,corporateUser:corporateUserId});
    } catch (error) {
        throw error;
    }
}

exports.updateEmployeeDocument = async (documentId, employeeId, corporateUserId, documentData) => {
    try {
        return await EmployeeDocument.findOneAndUpdate(
            { _id: documentId, employee: employeeId, corporateUser: corporateUserId },
            {
                $set:{
                    name: documentData.name,
                    url: documentData.url,
                    expiryDate: documentData.expiryDate
                }
            }
        );
    } catch (error) {
        throw error;
    }
}

exports.findEmployeeDocumentById = async (documentId,employeeId,corporateUserId) => {
    try {
        return await EmployeeDocument.findOne({_id:documentId,employee:employeeId,corporateUser:corporateUserId});
    } catch (error) {
        throw error;
    }
}
