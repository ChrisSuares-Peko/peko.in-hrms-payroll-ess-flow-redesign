const asyncHandler = require("../../middlewares/async");
const ErrorResponse = require("../../utils/error-response");
const { customLog } = require("../../utils/loggerHelper");
const { findAllSettings, createSetting, updateSettingById } = require("../../models/use-cases/setting");
const { PROTECTED_SETTING_MESSAGE } = require("../../utils/protectedSettings");

// Coerce the incoming `details` to a JSON value. The frontend sends a parsed object, but accept a JSON
// string too (defensive boundary validation) and reject anything that isn't valid JSON.
const parseDetails = (raw) => {
  if (raw === undefined) return { error: "Value (details) is required" };
  if (typeof raw === "string") {
    try {
      return { value: JSON.parse(raw) };
    } catch {
      return { error: "Value must be valid JSON" };
    }
  }
  return { value: raw };
};

// GET /system_user/:userId/others/settings — paginated + searchable list of all settings.
exports.listSettings = asyncHandler(async (req, res) => {
  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const itemsPerPage = Math.min(Math.max(parseInt(req.query.itemsPerPage, 10) || 10, 1), 100);
  const searchText = (req.query.searchText || "").trim();
  const { rows, count } = await findAllSettings({ limit: itemsPerPage, offset: (page - 1) * itemsPerPage, searchText });
  return res.status(200).json({
    status: true,
    message: "Settings fetched successfully",
    data: { rows, count, page, itemsPerPage },
    responseCode: "000",
  });
});

// POST /system_user/:userId/others/settings — create a new setting (rejects duplicate key).
exports.createSetting = asyncHandler(async (req, res, next) => {
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) return next(new ErrorResponse("Key (name) is required", 400));
  const parsed = parseDetails(req.body.details);
  if (parsed.error) return next(new ErrorResponse(parsed.error, 400));

  const result = await createSetting({ name, details: parsed.value });
  if (result.protected) {
    customLog(req?.LogTraceId, "error", { message: "Protected setting write refused", name, by: req.user?.id });
    return next(new ErrorResponse(PROTECTED_SETTING_MESSAGE, 403));
  }
  if (result.duplicate) return next(new ErrorResponse(`A setting with the key "${name}" already exists`, 409));

  customLog(req?.LogTraceId, "info", { message: "Setting created by admin", name, by: req.user?.id });
  return res.status(200).json({
    status: true,
    message: "Setting created successfully",
    data: result.row,
    responseCode: "000",
  });
});

// PUT /system_user/:userId/others/settings/:id — update a setting's key and/or value.
exports.updateSetting = asyncHandler(async (req, res, next) => {
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id) || id <= 0) return next(new ErrorResponse("A valid setting id is required", 400));
  const name = typeof req.body.name === "string" ? req.body.name.trim() : "";
  if (!name) return next(new ErrorResponse("Key (name) is required", 400));
  const parsed = parseDetails(req.body.details);
  if (parsed.error) return next(new ErrorResponse(parsed.error, 400));

  const result = await updateSettingById(id, { name, details: parsed.value });
  if (result.notFound) return next(new ErrorResponse("Setting not found", 404));
  if (result.protected) {
    customLog(req?.LogTraceId, "error", { message: "Protected setting write refused", id, name, by: req.user?.id });
    return next(new ErrorResponse(PROTECTED_SETTING_MESSAGE, 403));
  }
  if (result.duplicate) return next(new ErrorResponse(`Another setting already uses the key "${name}"`, 409));

  customLog(req?.LogTraceId, "info", {
    message: "Setting updated by admin",
    id,
    previousName: result.previousName,
    newName: name,
    renamed: result.previousName !== name,
    by: req.user?.id,
  });
  return res.status(200).json({
    status: true,
    message: "Setting updated successfully",
    data: result.row,
    responseCode: "000",
  });
});
