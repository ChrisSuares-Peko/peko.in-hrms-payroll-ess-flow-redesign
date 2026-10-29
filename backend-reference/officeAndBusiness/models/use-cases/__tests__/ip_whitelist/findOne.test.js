const ip_whitelist = require("../../../entities/ip_whitelist");
const { findOne } = require("../../ip_whitelist");

jest.mock("../../../entities/ip_whitelist")
jest.mock("../../../../utils/loggerHelper", () => ({
    customLog: jest.fn()
}))
describe('findOne', () => {
    const params ={ 
        ip:  '127.0.0.1'
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should apply correct default parameters and return data', async () => {
        const mockData = { 
            ip: '127.0.0.1', 
            id: 1, 
            status: true
        }
        ip_whitelist.findOne.mockResolvedValue(mockData);
  
        const result = await findOne(params);
  
        expect(ip_whitelist.findOne).toHaveBeenCalledWith({
            where: {
                ip: params.ip,
            },
            raw: true
        });
  
        expect(result).toEqual(mockData);
    });

    it('should return null if no row was found', async () => {
        const mockData = null
        ip_whitelist.findOne.mockResolvedValue(mockData);
  
        const result = await findOne(params);
  
        expect(ip_whitelist.findOne).toHaveBeenCalledWith({
            where: {
                ip: params.ip,
            },
            raw: true
        });
  
        expect(result).toEqual(mockData);
    });

    it('should throw error if the findOne method fails', async () => {
        const mockError = new Error("Database Error")
        ip_whitelist.findOne.mockRejectedValue(mockError);
  
        const result = await findOne(params);
  
        expect(ip_whitelist.findOne).toHaveBeenCalledWith({
            where: {
                ip: params.ip,
            },
            raw: true
        });
  
        await expect(result).toEqual();
    });
})