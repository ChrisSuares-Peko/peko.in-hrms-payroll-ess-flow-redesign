  const credential = require("./../entities/credential");

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
const findOneCredentialByEmail = async (params, attributes = undefined) => {
  try {
      return await credential.findOne({
          where: {
              email: params.email
          },
          attributes
      })
  } catch (error) {
      console.log(error)
  } finally {
      console.log("CREDENTIAL FIND ONE ROUTE CALLED")
  }
}
module.exports = {
  findOneCredential,findOneCredentialByEmail
};
