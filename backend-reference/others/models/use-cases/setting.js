const { Op, Sequelize } = require("sequelize");
const asyncHandler = require("../../middlewares/async");
const MOCK_CATEGORIZED_SERVICE = require("../../utils/roleAndPermissions");
const Setting = require("../entities/setting");
const defaultSearchServices = require("../../utils/defaultSearchServices.json");
const { getValue, setValue } = require("../../utils/cacheDataMethods");
const setting = require("../entities/setting");
const { isProtectedSetting } = require("../../utils/protectedSettings");

const SEARCH_SERVICES_CACHE_KEY = "searchServices_list";
const SEARCH_SERVICES_TTL = 60 * 60 * 12; // 12 hours

exports.getGstDetails = asyncHandler(async () => {
  return await Setting.findOne({
    where: {name: "taxRate"},
  });
});

exports.getPGMethods = asyncHandler(async () => {
  return await Setting.findOne({
    where: { name: "PG_Methods" },
    raw: true
  });
});

exports.getInitialServicePermission = asyncHandler(async () => {
  let data = await Setting.findOne({
    where: {
        name: "initialServicePermissions",
    },
  });

  if (!data) {
    try {
      await Setting.create({
        name: "initialServicePermissions",
        details: MOCK_CATEGORIZED_SERVICE,
      });

      data = await Setting.findOne({
        where: {
          name: "initialServicePermissions",
        },
      });
    } catch (error) {
      // If creation fails (e.g., duplicate key, database error), log and return default
      console.error("Error creating initialServicePermissions setting:", error.message);
      // Return the default value if creation fails
      return MOCK_CATEGORIZED_SERVICE;
    }
  } else {
    // Sync any new serviceCategories or services added to MOCK_CATEGORIZED_SERVICE into the DB record
    const dbDetails = data.details || [];
    let updated = false;

    for (const mockCategory of MOCK_CATEGORIZED_SERVICE) {
      const dbCategory = dbDetails.find(c => c.serviceCategory === mockCategory.serviceCategory);

      if (!dbCategory) {
        dbDetails.push(mockCategory);
        updated = true;
      } else {
        for (const mockCatGroup of (mockCategory.services || [])) {
          // Flat service list (MOCK_SERVICE style) — object has `service` key directly
          if (mockCatGroup.service !== undefined) {
            const exists = dbCategory.services.find(s => s.service === mockCatGroup.service);
            if (!exists) {
              dbCategory.services.push(mockCatGroup);
              updated = true;
            }
          } else {
            // Categorized group with nested services
            const dbGroup = dbCategory.services.find(g => g.category === mockCatGroup.category);
            if (!dbGroup) {
              dbCategory.services.push(mockCatGroup);
              updated = true;
            } else {
              for (const mockService of (mockCatGroup.services || [])) {
                const exists = dbGroup.services.find(s => s.service === mockService.service);
                if (!exists) {
                  dbGroup.services.push(mockService);
                  updated = true;
                }
              }
            }
          }
        }
      }
    }

    if (updated) {
      data.details = dbDetails;
      await data.save();
    }
  }

  return data?.details || MOCK_CATEGORIZED_SERVICE;
});

exports.upsertSetting = async (settingName, details) => {
  try {
    const setting = await Setting.findOne({ where: { name: settingName } });

    if (setting) {
      setting.details = details;
      await setting.save();
      console.log(`Setting "${settingName}" updated successfully.`);
      return setting.details; 
    } else {
      const newSetting = await Setting.create({
        name: settingName,
        details: details
      });
      console.log(`Setting "${settingName}" created successfully.`);
      return newSetting.details; 
    }
  } catch (error) {
    console.error(`Error in upserting setting "${settingName}": `, error.message);
    return false;
  }
};

exports.getASetting = async (settingName) => {
  let setting = await Setting.findOne({ where: { name: settingName } });

  if (!setting) {
      return false
  }

  return setting.details;
};

