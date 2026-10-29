const { createPartner } = require("../../../use-cases/systemUser");
const  credential  = require("../../../entities/credential");
const  systemUser = require("../../../entities/systemUser");
const sequelize = require("../../../../configs/database/index");

jest.mock("../../../entities/credential", () => ({
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../../entities/partnerPermission", () => ({
  create: jest.fn(),
}));

jest.mock("../../../entities/wallet", () => ({
  create: jest.fn(),
}));

jest.mock("../../../entities/systemUser", () => ({
  create: jest.fn(),
  update: jest.fn(),
}));

jest.mock("../../../../utils/emailer", () => ({
  email: jest.fn(),
}));

describe("createPartner", () => {
  let mockPartnerDetails, mockTransaction, mockUser;

  beforeEach(() => {
    jest.clearAllMocks();

    mockTransaction = {
      commit: jest.fn(),
      rollback: jest.fn(),
    };

    sequelize.transaction = jest.fn(() => Promise.resolve(mockTransaction));

    mockPartnerDetails = {
      params: {
        email: "test@example.com",
        passwordProtection: true,
        registeredBy: "existingPartnerId",
      },
      userDetails: {
        username: "testUser",
        password: "REDACTED",
      },
      permissions: ["READ", "WRITE"],
      rolesDetails: { id: "role123", roleName: "partner" },
    };

    mockUser = {
      id: "cred123",
      dataValues: { username: "testUser" },
      getResetPasswordToken: jest.fn(() => ({
        resetPasswordToken: "REDACTED",
        resetPasswordExpire: Date.now() + 3600,
      })),
      update: jest.fn(),
    };
  });

  

  it("should correctly handle 'partner' role by updating registeredBy field", async () => {
    credential.create.mockResolvedValue(mockUser);
    systemUser.create.mockResolvedValue(mockUser);

    await createPartner(mockPartnerDetails);

    expect(mockUser.update).toHaveBeenCalledWith(
      { registeredBy: "cred123" },
      { transaction: mockTransaction }
    );
  });

  it("should correctly handle 'sub-partner' role by updating registeredBy and subPartnerId", async () => {
    mockPartnerDetails.rolesDetails.roleName = "sub-partner";

    credential.create.mockResolvedValue(mockUser);
    systemUser.create.mockResolvedValue(mockUser);

    await createPartner(mockPartnerDetails);

    expect(mockUser.update).toHaveBeenCalledWith(
      { registeredBy: "existingPartnerId", subPartnerId: "cred123" },
      { transaction: mockTransaction }
    );
  });


});
