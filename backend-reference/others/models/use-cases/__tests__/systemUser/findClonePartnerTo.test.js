const sequelizeConfig = require("../../../../configs/database/index");
const { findClonePartnerTo } = require("../../../use-cases/systemUser");



describe("findClonePartnerTo", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of users when query executes successfully", async () => {
    const mockUsers = [
      { id: 1, name: "John Doe" },
      { id: 2, name: "Jane Smith" },
    ];

    sequelizeConfig.query.mockResolvedValue(mockUsers);

    const result = await findClonePartnerTo();

    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      `SELECT 
     credentials.name,
     credentials.id
        FROM
            systemUsers
        INNER JOIN
            roleAndPermissions ON roleAndPermissions.id = systemUsers.roleAndPermissionId
        LEFT JOIN 
        credentials ON credentials.id = systemUsers.credentialId 
        LEFT JOIN 
        packages ON packages.partnerId = credentials.id   
        WHERE
            roleAndPermissions.roleName = 'partner' 
            AND packages.partnerId IS NULL`,
      { type: sequelizeConfig.QueryTypes.SELECT }
    );

    expect(result).toEqual(mockUsers);
  });

  it("should return an empty array if no users are found", async () => {
    sequelizeConfig.query.mockResolvedValue([]);

    const result = await findClonePartnerTo();

    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      expect.any(String),
      { type: sequelizeConfig.QueryTypes.SELECT }
    );

    expect(result).toEqual([]);
  });

  it("should throw an error if query execution fails", async () => {
    const errorMessage = new Error("Database error");
    sequelizeConfig.query.mockRejectedValue(errorMessage);

    await expect(findClonePartnerTo()).rejects.toThrow("Database error");

    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      expect.any(String),
      { type: sequelizeConfig.QueryTypes.SELECT }
    );
  });
});
