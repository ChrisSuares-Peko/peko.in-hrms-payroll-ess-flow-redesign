/**
 * The credential a session ACTS AS.
 *
 * A sub-corporate login replaces `loginUserDetails` with the parent corporate's credential, so `req.user.id`
 * is the parent's and the member's own arrives separately as `subCorporateCredential`. Every other identity —
 * a corporate owner, an employee — logs in as itself, so `req.user.id` is already theirs.
 *
 * A leaf module on purpose: the privacy-policy gate lives in `utils/jwtToken.js`, which is required by every
 * route in the service, and must not pull the entity graph in behind it.
 *
 * Anything that decides WHO a requirement applies to, and anything that records it as satisfied, has to use
 * this same expression. They diverged once — the gate asked the employee's credential while the pending-policy
 * lookup asked the employer's — and the result was a session told to accept a policy it was never shown, and
 * could not have cleared if it had been.
 */
const actingCredentialId = (user) => user?.subCorporateCredential || user?.id;

module.exports = { actingCredentialId };
