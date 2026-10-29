const logger = require("./logger");

const CONSOLE_CATEGORY = { info: "log", warn: "warn", error: "error" };

/**
 * Logs detailed information or error data, categorizing it by type and severity, with optional data masking.
 *
 * @function customLog
 * @param {string} logTraceId - The LogTraceId value from the `req` object to trace logs in distributed systems.
 * @param {string} level - The log level: "info" for informational logs, "warn" for warnings or "error" for error logs.
 * @param {Object|string} data - The data or information to log, typically an object or a string.
 * @param {string} [type="CONSOLE"] - The type of log, either "CONSOLE" for application-level logs or "VENDOR" for external system-related logs.
 * @param {string[]} [fieldsToMask] - An optional array of string keys whose values will be masked in the `data` object for security or privacy reasons.
 *
 * @description
 * This function is a centralized logging mechanism designed for structured, consistent, and secure log messages.
 * It allows distinguishing between application-related logs ("CONSOLE") and external system-related logs ("VENDOR").
 * The function includes data masking capabilities for sensitive fields by replacing their values with a masked string (e.g., "*********").
 * Logs are routed to either the console or a centralized logger based on the environment.
 *
 * @example
 * // Informational log example
 * const { customLog } = require('./path/to/file');
 * customLog(req?.LogTraceId, "info", { message: "Service started successfully." });
 *
 * // Error log example
 * app.post('/example', async (req, res) => {
 *   try {
 *     // Some logic here
 *   } catch (err) {
 *     await customLog(req?.LogTraceId, "error", { error: err.message, stack: err.stack }, "VENDOR");
 *     res.status(500).send('Internal Server Error');
 *   }
 * });
 *
 * // Masking sensitive data
 * app.post('/login', async (req, res) => {
 *   const userData = { username: "user123", password: "REDACTED" };
 *   await customLog(req?.LogTraceId, "info", userData, "CONSOLE", ["password"]);
 *   res.status(200).send("Logged in");
 *   // Logs: { username: "user123", password: "*********" }
 * });
 */
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
      // !logTraceId ||
      !CONSOLE_CATEGORY[level]
    ) {
      return;
    }
    const category = CONSOLE_CATEGORY[level];

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

  // To prevent cyclic reference issues
  const seenObjects = new WeakSet();

  const mask = (target) => {
    if (typeof target !== "object" || target === null) return target;

    if (seenObjects.has(target)) {
      return target; // Avoid processing cyclic references
    }

    seenObjects.add(target);

    if (Array.isArray(target)) {
      // Recursively process each element in the array
      return target.map((item) => mask(item));
    }

    const result = {};
    for (const [key, value] of Object.entries(target)) {
      if (attributes.includes(key)) {
        result[key] = "*********"; // Mask the value
      } else if (typeof value === "object" && value !== null) {
        result[key] = mask(value); // Recursively process nested objects
      } else {
        result[key] = value; // Leave other values as is
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
    return null; // not enough stack info
  }

  const secondCallerLine = stackLines[3].trim(); // 0 = 'Error', 1 = current fn, 2 = caller, 3 = caller fn triggered path

  const match = secondCallerLine.match(/\((.*):(\d+):(\d+)\)/);
  if (match) {
    const [, file, line, column] = match;
    return { file, line: Number(line), column: Number(column) };
  } else {
    // sometimes format is different (no parentheses)
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

    // Check if all values are undefined
    const allValuesUndefined = keys.every((key) => data[key] === undefined);
    if (allValuesUndefined) return true;
  }
  return false;
}