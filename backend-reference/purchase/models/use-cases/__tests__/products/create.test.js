const product = require("../../../entities/products");
const sequelize = require("../../../../configs/database/index");
const photos = require("../../../entities/photos");
const { uploadFile } = require("../../../../utils/commonUploadFile");
const { create } = require("../../products");

jest.mock("../../../entities/products", () => ({
  create: jest.fn(),
}));

jest.mock("../../../entities/photos", () => ({
  bulkCreate: jest.fn(),
}));

jest.mock("../../../../utils/commonUploadFile", () => ({
  uploadFile: jest.fn(),
}));


describe("create product", () => {
    const mockTransaction = {
        commit: jest.fn(),
        rollback: jest.fn(),
      };
      jest.spyOn(sequelize, "transaction").mockResolvedValue(mockTransaction);
      
  beforeEach(() => {
    jest.clearAllMocks();
  });


  it("should create a product with images", async () => {
    const mockParams = {
      name: "Test Product",
      productImage1: "image-data-1",
      productImageFormat1: "jpg",
      productImage2: "image-data-2",
      productImageFormat2: "png",
    };
    const mockTransaction = await sequelize.transaction();
    const mockProduct = { id: 1, ...mockParams };
    const mockPublicUrl1 = "https://mock.url/image1.jpg";
    const mockPublicUrl2 = "https://mock.url/image2.png";

    product.create.mockResolvedValue(mockProduct);
    uploadFile.mockResolvedValueOnce(mockPublicUrl1).mockResolvedValueOnce(mockPublicUrl2);

    const result = await create(mockParams);

    expect(uploadFile).toHaveBeenCalledWith(mockParams.productImage1, "productImage1", mockParams.productImageFormat1);
    expect(uploadFile).toHaveBeenCalledWith(mockParams.productImage2, "productImage2", mockParams.productImageFormat2);
    expect(product.create).toHaveBeenCalledWith(mockParams, { transaction: mockTransaction });
    expect(photos.bulkCreate).toHaveBeenCalledWith(
      [
        { productId: mockProduct.id, productImageUrl: mockPublicUrl1, imageField: "productImage1" },
        { productId: mockProduct.id, productImageUrl: mockPublicUrl2, imageField: "productImage2" },
      ],
      { transaction: mockTransaction }
    );
    expect(mockTransaction.commit).toHaveBeenCalled();
    expect(result).toEqual(mockProduct);
  });

  
});
