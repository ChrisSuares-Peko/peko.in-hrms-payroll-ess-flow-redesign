/* eslint-disable no-unused-vars */
const axios = require("axios");
const {
  findWhatsappSubscriptions,
} = require("../models/use-cases/subscription");
const { customLog } = require("../utils/loggerHelper");

const updateActivePlans = async (projectId, vendor, plan) => {
  try {
    const config = {
      method: "patch",
      url: `${vendor.apiUrl}/partner/${vendor.optional2}/project/${projectId}/billing/active-plan`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": vendor.optional1,
      },
      data: {
        newFamilyId: vendor.optional4,
        newPlan: plan,
      },
    };

    const result = await axios(config);
    if (!result) {
      return false;
    }
    return {
      success: result.data.status === "success", // Adjust based on actual API response structure
      message: result.data.message,
    };
  } catch (error) {
    return false;
  }
};
const formatDate = (dateString) => {
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
function getSubscriptionPlan(subscription) {
  console.log({ subscription });
  try {
    const planMapping = {
      monthly: {
        "whatsapp basic": "BASIC_MONTHLY",
        "whatsapp pro": "PRO_MONTHLY",
        standard: "BASIC_MONTHLY",
        premium: "PRO_MONTHLY",
      },
      annually: {
        "whatsapp basic": "BASIC_YEARLY",
        "whatsapp pro": "PRO_YEARLY",
        standard: "BASIC_YEARLY",
        premium: "PRO_YEARLY",
      },
    };

    const billingType = subscription?.billingType?.toLowerCase();
    const packageName = subscription?.package?.packageName?.toLowerCase();

    if (!planMapping[billingType])
      throw new Error("Billing type is not available");

    const plan = planMapping[billingType][packageName];
    if (!plan) throw new Error("Invalid package name");

    return { status: true, message: "Success", plan };
  } catch (error) {
    return { status: false, message: error?.message, plan: "" };
  }
}

exports.createBusinessProfileApi = async (req, vendor) => {
  const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
  let result;
  try {
    const trim = (v) => (typeof v === 'string' ? v.trim() : '');
    const businessName =
      trim(req.user.name) || trim(req.user.contactPersonName) || trim(req.user.username) || 'Peko Business';
    const email = trim(req.user.email).toLowerCase();
    const config = {
      method: "post",
      url: `${URL}/partner/${PartnerId}/business`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": `${API_Key}`,
      },
      data: {
        display_name: businessName,
        email,
        company: businessName,
        contact: req.user.mobileNo,
        timezone: "",
        companySize: req.user.companySize ? req.user.companySize : "",
        password: "",
      },
    };
    customLog(req?.LogTraceId, "info", {
      message: "createBusinessProfileApi request",
      url: config.url,
      method: config.method,
      payload: config.data,
    }, "VENDOR");
    result = await axios(config);
    let data = result?.data;
    if (!data) {
      throw new Error("Error in api call");
    }
    customLog(req?.LogTraceId, "info", {
      message: "createBusinessProfileApi response",
      data,
    }, "VENDOR");
    return { status: true, message: "success", data: data };
  } catch (error) {
    customLog(req?.LogTraceId, "error", {
      message: "createBusinessProfileApi error",
      data: error?.response?.data ?? error?.message ?? error,
    }, "VENDOR");
    let message = error?.response?.data?.message;
    return {
      status: false,
      message:
        message || "Something went wrong while creating business profile",
      data: error?.response?.data,
    };
  }
};

exports.updateActivePlansApi = async (
  corporateUserId,
  vendor,
  businessId,
  accessKey
) => {
  const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
  let result;
  try {
    const subscription = await findWhatsappSubscriptions(
      corporateUserId,
      accessKey
    );

    let { status, message, plan } = getSubscriptionPlan(subscription);
    if (!status) {
      console.log({ message });
      return {
        status: false,
        message: "Something went wrong with subscription",
        data: {},
      };
    }

    const config = {
      method: "get",
      url: `${URL}/partner/${PartnerId}/business/${businessId}/project`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": `${API_Key}`,
      },
    };
    try {
      result = await axios(config);
    } catch (error) {
      const errorData = error?.response?.data;
      if (errorData?.message == "Project doesn't exist!") {
        return {
          status: true,
          message: "Business profile already created, project doesn't exist",
          data: errorData,
        };
      } else {
        return {
          status: false,
          message: "Something went wrong while fetching projects",
          data: {},
        };
      }
    }
    const projectData = result?.data;
    if (projectData?.projects.length >= 0) {
      if (
        plan != projectData?.projects[0]?.active_plan &&
        projectData?.projects[0]?.active_plan != "NONE"
      ) {
        const results = await Promise.all(
          projectData?.projects.map((project) =>
            updateActivePlans(project.id, vendor, plan)
          )
        );
        // partial case ----PENDING
        if (results) {
          return {
            status: true,
            message:
              "Business profile already created and plan switched successfully",
            data: results,
          };
        }
      }
    }
    return {
      status: true,
      message: "Business profile already created",
      data: projectData,
    };
  } catch (error) {
    console.error("Error:", { error });
    return {
      status: false,
      message: "Something went wrong while updating plans",
      data: {},
    };
  }
};

