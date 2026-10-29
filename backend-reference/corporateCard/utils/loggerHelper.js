const logger = require("./logger");

exports.customLog = async (
  logTraceId,
  level,
  data,
  type = "CONSOLE",
  fieldsToMask
) => {
  try {
    const callerFileAndLine = getCallerFileAndLine();
    if (
      (type !== "VENDOR" && type !== "CONSOLE") ||
      !data ||
      (level !== "info" && level !== "error")
    ) {
      return;
    }
    const category = level === "info" ? "log" : "error";

    let maskedData = data;
    if (fieldsToMask && fieldsToMask.length) {
      maskedData = maskValues(data, fieldsToMask);
    }

    if (!process.env.CLOUD_RUN_TIMEOUT_SECONDS) {
      console[category](maskedData);
      return;
    } else {
      if (isEmptyData(maskedData)) return;
      return logger[level](
        {
          data: maskedData,
          path: callerFileAndLine
        },
        { traceId: logTraceId, logType: type }
      );
    }
  } catch (e) {
    return logger.error(e, { data });
  }
};

function maskValues(obj, attributes) {
  if (typeof obj !== "object" || obj === null) {
    throw new Error("First argument must be an object.");
  }

  if (
    !Array.isArray(attributes) ||
    !attributes.every((attr) => typeof attr === "string")
  ) {
    throw new Error("Second argument must be an array of strings.");
  }

  const seenObjects = new WeakSet();

  const mask = (target) => {
    if (typeof target !== "object" || target === null) return target;

    if (seenObjects.has(target)) {
      return target;
    }

    seenObjects.add(target);

    if (Array.isArray(target)) {
      return target.map((item) => mask(item));
    }

    const result = {};
    for (const [key, value] of Object.entries(target)) {
      if (attributes.includes(key)) {
        result[key] = "*********";
      } else if (typeof value === "object" && value !== null) {
        result[key] = mask(value);
      } else {
        result[key] = value;
      }
    }

    return result;
  };

  return mask(obj);
}

function getCallerFileAndLine() {
  const errStack = new Error().stack;
  const stackLines = errStack.split("\n");

  if (stackLines.length < 4) {
    return null;
  }

  const secondCallerLine = stackLines[3].trim();

  const match = secondCallerLine.match(/\((.*):(\d+):(\d+)\)/);
  if (match) {
    const [, file, line, column] = match;
    return { file, line: Number(line), column: Number(column) };
  } else {
    const altMatch = secondCallerLine.match(/at (.*):(\d+):(\d+)/);
    if (altMatch) {
      const [, file, line, column] = altMatch;
      return { file, line: Number(line), column: Number(column) };
    }
  }

  return null;
}
function isEmptyData(data) {
  if (data === null || data === undefined) return true;
  if (typeof data === "string" && data.trim() === "") return true;
  if (Array.isArray(data) && data.length === 0) return true;
  if (typeof data === "object") {
    const keys = Object.keys(data);
    if (keys.length === 0) return true;

    const allValuesUndefined = keys.every((key) => data[key] === undefined);
    if (allValuesUndefined) return true;
  }
  return false;
}
