const credential = require("../entities/credential");
const {
  Op
} = require("sequelize");
const findOneCredential = async (params, attributes = undefined) => {
  try {
    return await credential.findOne({
      where: {
        id: params.id,
      },
      attributes,
    });
  } catch (error) {
    console.log(error);
  } finally {
    console.log("CREDENTIAL FIND ONE ROUTE CALLED");
  }
};


const findOneCredentialWithUsername = async (username) => {
  try {
      return await credential.findOne({
          where: {
              [Op.or]: [
                { username: username, role: "CORPORATE" },
                { email: username, role: "CORPORATE" },
                { username: username, role: "SYSTEM_USER" },
                { email: username, role: "SYSTEM_USER" },
                { email: username, role: "CORPORATE_SUB_USER" },
                { username: username, role: "CORPORATE_SUB_USER" },
              ],
            },
          attributes:['passwordProtection']
      })
  } catch (error) {
      console.log(error)
  } finally {
      console.log("CREDENTIAL FIND ONE ROUTE CALLED")
  }
}

const updateCredentials = async (credentialId, data) => {
  try {
      return await credential.update(data, {
          where: {
            id: credentialId
          },
        });
  } catch (error) {
      console.log(error)
      
  }    
};

module.exports = {
  findOneCredential,
  findOneCredentialWithUsername,
  updateCredentials
};
