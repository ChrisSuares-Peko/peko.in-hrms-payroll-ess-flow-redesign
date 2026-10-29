const Department = require("../entities/department");
const { escapeSearch } = require('../../utils/escapeRegex');


exports.createDepartment = async (data) => {
    try {

        const newDepartment = new Department(data);

        const savedDepartment = await newDepartment.save();

        return savedDepartment;

    } catch (error) {
        return error;
    }
};

exports.getAllDepartmentData = async (params) => {
    try {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const searchText = params.searchText || '';
        const skip = (page - 1) * limit;

        const queryConditions = {
            corporateUser: params.corporateUserID,
            $or: [
                { departmentName: { $regex: `^${escapeSearch(searchText)}`, $options: 'i' } }
            ]
        };

        const departmentData = await Department.find(queryConditions)
            .skip(skip)
            .limit(limit)
            .exec();

        const totalCount = await Department.countDocuments(queryConditions);
        return {
            totalCount,
            departmentData

        }
    } catch (error) {
        return (error);
    }
}

exports.deleteDepartment = async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const departmentId = params.departmentId;

        const deleteDepartmentData = await Department.findOneAndDelete({
            _id: departmentId,
            corporateUser: corporateUserID
        });

        return deleteDepartmentData;


    } catch (error) {
        return error
    }
}

exports.editDepartment = async (params) => {
    try {
        const corporateUserID = params.corporateUserID;
        const departmentId = params.departmentId;
        const editData = params.editData

        const query = {
            _id: departmentId,
            corporateUser: corporateUserID
        }
        const editDepartmentData = await Department.updateOne(query, editData);

        return editDepartmentData;

    } catch (error) {
        return error
    }
}

exports.getDepartmentUsingCorporateId = async (corporateUser) => {
    try {
        return await Department.find({ corporateUser });

    } catch (error) {
        return error;

    }
}

exports.findDepartment = async (corporateUserID, departmentName,departmentCode) => {
    try {
        const existingDepartment = await Department.findOne({
            corporateUser: corporateUserID,
           $or: [
            { departmentName },
            { departmentCode }
        ]
        });

        return existingDepartment;
    } catch (error) {
        return error;

    }
}

exports.findDepartmentByIdAndCorporateUser = async (departmentId, corporateUserID) => {
    try {
        const foundDepartment = await Department.findOne({
            _id: departmentId,
            corporateUser: corporateUserID
        });

        return foundDepartment;
    } catch (error) {
        return error;

    }
}

exports.findExistingDepartment = async (corporateUserID, editData, departmentId) => {
     const orConditions = [];

        if (editData?.departmentName) {
            orConditions.push({ departmentName: editData.departmentName });
        }

        if (editData?.departmentCode) {
            orConditions.push({ departmentCode: editData.departmentCode });
        }


        if (!orConditions.length) return null;


        const existingDepartment = await Department.findOne({
            corporateUser: corporateUserID,
            _id: { $ne: departmentId },
            $or: orConditions,
        });

        return existingDepartment;
}