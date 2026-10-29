const { update } = require('../../../use-cases/softwares_subscriptions');
const softwares_subscriptions = require('../../../entities/softwares_subscriptions');
const { uploadFile } = require('../../../../utils/commonUploadFile');

// Mock the necessary functions and objects
jest.mock('../../../entities/softwares_subscriptions', () => ({
  findOne: jest.fn(),
  update: jest.fn(),
}));
jest.mock('../../../entities/subCorporateUsers', () => ({
  belongsTo: jest.fn(),
}));

jest.mock('../../../../utils/commonUploadFile', () => ({
  uploadFile: jest.fn(),
}));

describe('update function', () => {
  const params = { id: 1 };
  const data = { sold_quantity: 5, image: 'imageData', imageFormat: 'jpg' };
  
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update the software subscription with the correct data when sold_quantity is present and image is uploaded', async () => {
   
    softwares_subscriptions.findOne.mockResolvedValue({ sold_quantity: 3 });

    uploadFile.mockResolvedValue('http://s3bucket.com/image.jpg');

    softwares_subscriptions.update.mockResolvedValue(true);

    const result = await update(params, data);

    expect(softwares_subscriptions.findOne).toHaveBeenCalledWith({ where: { id: params.id } });

    expect(data.image).toBe('http://s3bucket.com/image.jpg');
    
    expect(data.sold_quantity).toBe(8);

    expect(softwares_subscriptions.update).toHaveBeenCalledWith(
        expect.objectContaining({ sold_quantity: 8, image: 'http://s3bucket.com/image.jpg' }),
        { where: { id: params.id } }
    );
    
    expect(result).toBe(true);
});



  it('should update sold_quantity without modifying image if image is not provided', async () => {
    const updateData = { sold_quantity: 5 };

    softwares_subscriptions.findOne.mockResolvedValue({ sold_quantity: 2 });

    softwares_subscriptions.update.mockResolvedValue(true);

    const result = await update(params, updateData);

    expect(softwares_subscriptions.findOne).toHaveBeenCalledWith({ where: { id: params.id } });
    expect(updateData.sold_quantity).toBe(7); 
    expect(softwares_subscriptions.update).toHaveBeenCalledWith(expect.objectContaining({ sold_quantity: 7 }), { where: { id: params.id } });
    expect(result).toBe(true);
  });

  it('should log an error and return false if an error occurs', async () => {
   
    console.log = jest.fn();

    softwares_subscriptions.findOne.mockRejectedValue(new Error('Database error'));

    const result = await update(params, data);

    expect(console.log).toHaveBeenCalledWith('Database error');
    expect(result).toBe(false);
  });
})