exports.fetchAllProjectsApi = async (vendor, businessId) => {
  const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
  let result;
  try {
    let config = {
      method: "get",
      url: `${URL}/partner/${PartnerId}/business/${businessId}/project`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": `${API_Key}`,
      },
    };
    result = await axios(config);
    result.data.projects.sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    let projects = result.data.projects.map((project) => {
      return {
        ...project,
        credit: project.credit ? project.credit / 100000 : 0,
        created_at: project.created_at ? formatDate(project.created_at) : null,
        updated_at: project.updated_at
          ? new Date(project.updated_at).toLocaleDateString()
          : null,
        plan_activated_on: project.plan_activated_on
          ? new Date(project.plan_activated_on).toLocaleDateString()
          : null,
        subscription_started_on: project.subscription_started_on
          ? new Date(project.subscription_started_on).toLocaleDateString()
          : null,
        plan_renewal_on: project.plan_renewal_on
          ? new Date(project.plan_renewal_on).toLocaleDateString()
          : null,
      };
    });
    return {
      status: true,
      message: "Projects fetched successfully",
      data: projects,
    };
  } catch (error) {
    console.log({ error });
    console.log({ errorResponseData: error?.response?.data });
    if (
      error?.response &&
      error?.response?.data?.message === "Project doesn't exist!"
    ) {
      return {
        status: true,
        message: "Projects fetched successfully",
        data: [],
      };
    }
    return {
      status: false,
      message: "Something went wrong while fetching projects",
      data: {},
    };
  }
};

exports.stopBillingForProjectApi = async (id, vendor) => {
  const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
  try {
    const config = {
      method: "patch",
      url: `${URL}/partner/${PartnerId}/stop-project-billing/${id}`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": `${API_Key}`,
      },
    };
    const result = await axios(config);
    return {
      projectId: id,
      success: true,
      message: result?.data?.message,
    };
  } catch (error) {
    console.log({ errorResData: error?.response?.data });
    return {
      projectId: id,
      success: false,
      message: error?.response
        ? error?.response?.data?.message
        : error?.message,
    };
  }
};

exports.stopProjectsBillingApi = async (vendor, projectData) => {
  try {
    let projectIds = projectData
      .filter((project) => project?.credit >= 1)
      .map((project) => project.id);
    if (Array.isArray(projectIds) && projectIds?.length === 0) {
      return {
        status: true,
        message: "Projects stopped successfully",
        data: [],
      }; // no need to stop billing boz credit < 1
    }

    const results = await Promise.all(
      projectIds.map(
        async (id) => await exports.stopBillingForProjectApi(id, vendor)
      )
    );

    return {
      status: true,
      message: "Projects stopped successfully",
      data: results,
    };
  } catch (error) {
    return {
      status: false,
      message: "Something went wrong while stopping projects",
      data: {},
    };
  }
};
const fetchWccPlans = async (vendor) => {
  try {
    const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;

    let config = {
      method: "get",
      url: `${URL}/partner/${PartnerId}/wcc-plans`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": `${API_Key}`,
      },
      data: {},
    };

    let result = await axios(config);
    if (!result || !result?.data?.plans[0]?._id) {
      return false;
    } else {
      return result?.data?.plans[0]?._id;
    }
  } catch (error) {
    console.log({ error });
    return false;
  }
};

exports.createProjectApi = async (vendor, subscription, businessId, req) => {
  try {
    const {
      optional1: API_Key,
      optional2: PartnerId,
      apiUrl: URL,
      optional4: familyId,
    } = vendor;
    let { name } = req.body;

    let { status, message, plan } = getSubscriptionPlan(subscription);
    if (!status) {
      console.log({ message });
      return {
        status: false,
        message: "Something went wrong with subscription",
        data: {},
      };
    }

    const wccId = await fetchWccPlans(vendor);
    if (!wccId)
      return {
        status: false,
        message: "Failed to fetch WCC plan ID",
        data: {},
      };

    let config = {
      method: "post",
      url: `${URL}/partner/${PartnerId}/business/${businessId}/project`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": `${API_Key}`,
      },
      data: {
        name: name,
        planFamilyId: familyId, // Assuming you need to include familyId
        wccId: wccId,
        planName: plan,
      },
    };

    let result = await axios(config);

    return { status: true, message: "Projects created", data: result?.data };
  } catch (error) {
    if (error?.response?.data?.message) {
      return { status: false, message: error.response.data.message, data: {} };
    }
    return {
      status: false,
      message: "Something went wrong while creating projects",
      data: {},
    };
  }
};

