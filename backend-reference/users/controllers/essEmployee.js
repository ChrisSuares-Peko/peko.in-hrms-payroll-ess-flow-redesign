const asyncHandler = require("../middlewares/async");
const ErrorResponse = require("../utils/error-response");
const { customLog } = require("../utils/loggerHelper");
const {
  createUser,
  findUserAccountByEmail,
  resendUserPasswordEmail,
  listUsersByCorporate,
  deactivateUserByEmployeeId,
  linkSelfAsEmployee,
  linkEmployeeIdentity,
  updateEssEmail,
  updateUserById,
} = require("../models/use-cases/user");
const { resolveInviteTarget, WANTS, ACTION } = require("../models/use-cases/identityLink");
const { findOneCredential } = require("../models/use-cases/credential");
const { fetchPartnerDetails } = require("../models/use-cases/systemUser");
const corporateUser = require("../models/entities/corporateUser");
const { grantEmployeeService } = require("../models/use-cases/employeeServiceGrant");
const { holdsService } = require("../models/use-cases/serviceMembership");
const { EMPLOYEE_SERVICE, MEMBERSHIP_STATUS } = require("../constants/employeeServices");

// Invite an employee to the Employee Self-Service (ESS) portal.
exports.createEssUser = asyncHandler(async (req, res, next) => {
  try {
    if (req.user.role !== "CORPORATE") {
      return next(new ErrorResponse("Only a corporate account can send an ESS invite.", 403));
    }

    const { name, email, mobileNo, employeeId } = req.body;
    // An ESS invite grants Payroll and nothing else. A caller-supplied userAccessService was stored as-is and
    // trusted downstream, which let a corporate grant services (e.g. Corporate Cards Admin) its partner never
    // licensed; other services are granted through their own invite flows, which clamp against the licence.
    const userAccessService = { permission: [{ label: EMPLOYEE_SERVICE.PAYROLL, hasAccess: true }] };
    const baseUrl = req.body.baseUrl;

    // Only a row that already holds Payroll is a duplicate ESS invite. A row created by another service
    // (e.g. a Corporate Cards member with no Payroll grant yet) falls through to resolveInviteTarget below,
    // which adopts it instead of blocking on it.
    const existingUser = await findUserAccountByEmail(email);
    if (existingUser && holdsService(existingUser.userAccessService, EMPLOYEE_SERVICE.PAYROLL)) {
      // Rehire: the login still points at the employee's earlier record in this company. Payroll lets
      // only one active employee per company hold a work email, so that record is a past (or deleted)
      // employee. Move the login to the new record instead of rejecting it; they keep their password.
      const isRehire =
        !!employeeId &&
        !!existingUser.employeeId &&
        existingUser.employeeId !== employeeId &&
        String(existingUser.corporateUserId) === String(req.user.corporateId);
      if (isRehire) {
        const previousEmployeeId = existingUser.employeeId;
        await updateUserById(existingUser.id, { employeeId, name, mobileNo, isActive: true });
        customLog(req?.LogTraceId, "info", {
          message: "ESS login moved to rehired employee record",
          userId: existingUser.id,
          previousEmployeeId,
          employeeId,
        });
        if (!existingUser.credential?.password) {
          await resendUserPasswordEmail(existingUser, baseUrl);
        }
        return res.status(200).json({
          status: true,
          message: existingUser.credential?.password
            ? "ESS access restored for the rehired employee. They can sign in with their existing password."
            : "ESS access restored for the rehired employee. The set-password invite has been resent.",
          data: { rehired: true },
          responseCode: "000",
        });
      }

      if (existingUser.credential?.password) {
        return next(new ErrorResponse("An ESS account already exists for this email address.", 400));
      }
      await resendUserPasswordEmail(existingUser, baseUrl);
      return res.status(200).json({
        status: true,
        message: "This employee was already invited. The set-password invite has been resent.",
        data: { resent: true },
        responseCode: "000",
      });
    }

    // Self-as-employee: the corporate is adding themselves (same email as their
    // own login) — reuse the existing credential instead of creating a new one.
    // Match against the credential's own email/username, since the session's
    // profile email (req.user.email) can differ from the login email.
    const selfCredential = await findOneCredential({ id: req.user.id }, ["email", "username"]);
    const selfIdentifiers = [req.user.email, selfCredential?.email, selfCredential?.username]
      .filter(Boolean)
      .map((e) => String(e).toLowerCase());
    const isSelfEmployee = !!email && selfIdentifiers.includes(email.toLowerCase());

    if (isSelfEmployee) {
      const partnerData = await fetchPartnerDetails(req.user.registeredBy);
      const linkedUser = await linkSelfAsEmployee({
        credentialId: req.user.id,
        userData: {
          name,
          email,
          mobileNo,
          employeeId,
          corporateUserId: req.user.corporateId,
          userAccessService,
        },
        portalUrl: baseUrl,
        partnerData,
        partnerId: req.user.registeredBy || null,
      });
      if (!linkedUser) {
        return next(new ErrorResponse("Something went wrong while linking the employee profile.", 500));
      }
      return res.status(200).json({
        status: true,
        message: "Employee access enabled. Use 'Switch to Employee' to access the ESS portal.",
        data: linkedUser,
        responseCode: "000",
      });
    }

    const outcome = await resolveInviteTarget({
      email,
      mobileNo,
      inviterCorporateUserId: req.user.corporateId,
      inviterCredentialId: req.user.id,
      inviterRegisteredBy: req.user.registeredBy,
      wants: WANTS.ESS,
    });
    if (outcome.action === ACTION.REJECT) {
      return next(new ErrorResponse(outcome.message, 400));
    }

    const userData = {
      name,
      email,
      mobileNo,
      employeeId,
      corporateUserId: req.user.corporateId,
      userAccessService,
    };

    if (outcome.action === ACTION.LINK) {
      // An adopted row already has a User identity (e.g. invited via Corporate Cards first) — merge the
      // Payroll grant onto it, the same way createCardMember adopts an existing ESS identity, instead of
      // linkEmployeeIdentity's User.create(...), which would duplicate the row for this credential.
      if (outcome.adopt) {
        const granted = await grantEmployeeService({
          credentialId: outcome.credentialId,
          existingUserId: outcome.existingRow?.id,
          corporateUserId: req.user.corporateId,
          serviceLabel: EMPLOYEE_SERVICE.PAYROLL,
          status: MEMBERSHIP_STATUS.ACTIVE,
        });
        if (!granted.ok) {
          return next(new ErrorResponse(granted.message, 400));
        }
        // deactivateUserByEmployeeId and other Payroll lookups key off this column, which an
        // identity created by another service never had a reason to set.
        await updateUserById(granted.userId, { employeeId });
        return res.status(200).json({
          status: true,
          message: "ESS access added to this employee's existing login.",
          data: { userId: String(granted.userId) },
          responseCode: "000",
        });
      }

      const partnerData = await fetchPartnerDetails(req.user.registeredBy);
      const linkedUser = await linkEmployeeIdentity({
        credentialId: outcome.credentialId,
        userData,
        portalUrl: baseUrl,
        partnerData,
      });
      if (!linkedUser) {
        return next(new ErrorResponse("Something went wrong while linking the employee profile.", 500));
      }
      return res.status(200).json({
        status: true,
        message: "ESS access added to this employee's existing login.",
        data: linkedUser,
        responseCode: "000",
      });
    }

    const partnerData = await fetchPartnerDetails(req.user.registeredBy);
    const params = {
      username: email,
      email,
      name,
      registeredBy: req.user.registeredBy,
      baseUrl,
      partnerData,
    };

    const result = await createUser(params, userData);
    if (!result) {
      return next(new ErrorResponse("Something went wrong while sending the ESS invite.", 500));
    }

    return res.status(200).json({
      status: true,
      message: "ESS invite sent successfully.",
      data: result,
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong while sending the ESS invite.",
      data: {},
      responseCode: "001",
    });
  }
});

