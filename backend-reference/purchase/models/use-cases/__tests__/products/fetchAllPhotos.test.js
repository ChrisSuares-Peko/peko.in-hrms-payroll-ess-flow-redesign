const photos = require("../../../entities/photos");
const { fetchAllPhotos } = require("../../products");

jest.mock("../../../entities/photos", () => ({
  findAll: jest.fn(),
}));

describe("fetchAllPhotos", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should fetch all photos for a given product ID", async () => {
    const mockProductId = 123;
    const mockPhotos = [
      { id: 1, productId: 123, url: "https://example.com/photo1.jpg" },
      { id: 2, productId: 123, url: "https://example.com/photo2.jpg" },
    ];

    photos.findAll.mockResolvedValue(mockPhotos);

    const result = await fetchAllPhotos(mockProductId);

    expect(photos.findAll).toHaveBeenCalledWith({
      where: { productId: mockProductId },
    });
    expect(result).toEqual(mockPhotos);
  });

  it("should return an empty array if no photos are found", async () => {
    photos.findAll.mockResolvedValue([]);

    const result = await fetchAllPhotos(999);

    expect(photos.findAll).toHaveBeenCalledWith({
      where: { productId: 999 },
    });
    expect(result).toEqual([]);
  });

  it("should handle errors gracefully", async () => {
    photos.findAll.mockRejectedValue(new Error("Database error"));

    await expect(fetchAllPhotos(123)).rejects.toThrow("Database error");
    expect(photos.findAll).toHaveBeenCalled();
  });
});
