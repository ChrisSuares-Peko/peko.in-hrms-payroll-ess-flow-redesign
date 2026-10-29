const { getEntityFieldSpec } = require("../../nupayOnboarding");

const fileNames = (entityType) => getEntityFieldSpec(entityType).fileFields.map((f) => f.name);
const textNames = (entityType) => getEntityFieldSpec(entityType).textFields.map((f) => f.name);

describe("getEntityFieldSpec", () => {
  it("always appends the backend-generated miq as the last file field", () => {
    ["individual", "sole_proprietorship", "partnership", "private_limited"].forEach((entity) => {
      const files = fileNames(entity);
      expect(files).toContain("miq");
      expect(files[files.length - 1]).toBe("miq");
    });
  });

  it("uses separate ubo_pan + ubo_aadhar for partnership (not the doc's ubo_adhaar typo)", () => {
    const files = fileNames("partnership");
    expect(files).toContain("ubo_pan");
    expect(files).toContain("ubo_aadhar");
    expect(files).not.toContain("ubo_adhaar");
    expect(files).not.toContain("shareholding"); // shareholding is private_limited only
  });

  it("includes ubo_pan, ubo_aadhar and shareholding for private_limited", () => {
    const files = fileNames("private_limited");
    expect(files).toEqual(expect.arrayContaining(["ubo_pan", "ubo_aadhar", "shareholding"]));
    expect(files).not.toContain("ubo_adhaar");
  });

  it("adds cin as a text field only for private_limited", () => {
    expect(textNames("private_limited")).toContain("cin");
    expect(textNames("partnership")).not.toContain("cin");
  });

  it("returns just the backend miq file for an unknown entity type", () => {
    expect(fileNames("unknown")).toEqual(["miq"]);
  });
});
