const mongoose = require("mongoose");
const Circle   = require("../../models/Circle");
describe("Circle model", () => {
  it("requires circleId field", () => {
    const c = new Circle({ name:"test", numberOfMembers:2, contributionAmount:10, cycleDurationDays:7, creatorAddress:"0x01" });
    const err = c.validateSync();
    expect(err.errors.circleId).toBeDefined();
  });
});