// Pass the row's updatedAt so the cache is scoped to that version — an admin save (written by
// the users service) bumps updatedAt, which misses the stale entry instead of serving it for 12h.
exports.getSearchSuggestionServices = asyncHandler(async (updatedAt = null) => {
  const cacheKey = updatedAt
    ? `${SEARCH_SERVICES_CACHE_KEY}_${new Date(updatedAt).getTime()}`
    : SEARCH_SERVICES_CACHE_KEY;
  const cached = await getValue(cacheKey);
  if (cached) return JSON.parse(cached);

  let data = await Setting.findOne({
    where: {
      name: "searchServices",
    },
  });

  if (!data) {
    await Setting.create({
      name: "searchServices",
      details: defaultSearchServices,
    });

    data = await Setting.findOne({
      where: {
        name: "searchServices",
      },
    });
  } else {
    const dbDetails = data.details || [];
    let updated = false;

    for (const service of defaultSearchServices) {
      const exists = dbDetails.find(s => s.pathKey === service.pathKey);
      if (!exists) {
        dbDetails.push(service);
        updated = true;
      }
    }

    if (updated) {
      data.details = dbDetails;
      await data.save();
    }
  }

  const services = data?.details || [];
  await setValue(cacheKey, SEARCH_SERVICES_TTL, JSON.stringify(services));
  return services;
});

// ── Admin Settings Manager (generic CRUD over the shared settings table) ──

// Paginated + searchable list of every setting row. searchText matches the key name.
exports.findAllSettings = async ({ limit, offset, searchText }) => {
  const where = searchText ? { name: { [Op.like]: `%${searchText}%` } } : {};
  return Setting.findAndCountAll({
    where,
    attributes: ["id", "name", "details"],
    order: [["name", "ASC"]],
    limit,
    offset,
  });
};

// Create a new setting. Rejects (returns { duplicate: true }) when the key already exists.
exports.createSetting = async ({ name, details }) => {
  if (isProtectedSetting(name)) return { protected: true };
  const existing = await Setting.findOne({ where: { name } });
  if (existing) return { duplicate: true };
  const created = await Setting.create({ name, details });
  return { row: { id: created.id, name: created.name, details: created.details } };
};

// Update a setting by primary key — supports renaming the key + changing details.
// Returns { notFound: true } if the id doesn't exist, { duplicate: true } if renaming onto another key.
exports.updateSettingById = async (id, { name, details }) => {
  const row = await Setting.findByPk(id);
  if (!row) return { notFound: true };
  if (isProtectedSetting(row.name) || isProtectedSetting(name)) return { protected: true };
  if (name && name !== row.name) {
    const clash = await Setting.findOne({ where: { name, id: { [Op.ne]: id } } });
    if (clash) return { duplicate: true };
  }
  const previousName = row.name;
  row.name = name;
  row.details = details;
  await row.save();
  return { row: { id: row.id, name: row.name, details: row.details }, previousName };
};

exports.getInternalAccounts = asyncHandler(async () => {
    const data = await Setting.findOne({
        where: {
            name: "internalAccounts",
        },
    });
    return data?.details || [];
});

exports.updateInternalAccounts = asyncHandler(async (payload = []) => {
    await Setting.update(
        {
            details: payload,
            updatedAt: new Date(),
        },
        {
            where: {
                name: "internalAccounts",
            },
        }
    );
});

exports.getSearchSuggestionServicesUpdatedAt = asyncHandler(async () => {
  const data = await setting.findOne({
    where: {
        name: "searchServices",
    },
    attributes: ['updatedAt'],
    raw: true,
  });
  return data?.updatedAt || null;
});

// An internal account is one of the credential ids on the Internal Accounts list. Anything unreadable counts as not internal.
exports.isInternalAccount = async (credentialId) => {
  const idNum = Number(credentialId);
  if (credentialId === null || credentialId === undefined || Number.isNaN(idNum)) return false;
  try {
    const row = await Setting.findOne({
      where: {
        name: "internalAccounts",
        [Op.and]: Sequelize.literal(`JSON_CONTAINS(details, CAST(${idNum} AS JSON))`),
      },
    });
    return !!row;
  } catch (error) {
    return false;
  }
};
