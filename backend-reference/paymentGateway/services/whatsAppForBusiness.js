const axios = require("axios");
const { fetchServiceDetails } = require("../utils/checkAndFetchServiceDetails");
const WhatsAppBusiness = require("../models/entities/whatsappBusiness");
const { customLog } = require("../utils/loggerHelper");

function formatSubscription(subscriptionPlan, duration) {
  try {

  // Determine the formatted duration based on the provided value
  let formattedDuration;
  if (duration.toLowerCase() === 'annually') {
      formattedDuration = 'YEARLY';
  } else if (duration.toLowerCase() === 'monthly') {
      formattedDuration = 'MONTHLY';
  } else {
      throw new Error('Invalid subscription duration');
  }

  let formattedPlan;
  if (subscriptionPlan.toLowerCase() === "whatsapp pro"
) {
      formattedPlan = 'PRO';
  } else if (subscriptionPlan.toLowerCase() === "whatsapp basic") {
      formattedPlan = 'BASIC';
  } else {
      throw new Error('Invalid subscription duration');
  }

  // Combine the plan and duration into the required format
  
  const plan =  `${formattedPlan}_${formattedDuration}`;
  return { status: true, message: 'Success', plan };
  } catch (error) {
    console.log(error)
      return { status: false, message: error?.message, plan: '' };
  }
  // Convert the subscription plan to uppercase
 
}

const fetchWccPlans = async (vendor) => {
  try {
      const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;

      let config = {
          method: 'get',
          url: `${URL}/partner/${PartnerId}/wcc-plans`,
          headers: {
              'Content-Type': 'application/json',
              'X-AiSensy-Partner-API-Key': `${API_Key}`
          },
          data: {}
      };

      let result = await axios(config);
      if (!result || !result?.data?.plans[0]?._id) {
          return false
      } else {
          return result?.data?.plans[0]?._id
      }
  } catch (error) {
      console.log('fetchWccPlans error:', { message: error?.message, status: error?.response?.status, data: error?.response?.data })
      return false
  }
}
exports.wccCreditUpdateApi = async (project_id, amount, vendor) => {
  try {
    const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
    // Prepare data for WCC credit update
    const wccConfig = {
      method: "patch",
      url: `${URL}/partner/${PartnerId}/project/${project_id}/billing/wcc`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": API_Key,
      },
      data: {
        amount: amount * 100000,
        action: "ADD",
      },
    };

    let { data } = await axios(wccConfig);
    if (!data) throw new Error("Error in API call");

    return { status: true, message: "success", data: data };
  } catch (error) {
    let message = error?.response?.data?.message;
    customLog(null, "info", {message, error: error?.response?.data || error?.message})
    return {
      status: false,
      message: "Something went wrong while purchasing wcc credit",
      data: error?.response?.data,
    };
  }
};

exports.createProjectApi = async (vendor, businessId, req) => {
  try {
    const { optional1: API_Key, optional2: PartnerId, apiUrl: URL, optional4: familyId } = vendor;
    let { subscriptionPlan, subscriptionDuration } = req.body;

    console.log(req.body, "<....................body...................>");
    console.log(vendor, "<...........................vendor.....................>");

    let { status, plan } = formatSubscription(subscriptionPlan, subscriptionDuration);
    console.log(status, plan, "<....................Subscription Status & Plan...................>");

    if (!status) {
      console.log("Subscription format failed");
      return { status: false, message: 'Something went wrong with subscription', data: {} };
    }

    console.log("Fetching WCC plan ID...");
    const wccId = await fetchWccPlans(vendor);
    console.log(wccId, "<....................WCC Plan ID...................>");

    if (!wccId) {
      console.log("Failed to fetch WCC plan ID");
      return { status: false, message: 'Failed to fetch WCC plan ID', data: {} };
    }

    let projectName 
        if(process.env.NODE_ENV==="production"){
            projectName = `P_${req.user.id}_${req.user.username}`
        }else{
            projectName = `U_${req.user.id}_${req.user.username}`
        }

    console.log("Project Name:", projectName);

    let config = {
      method: 'post',
      url: `${URL}/partner/${PartnerId}/business/${businessId}/project`,
      headers: {
        'Content-Type': 'application/json',
        'X-AiSensy-Partner-API-Key': `${API_Key}`
      },
      data: {
        name: projectName,
        planFamilyId: familyId, // Assuming you need to include familyId
        wccId: wccId,
        planName: plan
      }
    };

    console.log(config, "<........................Config Object..............>");
    console.log(config.data, "<........................Config Data.............>");

    console.log("Sending request to:", config.url);
    let result = await axios(config);
    
    console.log("Response received:", result?.data);

    if (result) {
      console.log("Updating database with project ID:", result.data.id);
      await WhatsAppBusiness.update(
        { projectId: result.data.id },
        { where: { businessId: businessId } }
      );
    }

    return { status: true, message: 'Projects created', data: result?.data };
  } catch (error) {
    console.log('createProjectApi error:', { message: error?.message, status: error?.response?.status, data: error?.response?.data });

    if (error?.response?.data?.message) {
      return { status: false, message: error.response.data.message, data: {} };
    }

    return { status: false, message: 'Something went wrong while creating projects', data: {} };
  }
};

