const asyncHandler = require("../../middlewares/async");
const User = require("../entities/user");
const credential = require("../entities/credential");
const sequelize = require("../../configs/database/index");
const { setPasswordUrlTemplate } = require("../../utils/emailTemplate/password");
const { welcomeEssPortal, essEmailChangedTemplate, buildEssActionHtml } = require("../../utils/emailTemplate/essWelcome");
const emailer = require("../../utils/emailer");
const { customLog } = require("../../utils/loggerHelper");
const subCorporateEmailTemplates = require("../../utils/emailTemplate/userManagement");
const { partnerLogos } = require("../../utils/partnerLogos");
const { fetchPartnerDetails } = require("./systemUser");
const { resolveEmailTemplate } = require("../../services/emailTemplateResolver");
const { EMAIL_TEMPLATE_KEYS } = require("../../utils/emailTemplateKeys");
const { v2LayoutVariables, PEKO_SOCIAL_LINKS } = require("../../utils/emailTemplate/sharedLayout");

// The ESS welcome email, from the admin-managed template when one is published and from
// welcomeEssPortal otherwise. Two callers reach this in this file — createUser (new
// account, resetUrl set) and linkSelfAsEmployee (existing credential, resetUrl null) —
// each with its own subject.
const sendEssWelcomeEmail = async ({ to, employee, portalUrl, resetUrl, partnerData, partnerId = null, fallbackSubject, logTraceId = null }) => {
  const hasReset = !!resetUrl;
  const { subject, html, sender } = await resolveEmailTemplate({
    key: EMAIL_TEMPLATE_KEYS.ESS_WELCOME,
    partnerId,
    variables: {
      employeeName: employee?.name || 'Employee',
      branding: partnerData?.branding || 'Peko',
      actionHtml: buildEssActionHtml({ hasReset, portalUrl, resetUrl }),
      ...v2LayoutVariables({
        website: partnerData?.baseUrl || 'https://in.peko.one',
        logo: partnerData?.logo,
        branding: partnerData?.branding || 'Peko',
        socials: PEKO_SOCIAL_LINKS,
      }),
    },
    fallbackSubject,
    fallback: () => welcomeEssPortal(employee, portalUrl, resetUrl, partnerData),
    logTraceId,
  });

  emailer.email(to, subject, html, function () {
    console.log("ESS welcome email sent to " + to);
  }, sender);
};

exports.findOneByCredentialId = asyncHandler(async (credentialId, attributes = undefined) => {
  return await User.findOne({
    where: { credentialId },
    attributes,
  });
});

exports.findUserAccountByEmail = asyncHandler(async (email) => {
  return await User.findOne({
    where: { email },
    include: [
      {
        model: credential,
        attributes: ["id", "password"],
      },
    ],
  });
});

exports.findUserAccountById = asyncHandler(async (id) => {
  return await User.findOne({
    where: { id },
    include: [
      {
        model: credential,
        attributes: ["id", "password"],
      },
    ],
  });
});

exports.updateUserById = asyncHandler(async (id, fields) => {
  const [updated] = await User.update(fields, { where: { id } });
  return updated > 0;
});

exports.listUsersByCorporate = asyncHandler(async (corporateUserId) => {
  return await User.findAll({
    where: { corporateUserId, isActive: true },
    include: [
      {
        model: credential,
        attributes: ["username"],
      },
    ],
    order: [["createdAt", "DESC"]],
    raw: true,
    nest: true,
  });
});

exports.deactivateUserByEmployeeId = asyncHandler(async (employeeId, corporateUserId) => {
  const [affectedRows] = await User.update(
    { isActive: false },
    { where: { employeeId, corporateUserId } }
  );
  return affectedRows > 0;
});

// Regenerates the set-password token/email for an account that has no password yet.
exports.resendUserPasswordEmail = asyncHandler(async (existingUser, baseUrl) => {
  const details = await credential.findOne({ where: { id: existingUser.credentialId } });
  if (!details) return false;

  const resetToken = details.getResetPasswordToken(4320);
  await credential.update(
    {
      passwordResetToken: resetToken.resetPasswordToken,
      passwordResetExpires: resetToken.resetPasswordExpire,
      passwordHistory: { currentPassword: "", previousPasswords: [] },
    },
    { where: { id: details.id } }
  );

  const resetUrl = baseUrl + "/reset-password?token=" + resetToken.resetPasswordToken + "&username=" + details.username + "&isForgot=false";

  // Best-effort: a failure sending the email should not fail the resend itself —
  // the token has already been regenerated and persisted above.
  try {
    const body = setPasswordUrlTemplate(
      { ...existingUser.dataValues, name: existingUser.name },
      resetUrl,
      "You have been invited to join the Employee Self-Service (ESS) Portal. We are excited to have you on board."
    );
    emailer.email(existingUser.email, "Welcome to the Employee Self-Service (ESS) Portal", body, function () {
      console.log("Invite email resent to " + existingUser.email);
    });
  } catch (error) {
    customLog(null, "error", { message: "Failed to send ESS resend-invite email", error: error?.message });
  }

  return true;
});

