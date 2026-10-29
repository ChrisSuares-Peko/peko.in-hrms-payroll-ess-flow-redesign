const ip_whitelist = require("../../../entities/ip_whitelist");
const { deleteIP } = require("../../ip_whitelist");

jest.mock("../../../entities/ip_whitelist")
jest.mock("../../../../utils/loggerHelper", () => ({
    customLog: jest.fn()
}))
describe('deleteIP', () => {
    const params ={ 
        id: 1, 
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    it('should delete ip_whitelist and return true', async () => {
        const mockData = 1
        const mockDataFindOne = { 
            ip: '127.0.0.1', 
            id: 1, 
            status: true
        }
        ip_whitelist.destroy.mockResolvedValue(mockData);
        ip_whitelist.findOne.mockResolvedValue(mockDataFindOne);
  
        const result = await deleteIP(params);
  
        expect(ip_whitelist.findOne).toHaveBeenCalledWith({where: {id: params.id}});
        expect(ip_whitelist.destroy).toHaveBeenCalledWith({
            where: {
                id: params.id
            }
        });
  
        expect(result).toEqual(true);
    });

    it('should throw error if findOne fails', async () => {
        const mockError = new Error("Database Error")
        ip_whitelist.findOne.mockRejectedValue(mockError);
  
        const result = deleteIP(params);
  
        expect(ip_whitelist.findOne).toHaveBeenCalledWith({where: {id: params.id}});
  
        await expect(result).rejects.toThrow(mockError);
    });

    it('should throw error if ip_whitelist doesnt exist', async () => {
        const mockDataFindOne = null
        ip_whitelist.findOne.mockResolvedValue(mockDataFindOne);
  
        const result = deleteIP(params);
  
        expect(ip_whitelist.findOne).toHaveBeenCalledWith({where: {id: params.id}});  
        await expect(result).rejects.toThrow(new Error('Invoice customer not found'))
    });

    it('should throw error if destory method fails', async () => {
        const mockError = new Error("Database Error")
        const mockDataFindOne = { 
            ip: '127.0.0.1', 
            id: 1, 
            status: true
        }
        ip_whitelist.destroy.mockRejectedValue(mockError);
        ip_whitelist.findOne.mockResolvedValue(mockDataFindOne);
  
        const result = deleteIP(params);
  
        expect(ip_whitelist.findOne).toHaveBeenCalledWith({where: {id: params.id}});
        await expect(result).rejects.toThrow(mockError);
    });
})