// Updates the login email for an already-invited ESS employee (e.g. fixing a
// typo after the invite was sent).
exports.updateEssEmail = asyncHandler(async (req, res, next) => {
  try {
    if (req.user.role !== "CORPORATE") {
      return next(new ErrorResponse("Only a corporate account can update an ESS email.", 403));
    }

    const { employeeId } = req.params;
    const { email, baseUrl } = req.body;

    const partnerData = await fetchPartnerDetails(req.user.registeredBy);
    const result = await updateEssEmail({
      employeeId,
      corporateUserId: req.user.corporateId,
      newEmail: email,
      baseUrl,
      partnerData,
      partnerId: req.user.registeredBy || null,
    });

    if (!result.success) {
      return next(new ErrorResponse(result.message || "Something went wrong while updating the work email.", 400));
    }

    return res.status(200).json({
      status: true,
      message: result.passwordAlreadySet
        ? "Work email updated. The employee has been notified of the change."
        : "Work email updated. A new invite has been sent to the updated address.",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong while updating the work email.",
      data: {},
      responseCode: "001",
    });
  }
});

exports.listEssUsers = asyncHandler(async (req, res) => {
  try {
    const users = await listUsersByCorporate(req.user.corporateId);
    return res.status(200).json({
      status: true,
      message: "ESS users fetched successfully",
      data: { users },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.deleteEssUser = asyncHandler(async (req, res) => {
  try {
    const { employeeId } = req.params;
    const result = await deactivateUserByEmployeeId(employeeId, req.user.corporateId);
    if (!result) {
      return res.status(404).json({
        status: false,
        message: "ESS user not found",
        data: {},
        responseCode: "001",
      });
    }
    return res.status(200).json({
      status: true,
      message: "ESS access removed successfully",
      data: {},
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.getEssAccess = asyncHandler(async (req, res) => {
  try {
    const details = await corporateUser.findOne({
      where: { id: req.user.corporateId },
      attributes: ["essAccess"],
    });
    return res.status(200).json({
      status: true,
      message: "ESS access fetched successfully",
      data: { essAccess: details?.essAccess !== false },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});

exports.updateEssAccess = asyncHandler(async (req, res) => {
  try {
    const { essAccess } = req.body;
    await corporateUser.update({ essAccess: !!essAccess }, { where: { id: req.user.corporateId } });
    return res.status(200).json({
      status: true,
      message: "ESS access updated successfully",
      data: { essAccess: !!essAccess },
      responseCode: "000",
    });
  } catch (error) {
    customLog(req?.LogTraceId, "error", { message: error?.message, data: error?.response?.data });
    return res.status(500).json({
      status: false,
      message: "Something went wrong",
      data: {},
      responseCode: "001",
    });
  }
});