exports.createUser = asyncHandler(async (params, userData) => {
  const transaction = await sequelize.transaction();
  params.role = "USER";

  try {
    const details = await credential.create(params, { transaction });

    userData = {
      ...userData,
      credentialId: details.id,
    };
    const user = await User.create(userData, { transaction });

    const resetToken = details.getResetPasswordToken(4320);
    await credential.update(
      {
        passwordResetToken: resetToken.resetPasswordToken,
        passwordResetExpires: resetToken.resetPasswordExpire,
        passwordHistory: { currentPassword: "", previousPasswords: [] },
      },
      { where: { id: details.id }, transaction }
    );

    await transaction.commit();

    // Best-effort: the invite (credential + user rows) is already committed above,
    // so a failure building/sending the email must not fail the invite or attempt
    // to roll back an already-committed transaction.
    try {
      const baseUrl = params?.baseUrl;
      const resetUrl = baseUrl + "/reset-password?token=" + resetToken.resetPasswordToken + "&username=" + details.dataValues.username + "&isForgot=false";
      await sendEssWelcomeEmail({
        to: params.email,
        employee: { ...user.dataValues, name: params.name },
        portalUrl: baseUrl,
        resetUrl,
        partnerData: params?.partnerData,
        partnerId: params?.registeredBy || null,
        fallbackSubject: "Welcome to the Employee Self-Service (ESS) Portal",
      });
    } catch (emailError) {
      customLog(null, "error", { message: "Failed to send ESS invite email", error: emailError?.message });
    }

    return user;
  } catch (error) {
    console.log(error, "createUser error");
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return false;
  }
});

// Grants ESS access on an existing credential — the corporate adding themselves, or a
// corporate-cards member being invited to the portal. Reuses the credential instead of
// creating a second login, and tags it with the linked employee identity.
const linkEmployeeIdentity = asyncHandler(async ({ credentialId, userData, portalUrl, partnerData, partnerId = null }) => {
  const transaction = await sequelize.transaction();
  try {
    const newUser = await User.create(
      { ...userData, credentialId },
      { transaction }
    );

    const cred = await credential.findByPk(credentialId, { transaction });
    const subRoles = Array.isArray(cred?.subRoles) ? cred.subRoles : [];
    const alreadyLinked = subRoles.some(
      (r) => r?.type === "employee" && r?.userId === newUser.id
    );
    if (!alreadyLinked) {
      subRoles.push({ type: "employee", userId: newUser.id, enabled: true });
      await credential.update(
        { subRoles },
        { where: { id: credentialId }, transaction }
      );
    }

    await transaction.commit();

    // Best-effort welcome notice — no set-password link (resetUrl null), since
    // they reuse their existing login credentials.
    try {
      await sendEssWelcomeEmail({
        to: userData.email,
        employee: userData,
        portalUrl,
        resetUrl: null,
        partnerData,
        partnerId,
        fallbackSubject: "Welcome to the Employee Self-Service (ESS) Portal",
      });
    } catch (emailError) {
      customLog(null, "error", { message: "Failed to send linked-employee ESS notice", error: emailError?.message, partnerId });
    }

    return newUser;
  } catch (error) {
    customLog(null, "error", { message: error?.message, errorLocation: "linkEmployeeIdentity useCase" });
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return false;
  }
});

exports.linkEmployeeIdentity = linkEmployeeIdentity;
exports.linkSelfAsEmployee = linkEmployeeIdentity;

