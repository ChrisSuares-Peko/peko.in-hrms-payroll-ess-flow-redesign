const { customLog } = require("../../../../utils/loggerHelper");
const ip_whitelist = require("../../../entities/ip_whitelist");
const { create } = require("../../ip_whitelist");

jest.mock("../../../entities/ip_whitelist")
jest.mock("../../../../utils/loggerHelper", () => ({
    customLog: jest.fn()
}))
describe('create', () => {
    const params ={ 
        ip: '127.0.0.1', 
        status: true
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should create new ip_whitelist and return it', async () => {
        const mockData = {
            ...params, 
            id: 1, 
            createdAt: new Date()
        }
        ip_whitelist.create.mockResolvedValue(mockData);
  
        const result = await create(params);
  
        expect(ip_whitelist.create).toHaveBeenCalledWith(params);
  
        expect(result).toEqual(mockData);
    });

    it('should throw error if ip_whitelist creation failes', async () => {
        const mockError = new Error("Database Error")
        ip_whitelist.create.mockRejectedValue(mockError);
  
        const result = await create(params);
  
        expect(ip_whitelist.create).toHaveBeenCalledWith(params);
        expect(customLog).toHaveBeenCalledWith(null,'error',{error: "Database Error"})
  
        await expect(result).toEqual();
    });
})