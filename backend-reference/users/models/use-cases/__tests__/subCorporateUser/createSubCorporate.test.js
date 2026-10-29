const { createSubCorporate } = require("../../subCorporateUser");
const credential = require("../../../entities/credential");
const SubCorporateUsers = require("../../../entities/subCorporateUsers");
const sequelize = require("../../../../configs/database/index");
const emailer = require("../../../../utils/emailer");
const emailTemplates = require("../../../../utils/emailTemplate/userManagement");

// Mock the dependencies
jest.mock("../../../entities/credential");
jest.mock("../../../entities/subCorporateUsers");
jest.mock("../../../entities/corporateUser", () => ({
  hasMany: jest.fn(),
}));
jest.mock("../../../../utils/emailer");
jest.mock("../../../../configs/database/index");
jest.mock("../../../../utils/emailTemplate/userManagement", () => ({
  createPassword: jest.fn(),
}));

// Mock environment variables
process.env.NODE_ENV = "test";
process.env.FRONTEND_STAGING_URL = "http://staging.url";
process.env.PRODUCTION_URL = "http://production.url";

describe("createSubCorporate", () => {
  let mockTransaction;
  let mockCommit;
  let mockRollback;

  beforeEach(() => {
    mockCommit = jest.fn();
    mockRollback = jest.fn();
    mockTransaction = { commit: mockCommit, rollback: mockRollback };
  
    // Mock Sequelize transaction
    sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
  
    // Mock models
    const mockCredentialInstance = {
      id: 1,
      username: "testuser",
      getResetPasswordToken: jest.fn().mockReturnValue({
        resetToken: "mockToken",
        resetPasswordToken: "REDACTED",
        resetPasswordExpire: new Date(Date.now() + 3600 * 1000),
      }),
      dataValues: { username: "testuser" },
    };
  
    credential.create = jest.fn().mockResolvedValue(mockCredentialInstance);
    SubCorporateUsers.create = jest.fn().mockResolvedValue({
      dataValues: {
        username: "testuser",
        name: "testuser",
        email: "test@example.com",
        services: [
          { label: "Gift Cards", hasAccess: true },
          { label: "License Renewal", hasAccess: true },
        ],
      },
    });
    credential.update = jest.fn().mockResolvedValue([1]);
  
    // Mock emailTemplates.createPassword to return specific values based on input
    emailTemplates.createPassword.mockImplementation(() => {
        return `Email body`;
      });
  
    emailer.email = jest.fn();
  });
  

  afterEach(() => {
    jest.resetAllMocks();
  });

  it("should create a sub-corporate user successfully", async () => {
    const params = { email: "test@example.com", username: "testuser" };
    const userData = { name: "Test User", corporateEmail: "corp@example.com" };
  
    const result = await createSubCorporate(params, userData,{"branding": "Peko", "logo": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FPeko.png?alt=media&token=b46bed93-9cf9-493b-8c9c-a69ff0fedd09", "signUpImage": "https://firebasestorage.googleapis.com/v0/b/peko-storage.appspot.com/o/staging%2Fcommon%2FImages%2FsignUpImage.png?alt=media&token=eb34687f-4d72-4b60-8b8e-dce18e8f2340"});
  
    expect(result).toHaveProperty("dataValues");
    expect(result.dataValues).toEqual({
        username: "testuser",
        name: "testuser",
        email: "test@example.com",
        services: [
          { label: "Gift Cards", hasAccess: true },
          { label: "License Renewal", hasAccess: true },
        ],
      });
  
    expect(credential.create).toHaveBeenCalledWith(params, {
      transaction: mockTransaction,
    });
    expect(SubCorporateUsers.create).toHaveBeenCalledWith(
      { ...userData, credentialId: 1 },
      { transaction: mockTransaction }
    );
  
    expect(credential.update).toHaveBeenCalledWith(
      {
        passwordResetToken: "mockHashedToken",
        passwordResetExpires: expect.any(Date),
        passwordHistory: { "currentPassword": "", "previousPasswords": [] },
      },
      { where: { id: 1 }, transaction: mockTransaction }
    );
  
    // Check that createPassword was called with correct parameters
    // expect(emailTemplates.createPassword).toHaveBeenCalledWith({
    //   username: "testuser",
    //   name: "testuser",
    //   email: "test@example.com",
    //   corporateEmail: "corp@example.com",
    //   services: [
    //     { label: "Gift Cards", hasAccess: true },
    //     { label: "License Renewal", hasAccess: true },
    //   ],
    // }, resetUrl);
  
    // Check that emailer.email was called with the correct body
    expect(emailer.email).toHaveBeenCalledWith(
        "test@example.com",
        "Welcome to Peko!",
        `Email body`,
        expect.any(Function) // Match any function for the callback
      );
  
    expect(mockCommit).toHaveBeenCalled();
  });
  
  
  

  it("should handle errors and rollback transaction", async () => {
    const params = { email: "test@example.com" };
    const userData = { name: "Test User" };

    // Mock an error
    credential.create.mockRejectedValue(new Error("Creation error"));

    const result = await createSubCorporate(params, userData);

    expect(result).toBe(false);
    expect(mockRollback).toHaveBeenCalled();
  });
});

describe("createSubCorporate — the invite survives its own email", () => {
  let mockTransaction;
  let mockCommit;
  let mockRollback;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCommit = jest.fn();
    mockRollback = jest.fn();
    mockTransaction = { commit: mockCommit, rollback: mockRollback, finished: undefined };

    sequelize.transaction = jest.fn().mockResolvedValue(mockTransaction);
    credential.create = jest.fn().mockResolvedValue({
      id: 1,
      username: "testuser",
      registeredBy: null,
      getResetPasswordToken: jest.fn().mockReturnValue({
        resetPasswordToken: "REDACTED",
        resetPasswordExpire: new Date(),
      }),
      dataValues: { username: "testuser" },
    });
    credential.update = jest.fn().mockResolvedValue([1]);
    SubCorporateUsers.create = jest.fn().mockResolvedValue({ dataValues: { id: 9 } });
    mockCommit.mockImplementation(() => {
      mockTransaction.finished = "commit";
    });
  });

  it("returns the created user when the invite email throws after the commit", async () => {
    emailTemplates.createPassword.mockImplementation(() => {
      throw new TypeError("Cannot read properties of undefined (reading 'length')");
    });

    const result = await createSubCorporate(
      { email: "a@b.com", baseUrl: "https://app.peko.in" },
      { corporateEmail: "owner@peko.in" }
    );

    expect(mockCommit).toHaveBeenCalled();
    expect(mockRollback).not.toHaveBeenCalled();
    expect(result).toEqual({ dataValues: { id: 9 } });
  });

  it("never rolls back a transaction that already committed", async () => {
    emailer.email.mockImplementation(() => {
      throw new Error("SMTP unavailable");
    });

    await createSubCorporate(
      { email: "a@b.com", baseUrl: "https://app.peko.in" },
      { corporateEmail: "owner@peko.in" }
    );

    expect(mockRollback).not.toHaveBeenCalled();
  });

  it("rolls back when the write itself fails, and reports the failure", async () => {
    SubCorporateUsers.create = jest.fn().mockRejectedValue(new Error("duplicate"));

    const result = await createSubCorporate({ email: "a@b.com" }, {});

    expect(mockRollback).toHaveBeenCalled();
    expect(result).toBe(false);
  });
});
