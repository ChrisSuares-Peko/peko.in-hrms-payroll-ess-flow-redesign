const sequelizeConfig = require("../../../../configs/database/index");
const { findClonePartnerFrom } = require("../../../use-cases/systemUser");

describe("findClonePartnerFrom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should return a list of partners when query executes successfully", async () => {
    const mockPartners = [
      { id: 1, name: "John Doe", permissions: '{"access": "read"}' },
      { id: 2, name: "Jane Smith", permissions: '{"access": "write"}' },
    ];

    sequelizeConfig.query.mockResolvedValue(mockPartners);

    const result = await findClonePartnerFrom();

    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      `SELECT  
        credentials.id,
        credentials.name, 
        partnerPermissions.permissions FROM partnerPermissions
        inner join credentials on credentials.id = partnerPermissions.registeredBy;`,
      { type: sequelizeConfig.QueryTypes.SELECT }
    );

    expect(result).toEqual(mockPartners);
  });

  it("should return an empty array if no partners are found", async () => {
    sequelizeConfig.query.mockResolvedValue([]);

    const result = await findClonePartnerFrom();

    expect(sequelizeConfig.query).toHaveBeenCalledWith(
      `SELECT  
        credentials.id,
        credentials.name, 
        partnerPermissions.permissions FROM partnerPermissions
        inner join credentials on credentials.id = partnerPermissions.registeredBy;`,
      { type: sequelizeConfig.QueryTypes.SELECT }
    );

    expect(result).toEqual([]);
  });

 
});
