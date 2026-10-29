const Employee = require("../entities/employee");
const { escapeSearch } = require('../../utils/escapeRegex');


// exports.getAllDocuments = async (params) => {
//     try {
//         const { corporateUserID, limit, searchText, page, fullName } = params;
//         const skip = (page - 1) * limit;

//         let matchQuery = {
//             isEmployeeDeleted: false,
//             corporateUser: corporateUserID
//         };

//         if (searchText) {
//             matchQuery.$or = [
//                 { 'employeeDocuments.name': { $regex: searchText, $options: 'i' } },
//                 { 'fullName': { $regex: searchText, $options: 'i' } }
//             ];
//         }

//         if (fullName) {
//             matchQuery.fullName = { $regex: fullName, $options: 'i' };
//         }

//         const pipeline = [
//             { $match: matchQuery },
//             { $unwind: '$employeeDocuments' },
//             {
//                 $match: {
//                     $or: [
//                         { 'employeeDocuments.name': { $regex: searchText, $options: 'i' } },
//                         { 'fullName': { $regex: searchText, $options: 'i' } }
//                     ]
//                 }
//             },
//             {
//                 $project: {
//                     _id: 1,
//                     fullName: 1,
//                     createdAt: 1,
//                     'employeeDocuments.name': 1,
//                     'employeeDocuments.url': 1,
//                     'employeeDocuments.expiryDate': 1,
//                     'employeeDocuments.holderName': 1,
//                     'employeeDocuments._id': 1 
//                 }
//             },
//             {
//                 $group: {
//                     _id: '$_id',
//                     fullName: { $first: '$fullName' },
//                     createdAt: { $first: '$createdAt' },
//                     employeeDocuments: {
//                         $push: {
//                             name: '$employeeDocuments.name',
//                             url: '$employeeDocuments.url',
//                             expiryDate: '$employeeDocuments.expiryDate',
//                             holderName: '$employeeDocuments.holderName',
//                             _id: '$employeeDocuments._id',
//                         }
//                     }
//                 }
//             },
//             { $sort: { createdAt: -1 } } // Sort by creation date or any other field as needed
//         ];

//         const employees = await Employee.aggregate(pipeline).exec();

//         // Flatten the documents and apply pagination
//         const allDocuments = employees.flatMap(employee => {
            
//             return employee.employeeDocuments.map(document => ({
//                 ...document,
//                 name: formatDocName(document.name),
//                 createdAt: employee.createdAt,
//                 fullName: employee.fullName,
//                 employeeId: employee._id,
//                 _id:document._id,
//             }));
//         });

//         const paginatedDocuments = allDocuments.slice(skip, skip + limit);
        

//         return {
//             documents: paginatedDocuments,
//             total: allDocuments.length
//         };
//     } catch (error) {
//         throw new Error("Error")
//         console.error('Error in getAllDocuments:', error);
//         return { errors: error };
//     }
// };


exports.getAllDocuments = async (params) => {
    try {
        const { corporateUserID, limit, searchText, page, fullName } = params;
        const skip = (page - 1) * limit;

        let matchQuery = {
            isEmployeeDeleted: false,
            corporateUser: corporateUserID
        };

        if (searchText) {
            matchQuery.$or = [
                { 'employeeDocuments.name': { $regex: escapeSearch(searchText), $options: 'i' } },
                { 'fullName': { $regex: escapeSearch(searchText), $options: 'i' } }
            ];
        }

        if (fullName) {
            matchQuery['personalInformation.fullName'] = { $regex: escapeSearch(fullName), $options: 'i' };
        }

        const pipeline = [
            { $match: matchQuery },
            { $unwind: '$employeeDocuments' },
            {
                $match: {
                    $or: [
                        { 'employeeDocuments.name': { $regex: escapeSearch(searchText), $options: 'i' } },
                        { 'fullName': { $regex: escapeSearch(searchText), $options: 'i' } }
                    ]
                }
            },
            {
                $project: {
                    _id: 1,
                    fullName: '$personalInformation.fullName',
                    createdAt: 1,
                    'employeeDocuments.name': 1,
                    'employeeDocuments.url': 1,
                    'employeeDocuments.expiryDate': 1,
                    'employeeDocuments.holderName': 1,
                    'employeeDocuments._id': 1 
                }
            },
            {
                $group: {
                    _id: '$_id',
                    fullName: { $first: '$fullName' },
                    createdAt: { $first: '$createdAt' },
                    employeeDocuments: {
                        $push: {
                            name: '$employeeDocuments.name',
                            url: '$employeeDocuments.url',
                            expiryDate: '$employeeDocuments.expiryDate',
                            holderName: '$employeeDocuments.holderName',
                            _id: '$employeeDocuments._id',
                        }
                    }
                }
            },
            { $sort: { createdAt: -1 } } // Sort by creation date or any other field as needed
        ];

        const employees = await Employee.aggregate(pipeline);

        // Flatten the documents and apply pagination
        const allDocuments = employees.flatMap(employee => {
            return employee.employeeDocuments.map(document => ({
                ...document,
                name: document.name,
                createdAt: employee.createdAt,
                fullName: employee.fullName,
                employeeId: employee._id,
                _id: document._id,
            }));
        });

        const paginatedDocuments = allDocuments.slice(skip, skip + limit);

        return {
            documents: paginatedDocuments,
            total: allDocuments.length
        };
    } catch (error) {
        console.error('Error in getAllDocuments:', error);
        throw error;
    }
};