// Updates the login email for an already-invited ESS employee (e.g. HR fixed a
// typo). If the employee hasn't set a password yet, this regenerates the reset
// token and resends the set-password invite to the new address — which also
// invalidates the old invite link, since the old token is overwritten on the
// same credential row. If a password is already set, it's left untouched and
// both the old and new address are notified of the change instead.
exports.updateEssEmail = asyncHandler(async ({ employeeId, corporateUserId, newEmail, baseUrl, partnerData, partnerId = null }) => {
  const transaction = await sequelize.transaction();
  try {
    const user = await User.findOne({ where: { employeeId, corporateUserId }, transaction });
    if (!user) {
      await transaction.rollback();
      return { success: false, message: "ESS account not found for this employee." };
    }

    const oldEmail = user.email;
    if (oldEmail === newEmail) {
      await transaction.rollback();
      return { success: false, message: "This is already the employee's current work email." };
    }

    const duplicate = await credential.findOne({ where: { email: newEmail }, transaction });
    if (duplicate && duplicate.id !== user.credentialId) {
      await transaction.rollback();
      return { success: false, message: "The email address is already associated with another account." };
    }

    const cred = await credential.findByPk(user.credentialId, { transaction });
    if (!cred) {
      await transaction.rollback();
      return { success: false, message: "ESS account not found for this employee." };
    }

    await credential.update(
      { email: newEmail, username: newEmail },
      { where: { id: cred.id }, transaction }
    );
    await User.update({ email: newEmail }, { where: { id: user.id }, transaction });

    const passwordAlreadySet = !!cred.password;
    let resetUrl = null;
    if (!passwordAlreadySet) {
      const resetToken = cred.getResetPasswordToken(4320);
      await credential.update(
        {
          passwordResetToken: resetToken.resetPasswordToken,
          passwordResetExpires: resetToken.resetPasswordExpire,
          passwordHistory: { currentPassword: "", previousPasswords: [] },
        },
        { where: { id: cred.id }, transaction }
      );
      resetUrl = baseUrl + "/reset-password?token=" + resetToken.resetPasswordToken + "&username=" + newEmail + "&isForgot=false";
    }

    await transaction.commit();

    try {
      if (!passwordAlreadySet) {
        await sendEssWelcomeEmail({
          to: newEmail,
          employee: { name: user.name },
          portalUrl: baseUrl,
          resetUrl,
          partnerData,
          partnerId,
          fallbackSubject: "Welcome to the Employee Self-Service (ESS) Portal",
        });
      } else {
        const { subject, html, sender } = await resolveEmailTemplate({
          key: EMAIL_TEMPLATE_KEYS.ESS_EMAIL_CHANGED,
          partnerId,
          variables: {
            employeeName: user.name || 'Employee',
            oldEmail,
            newEmail,
            branding: partnerData?.branding || 'Peko',
            ...v2LayoutVariables({
              website: partnerData?.baseUrl || 'https://in.peko.one',
              logo: partnerData?.logo,
              branding: partnerData?.branding || 'Peko',
              socials: PEKO_SOCIAL_LINKS,
            }),
          },
          fallbackSubject: "Your ESS login email was changed",
          fallback: () => essEmailChangedTemplate({ name: user.name }, oldEmail, newEmail, partnerData),
        });
        emailer.email(oldEmail, subject, html, function () {}, sender);
        emailer.email(newEmail, subject, html, function () {}, sender);
      }
    } catch (emailError) {
      customLog(null, "error", { message: "Failed to send ESS email-change notice", error: emailError?.message });
    }

    return { success: true, passwordAlreadySet };
  } catch (error) {
    customLog(null, "error", { message: error?.message, errorLocation: "updateEssEmail useCase" });
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return { success: false, message: "Something went wrong while updating the work email." };
  }
});

/**
 * Invites a corporate-cards member as an ESS-keyed employee.
 *
 * Creates ONE credential with role USER and a `users` row carrying the card role — and no subCorporateUsers
 * row, because for a cards-only member the employee row IS the cardholder identity. Without this the invite
 * path would keep writing into the space the conversion is draining, and the migration would never converge.
 *
 * Sends the same generic create-password invite the sub-corporate path sends, not the ESS portal welcome:
 * this person is being invited to Corporate Cards, not to Payroll.
 */
exports.createEmployeeIdentity = asyncHandler(async (params, userData) => {
  const transaction = await sequelize.transaction();
  params.role = "USER";

  try {
    const details = await credential.create(params, { transaction });
    const user = await User.create({ ...userData, credentialId: details.id }, { transaction });

    const resetToken = details.getResetPasswordToken(4320);
    await credential.update(
      {
        passwordResetToken: resetToken.resetPasswordToken,
        passwordResetExpires: resetToken.resetPasswordExpire,
        passwordHistory: { currentPassword: "", previousPasswords: [] },
      },
      { where: { id: details.id }, transaction }
    );

    await transaction.commit();

    // Best-effort: the invite is already committed, so a mail failure must not fail it or roll back.
    try {
      const resetUrl = params.baseUrl + "/reset-password?token=" + resetToken.resetPasswordToken + "&username=" + details.dataValues.username + "&isForgot=false";
      const partnerData = details?.registeredBy
        ? await fetchPartnerDetails(details.registeredBy)
        : await partnerLogos();
      const body = subCorporateEmailTemplates.createPassword(
        { ...user.dataValues, username: details.username, corporateEmail: params.corporateEmail },
        resetUrl,
        partnerData
      );
      emailer.email(params.email, "Welcome to Peko!", body, function () {
        console.log("Card member invite sent to " + params.email);
      });
    } catch (emailError) {
      customLog(null, "error", { message: "Failed to send card member invite email", error: emailError?.message });
    }

    return user;
  } catch (error) {
    customLog(null, "error", { message: error?.message, errorLocation: "createEmployeeIdentity useCase" });
    if (!transaction.finished) {
      await transaction.rollback();
    }
    return false;
  }
});
