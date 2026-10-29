/* eslint-disable no-unused-vars */
const credential = require('./../entities/credential')
const {
    Op
} = require("sequelize");

const createCredential = async (params) => {
    try {
        return await credential.create(params)
    } catch (error) {
        console.log(error.message)
    } finally {
        console.log("CREDENTIAL CREATE ROUTE CALLED")
    }
}

const findOneCredential = async (params, attributes = undefined) => {
    try {
        return await credential.findOne({
            where: {
                id: params.id
            },
            attributes
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CREDENTIAL FIND ONE ROUTE CALLED")
    }
}

const findAllCredential = async (params) => {
    try {
        return await credential.findAll({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CREDENTIAL FIND ALL ROUTE CALLED")
    }
}

const updateCredential = async (params) => {
    try {
        return await credential.update({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error)
    } finally {
        console.log("CREDENTIAL FIND ALL ROUTE CALLED")
    }
}

const deleteCredential = async (params) => {
    try {
        return await credential.destroy({
            where: {
                id: params.id
            }
        })
    } catch (error) {
        console.log(error.message.message)
    } finally {
        console.log("CREDENTIAL DELETE ROUTE CALLED")
    }
}

const changePassword = async (details, callback) => {
    const userDetails = details
    try {
        const userData = await credential.findOne({
            where: {
                id: userDetails.id
            },
            attributes: ['password']
        })
        if (!userData || userData.length < 1)
            callback({
                responseCode: '900',
                responseMessage: "Sorry, the user doesn't exist"
            })
        if (userData.validatePassword(userDetails.oldPassword)) {
            var newPassword = credential.hashPassword(userDetails.newPassword)
            const updatedData = await credential.update({
                password: newPassword
            }, {
                where: {
                    id: userDetails.id
                }
            })
            if (!updatedData || updatedData.length < 1)
                callback({
                    responseCode: '999',
                    responseMessage: "An error occured while updating the password"
                })
            callback({
                responseCode: '000',
                responseMessage: "Password changed successfully"
            })
        } else {
            callback({
                responseCode: '902',
                responseMessage: "Password mismatch"
            })
        }

    } catch (err) {
        console.log(err)
        callback({
            responseCode: '999',
            responseMessage: 'Internal server error'
        })
    }
}
const fetchAllCorporate = async (query, res) => {
    try {
        return await credential.findAll({
            where: {
                username: {
                    [Op.like]: '%' + query + '%'
                }
            },
            attributes: ['id', 'username']
        })
    } catch (error) {
        console.log(error)
        console.log(error.message.message)
    } finally {
        console.log("FETCH CORPORATE  ROUTE CALLED")
    }
}
module.exports = {
    createCredential,
    findOneCredential,
    findAllCredential,
    updateCredential,
    deleteCredential,
    changePassword,
    fetchAllCorporate
}