exports.findEmployeeDetails = async (employeeId, corporateUserId) => {
    
    try {
        const query = {
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false
        };

        const employeeDetails = await Employee.findOne(query);
        

        return employeeDetails;
    } catch (error) {
        return { errors: error };
    }
}

exports.addEmployeeDocument = async (employeeId, corporateUserId, documentData) => {
    try {
        const query = {
            _id: employeeId,
            corporateUser: corporateUserId,
            isEmployeeDeleted: false,
        };

        const update = {
            $push: { employeeDocuments: documentData }
        };

        const options = {
            new: true
        };

        const updatedEmployee = await Employee.findOneAndUpdate(query, update, options);
        return updatedEmployee;
    } catch (error) {
        throw new Error('Failed to add document to employee: ' + error.message);
    }
}

exports.findEmployeeById = async (employeeId, userId) => {
    try {
        return await Employee.findOne({
            _id: employeeId,
            corporateUser: userId,
            isEmployeeDeleted: false,
        });
    } catch (error) {
        return { errors: error };
    }
}

// Per-employee document CRUD, all against the same Employee.employeeDocuments
// array the ESS "My Documents" tab and onboarding already read/write — so
// anything HR adds here is immediately visible to the employee.
const findScopedEmployee = (employeeId, corporateUserId, selectFields) => {
    const query = Employee.findOne({
        _id: employeeId,
        corporateUser: corporateUserId,
        isEmployeeDeleted: false,
    });
    return selectFields ? query.select(selectFields) : query;
};

exports.findEmployeeDocumentsInArray = async (employeeId, corporateUserId, { page = 1, limit = 10, search } = {}) => {
    const employee = await findScopedEmployee(employeeId, corporateUserId, 'employeeDocuments');
    if (!employee) return null;

    let docs = employee.employeeDocuments || [];
    if (search) {
        const regex = new RegExp(escapeSearch(search), 'i');
        docs = docs.filter(d => regex.test(d.name));
    }
    docs = [...docs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = docs.length;
    const skip = (page - 1) * limit;
    return { documents: docs.slice(skip, skip + limit), total };
};

exports.documentNameExistsForEmployee = async (employeeId, corporateUserId, name) => {
    const employee = await findScopedEmployee(employeeId, corporateUserId, 'employeeDocuments');
    if (!employee) return false;
    return (employee.employeeDocuments || []).some(d => d.name === name);
};

exports.findEmployeeDocumentInArrayById = async (documentId, employeeId, corporateUserId) => {
    const employee = await findScopedEmployee(employeeId, corporateUserId, 'employeeDocuments');
    if (!employee) return null;
    return employee.employeeDocuments.find(d => d._id.toString() === documentId) || null;
};

exports.updateEmployeeDocumentInArray = async (documentId, employeeId, corporateUserId, documentData) => {
    const employee = await findScopedEmployee(employeeId, corporateUserId);
    if (!employee) return null;
    const doc = employee.employeeDocuments.find(d => d._id.toString() === documentId);
    if (!doc) return null;

    doc.name = documentData.name;
    doc.url = documentData.url;
    doc.expiryDate = documentData.expiryDate;
    await employee.save();
    return doc;
};

exports.deleteEmployeeDocumentFromArray = async (documentId, employeeId, corporateUserId) => {
    const employee = await findScopedEmployee(employeeId, corporateUserId);
    if (!employee) return null;
    const doc = employee.employeeDocuments.find(d => d._id.toString() === documentId);
    if (!doc) return null;

    employee.employeeDocuments.pull({ _id: documentId });
    await employee.save();
    return doc;
};
