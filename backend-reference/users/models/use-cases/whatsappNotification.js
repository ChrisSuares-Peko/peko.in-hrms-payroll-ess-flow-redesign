const asyncHandler = require("../../middlewares/async");
const { customLog } = require("../../utils/loggerHelper.js");
const Setting = require("../entities/setting.js");

exports.createOrUpdateWhatsAppNumberSetting = asyncHandler(async ({ name, whatsappNumber, username }) => {
    const existingSetting = await Setting.findOne({ where: { name } });

    const newDetail = { whatsappNumber, status: true, name: username };

    if (existingSetting) {
        existingSetting.details = [...existingSetting.details, newDetail];
        await existingSetting.save();

        return { updated: true, setting: existingSetting };
    }

    const newSetting = await Setting.create({
        name,
        details: [newDetail]
    });

    return { updated: false, setting: newSetting };
});



exports.fetchWhatsAppNumbers = asyncHandler(async (searchText, page, itemsPerPage) => {
    const setting = await Setting.findOne({
        where: { name: 'whatsAppNotifications' },
        attributes: ['details']
    });

    if (!setting) return { numbers: [], totalCount: 0 };

    const detailsArray = Array.isArray(setting.details)
        ? setting.details
        : [];

    const query = (searchText || "").toLowerCase();

    const filteredDetails = query
        ? detailsArray.filter(item =>
            (item?.whatsappNumber || "").toLowerCase().includes(query) ||
            (item?.name || "").toLowerCase().includes(query)
        )
        : detailsArray;

    const totalCount = filteredDetails.length;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;

    return {
        numbers: filteredDetails.slice(startIndex, endIndex),
        totalCount
    };
});


exports.changeWhatsAppNumber = asyncHandler(async (currentNumber, data) => {
    const setting = await Setting.findOne({ where: { name: 'whatsAppNotifications' } });
    if (!setting) return null;

    const {name, whatsappNumber} = data

    const updatedDetails = setting.details.map(item => {
        if (item.whatsappNumber === currentNumber) {
            return { ...item, whatsappNumber, name };
        }
        return item;
    });

    await setting.update({ details: updatedDetails });

    return updatedDetails;
});


exports.changeWhatsAppStatus = asyncHandler(async (whatsappNumber, status) => {
    const setting = await Setting.findOne({ where: { name: 'whatsAppNotifications' } });
    if (!setting) return null;

    const updatedDetails = setting.details.map(item => {
        if (item.whatsappNumber === whatsappNumber) {
            return { ...item, status };
        }
        return item;
    });

    await setting.update({ details: updatedDetails });

    return updatedDetails;
});


exports.deleteWhatsAppNumber = asyncHandler(async (numberToDelete) => {
    const setting = await Setting.findOne({
        where: { name: 'whatsAppNotifications' }
    });

    if (!setting) return null;

    const updatedDetails = setting.details.filter(item => item.whatsappNumber !== numberToDelete);
    if (updatedDetails.length === setting.details.length) {
        throw new Error('WhatsApp number not found');
    }

    await setting.update({ details: updatedDetails });

    return updatedDetails;
});

exports.getActiveWhatsAppNumbers = asyncHandler(async () => {
    try {
        const details = await Setting.findAll({
            where: {
                name: 'whatsAppNotifications'
            },
            attributes: ['details'],
            raw: true
        })
        // Extract and filter WhatsApp numbers with status: true
        const activeWhatsappNumbers = details.flatMap(setting =>
            setting.details
                .filter(detail => detail.status === true)
                .map(detail => detail.whatsappNumber)
        );

        return activeWhatsappNumbers;
    } catch (error) {
        console.log(error)
    } finally {
        console.log("FETCH ALL ACTIVE WHATSAPP NUMBER CALLED")
    }
})

exports.isNameOrNumberExists = asyncHandler(async (whatsappNumber, username) => {
    const name = "whatsAppNotifications"
    const data = await Setting.findOne({
        where: {
            name
        }
    })

    if(!data){
        return false
    }

    for(let entry of data.details) {
        if(entry.whatsappNumber == whatsappNumber) return { message: "WhatsApp number already exists"}
    }
    for(let entry of data.details) {
        if(entry.name == username) return { message: 'Name already exists'}
    }

    return false
});

exports.isDuplicateEntry = asyncHandler(async (currentNumber, {whatsappNumber, name: username}) => {
    const name = "whatsAppNotifications"
    const data = await Setting.findOne({
        where: {
            name
        }
    })

    for(let entry of data.details) {
        if(entry.whatsappNumber === whatsappNumber && entry.whatsappNumber !== currentNumber) return { message: "WhatsApp number already exists"}
    }
    for(let entry of data.details) {
        if(entry.name == username && entry.whatsappNumber !== currentNumber) return { message: 'Name already exists'}
    }

    return false
});

exports.whatsAppNumberExport = asyncHandler(async (params) => {
    try {
  let {searchText}= params
     const setting = await Setting.findOne({
          where: { name: 'whatsAppNotifications' },
          attributes: ['details']
      });
      // If searchText is empty, use all details
      const result = searchText
          ? setting.details.filter(item =>
              item.whatsappNumber.toLowerCase().includes(searchText.toLowerCase())||
              item.name.toLowerCase().includes(searchText.toLowerCase())
          )
          : setting.details;
      let finalData = [];
      result.forEach(function (limitData) {
        finalData.push({
          "Name": limitData.name|| "Not Available",
          "WhatsApp Number": limitData.whatsappNumber|| "Not Available",
          "Status": limitData.status || "Not Available",
        });
      });
     
      return finalData;
    } catch (error) {
      console.error(error)
      customLog(null, "error", { message: "An error occurred", error: error });
      throw { message: "Something went wrong" };
    }
  });