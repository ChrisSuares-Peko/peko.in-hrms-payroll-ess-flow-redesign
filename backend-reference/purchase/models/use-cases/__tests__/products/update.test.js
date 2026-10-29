const product = require("../../../entities/products");
const photos = require("../../../entities/photos");
const { uploadFile } = require("../../../../utils/commonUploadFile");
const { update } = require("../../products");

jest.mock("../../../entities/products", () => ({
  update: jest.fn(),
}));

jest.mock("../../../entities/photos", () => ({
  update: jest.fn(),
  create: jest.fn(),
}));

jest.mock("../../../../utils/commonUploadFile", () => ({
  uploadFile: jest.fn(),
}));

describe("update product", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should update product without images", async () => {
    const mockParams = { id: 1 };
    const mockData = { name: "Updated Product" };

    product.update.mockResolvedValue([1]); // Simulates 1 row updated

    const result = await update(mockParams, mockData);

    expect(product.update).toHaveBeenCalledWith(mockData, {
      where: { id: mockParams.id },
    });
    expect(uploadFile).not.toHaveBeenCalled();
    expect(photos.update).not.toHaveBeenCalled();
    expect(result).toEqual([1]); // Sequelize update returns an array [count]
  });

  it("should update product with a single image", async () => {
    const mockParams = { id: 1 };
    const mockData = {
      name: "Updated Product",
      productImage1: "image-data-1",
      productImageFormat1: "jpg",
    };
    const mockPublicUrl = "https://mock.url/image1.jpg";

    uploadFile.mockResolvedValue(mockPublicUrl);
    photos.update.mockResolvedValue([1]);
    product.update.mockResolvedValue([1]);

    const result = await update(mockParams, mockData);

    expect(uploadFile).toHaveBeenCalledWith(mockData.productImage1, "productImage1", mockData.productImageFormat1);
    expect(photos.update).toHaveBeenCalledWith(
      { productImageUrl: mockPublicUrl },
      { where: { productId: mockParams.id, imageField: "productImage1" } }
    );
    expect(product.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
    expect(result).toEqual([1]);
  });

  it("should create a new photo entry if update fails", async () => {
    const mockParams = { id: 1 };
    const mockData = {
      productImage2: "image-data-2",
      productImageFormat2: "png",
    };
    const mockPublicUrl = "https://mock.url/image2.png";

    uploadFile.mockResolvedValue(mockPublicUrl);
    photos.update.mockResolvedValue([0]); // Simulate update failure
    photos.create.mockResolvedValue(true);
    product.update.mockResolvedValue([1]);

    const result = await update(mockParams, mockData);

    expect(uploadFile).toHaveBeenCalledWith(mockData.productImage2, "productImage2", mockData.productImageFormat2);
    expect(photos.update).toHaveBeenCalledWith(
      { productImageUrl: mockPublicUrl },
      { where: { productId: mockParams.id, imageField: "productImage2" } }
    );
    expect(photos.create).toHaveBeenCalledWith({
      productId: mockParams.id,
      imageField: "productImage2",
      productImageUrl: mockPublicUrl,
    });
    expect(product.update).toHaveBeenCalledWith(mockData, { where: { id: mockParams.id } });
    expect(result).toEqual([1]);
  });

  it("should handle failure in image upload gracefully", async () => {
    const mockParams = { id: 1 };
    const mockData = {
      productImage3: "image-data-3",
      productImageFormat3: "jpeg",
    };

    uploadFile.mockRejectedValue(new Error("Upload failed"));
    product.update.mockResolvedValue([1]);

    await expect(update(mockParams, mockData)).rejects.toThrow("Upload failed");

    expect(uploadFile).toHaveBeenCalledWith(mockData.productImage3, "productImage3", mockData.productImageFormat3);
    expect(photos.update).not.toHaveBeenCalled();
    expect(product.update).not.toHaveBeenCalled();
  });
});
