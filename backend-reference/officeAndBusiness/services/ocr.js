const axios = require('axios');

exports.processInvoice = async (vendor, data) => {
  const { optional1: API_Key, apiUrl: URL } = vendor;

  try {
    if (!data || !data.buffer) {
      throw new Error("File data is missing or invalid");
    }

    const formData = new FormData();
    formData.append("file", new Blob([data.buffer], { type: "application/pdf" }), data.originalname);

    const config = {
      method: "post",
      url: `${URL}/invoice`,
      headers: {
        Authorization: `Bearer ${API_Key}`,
        "Content-Type": "multipart/form-data",
      },
      data: formData,
    };

    const result = await axios(config);

    if (!result.data) {
      throw new Error("No response data received");
    }

    return {
      status: true,
      message: 'Invoice processed successfully',
      data: result.data,
    };
  } catch (error) {
    console.error("Error processing invoice:", error.message || error);
    return {
      status: false,
      message: 'Something went wrong while processing the invoice',
      data: {},
    };
  }
};
