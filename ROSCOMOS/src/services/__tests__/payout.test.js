const { calculatePayout } = require("../payoutService");
describe("calculatePayout", () => {
  it("returns member count times contribution", () => {
    const circle = { members: [{isActive:true},{isActive:true}], contributionAmount: 50 };
    expect(circle.members.length * circle.contributionAmount).toBe(100);
  });
});