exports.findOneProjectApi = async (id, vendor) => {
  try {
    const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
    let projectConfig = {
      method: "get",
      url: `${URL}/partner/${PartnerId}/project/${id}`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": `${API_Key}`,
      },
    };
    const { data } = await axios(projectConfig);
    if (!data) throw new Error("Error in API call");

    return { status: true, message: "success", data: data };
  } catch (error) {
    console.log({ errorRes: error?.response || error });
    let message = error?.response?.data?.message;
    return {
      status: false,
      message: "Something went wrong while fetching project",
      data: error?.response?.data,
    };
  }
};

exports.reactivateProjectBillingApi = async (id, vendor) => {
  try {
    const {
      optional1: API_Key,
      optional2: PartnerId,
      apiUrl: URL,
      optional4: familyId,
    } = vendor;

    let {
      status,
      message,
      data: project,
    } = await exports.findOneProjectApi(id, vendor);
    if (!status) return { status: false, message, data: project };

    let config = {
      method: "patch",
      url: `${URL}/partner/${PartnerId}/project/${id}/billing/reactivate-project`,
      headers: {
        "Content-Type": "application/json",
        "X-AiSensy-Partner-API-Key": `${API_Key}`,
      },
      data: {
        familyId: `${familyId}`,
        defaultPlan: `${project?.active_plan}`,
      },
    };

    let result = await axios(config);

    let data = result?.data;
    if (!data) throw new Error("Error in api call");

    return { status: true, message: "success", data: data };
  } catch (error) {
    console.log({ errorRes: error?.response || error });
    let message = error?.response?.data?.message;
    return {
      status: false,
      message: "Something went wrong while reactivating project billing",
      data: error?.response?.data,
    };
  }
};

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
    console.log({ errorRes: error?.response || error });
    let message = error?.response?.data?.message;
    return {
      status: false,
      message: "Something went wrong while purchasing wcc credit",
      data: error?.response?.data,
    };
  }
};

exports.checkProjectExistApi = async (vendor, businessId, name) => {
  const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
  let result;
  try {
      let config = {
          method: 'get',
          url: `${URL}/partner/${PartnerId}/business/${businessId}/project`,
          headers: {
              'Content-Type': 'application/json',
              'X-AiSensy-Partner-API-Key': `${API_Key}`
          },
      };
      result = await axios(config);

      // Check if a project with the same name exists
      let existingProject = result.data.projects.find(project => project.name === name);

      if (existingProject) {
          // If project exists, return a message with the existing project details
          return { 
              status: false, 
              message: `Project with the name "${name}" already exists. Please create a new project with a different name.`,
              data: {}
          };
      }

      // If no project with the same name is found, return an empty object with a "nothing exists" message
      return { 
          status: true, 
          message: 'Project not exist with the provided name', 
          data: {} 
      };

  } catch (error) {
      console.log({ error });
      console.log({ errorResponseData: error?.response?.data });
      if (error?.response && error?.response?.data?.message === "Project doesn't exist!") {
          return { status: true, message: 'Projects fetched successfully', data: [] };
      }
      return { status: false, message: 'Something went wrong while fetching projects', data: {} };
  }
};

exports.EmbeddedSignupURL = async (req, vendor,businessId,project_id) => {
  const { optional1: API_Key, optional2: PartnerId, apiUrl: URL } = vendor;
  let result;
  try {
      const config = {
          method: 'post',
          url: `${URL}/partner/${PartnerId}/generate-waba-link`,
          headers: {
              'Content-Type': 'application/json',
              'X-AiSensy-Partner-API-Key': `${API_Key}`
          },
          data: {
              businessId,
              assistantId:project_id,
              setup:{
                  name:req.user.name,
                  email:req.user.email,
                  phone:{
                      code:1,
                      number:req.user.mobileNo
                  }
              }
          }
      };

      result = await axios(config);
      let data = result?.data
      if (!data) {
          throw new Error('Error in api call')
      }
      return { status: true, message: 'success', data: data }
  } catch (error) {
      console.log({ error })
      let message = error?.response?.data?.message
      return { status: false, message: message || 'Something went wrong while generating Embedded SignupURL', data: error.response.data }
  }
};