exports.UpdateProjectPlanApi = async (vendor, req) => {
  try {
      const { optional1: API_Key, optional2: PartnerId, apiUrl: URL, optional4: familyId } = vendor;
      let {subscriptionPlan,subscriptionDuration,projectId} = req.body;
      let { status, plan } = formatSubscription(subscriptionPlan,subscriptionDuration)

      if (!status) {
          return { status: false, message: 'Something went wrong with subscription', data: {} }
      }

      let config = {
          method: 'patch',
          url: `${URL}/partner/${PartnerId}/project/${projectId}/billing/active-plan`,
          headers: {
              'Content-Type': 'application/json',
              'X-AiSensy-Partner-API-Key': `${API_Key}`
          },
          data: {
              newFamilyId: familyId,
              newPlan: plan
          }
      };
      
      let result = await axios(config);
      return { status: true, message: 'Project updated', data: result.data }
  } catch (error) {
      if (error?.response?.data?.message) {
          return { status: false, message: error.response.data.message, data: {} }
      }
      return { status: false, message: 'Something went wrong while updating project', data: {} }
  }
};
exports.ReActivateProjectPlanApi = async (vendor, req) => {
  try {
      const { optional1: API_Key, optional2: PartnerId, apiUrl: URL, optional4: familyId } = vendor;

      let {subscriptionPlan,subscriptionDuration,projectId} = req.body;
      let { status, plan } = formatSubscription(subscriptionPlan,subscriptionDuration)

      if (!status) {
          return { status: false, message: 'Something went wrong with subscription', data: {} }
      }

      let config = {
          method: 'patch',
          url: `${URL}/partner/${PartnerId}/project/${projectId}/billing/reactivate-project`,
          headers: {
              'Content-Type': 'application/json',
              'X-AiSensy-Partner-API-Key': `${API_Key}`
          },
          data: {
              "familyId": `${familyId}`,
              "defaultPlan": `${plan}`
          }
      };
      
      let result = await axios(config);
      return { status: true, message: 'Project renewed', data: result.data }
  } catch (error) {
      if (error?.response?.data?.message) {
          return { status: false, message: error.response.data.message, data: {} }
      }
      return { status: false, message: 'Something went wrong while updating project', data: {} }
  }
};
exports.fetchVendorDetailsByServiceDetails = async (user, accessKey) => {
  try {
    const credentialId = user.id; //will come from userObject
    const packageId = user.packageId; //will come from userObject
    const corporateUserId = user.corporateId;
    const serviceDetails = await fetchServiceDetails({
      credentialId,
      accessKey,
      packageId,
      corporateUserId,
    });
    if (Object.prototype.hasOwnProperty.call(serviceDetails, "error")) {
      throw new Error(
        "Apologies, the service you are trying to access is currently unavailable."
      );
    }
    console.log({ vendor: serviceDetails.vendor });
    return serviceDetails.vendor;
  } catch (error) {
    console.log({ error });
    throw new Error(
      "Apologies, the service you are trying to access is currently unavailable."
    );
  }
};