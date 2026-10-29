"use strict";

const RFQ = require("../../../../entities/RFQ");
const { findRfqWithLineItems } = require("../../../procure/proposal");

jest.mock("../../../../entities/RFQ", () => ({ findOne: jest.fn() }));
jest.mock("../../../../entities/RFQLineItem", () => ({}));
jest.mock("../../../../entities/RFQVendorInvite", () => ({}));
jest.mock("../../../../entities/ProcureVendor", () => ({}));
jest.mock("../../../../entities/Proposal", () => ({}));
jest.mock("../../../../entities/ProposalLineItem", () => ({}));
jest.mock("../../../../../configs/database/index", () => ({
  transaction: jest.fn(),
}));

describe("findRfqWithLineItems", () => {
  beforeEach(() => jest.clearAllMocks());

  it("should return RFQ with line items when found", async () => {
    const mockRfq = {
      id: 1,
      corporateUserId: 10,
      lineItems: [{ id: 1, description: "Laptop", qty: 5 }],
    };
    RFQ.findOne.mockResolvedValue(mockRfq);

    const result = await findRfqWithLineItems({
      rfqId: 1,
      corporateUserId: 10,
    });

    expect(RFQ.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 1, corporateUserId: 10 } }),
    );
    expect(result).toEqual(mockRfq);
    expect(result.lineItems).toHaveLength(1);
  });

  it("should return null when RFQ not found", async () => {
    RFQ.findOne.mockResolvedValue(null);

    const result = await findRfqWithLineItems({
      rfqId: 99,
      corporateUserId: 10,
    });

    expect(result).toBeNull();
  });

  it("should throw when query rejects", async () => {
    RFQ.findOne.mockRejectedValue(new Error("DB error"));

    await expect(
      findRfqWithLineItems({ rfqId: 1, corporateUserId: 10 }),
    ).rejects.toThrow("DB error");
  });
});
