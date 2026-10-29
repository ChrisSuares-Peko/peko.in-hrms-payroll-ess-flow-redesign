const ip_whitelist = require("../../../entities/ip_whitelist");
const { update } = require("../../ip_whitelist");

jest.mock("../../../entities/ip_whitelist")
jest.mock("../../../../utils/loggerHelper", () => ({
    customLog: jest.fn()
}))
describe('update', () => {
    const params ={ 
        id: 1, 
    };

    const data = { 
        ip: '127.0.0.1', 
        status: true
    }

    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should apply correct default parameters and return data', async () => {
        const mockData = [1]
        ip_whitelist.update.mockResolvedValue(mockData);
  
        const result = await update(params, data);
  
        expect(ip_whitelist.update).toHaveBeenCalledWith(data, {
            where: {
              id: params.id,
            },
          });
  
      expect(result).toEqual(mockData);
    });

    it('should throw error if the update method fails', async () => {
        const mockError = new Error("Database Error")
        ip_whitelist.update.mockRejectedValue(mockError);
  
        const result = await update(params, data);
  
        expect(ip_whitelist.update).toHaveBeenCalledWith(data, {
            where: {
              id: params.id,
            },
          });
  
        await expect(result).toEqual();
    });
})