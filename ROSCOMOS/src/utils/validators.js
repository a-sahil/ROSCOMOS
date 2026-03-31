function validateContribution({ circleId, memberAddress, amount }) {
  if (!circleId || typeof circleId !== 'string') throw new Error('Invalid circleId');
  if (!memberAddress || !/^0x[0-9a-fA-F]{16}$/.test(memberAddress))
    throw new Error('Invalid Flow address');
  if (typeof amount !== 'number' || amount <= 0) throw new Error('Amount must be positive');
}

function validateCircleParams({ numberOfMembers, contributionAmount, cycleDuration }) {
  if (!Number.isInteger(numberOfMembers) || numberOfMembers < 2 || numberOfMembers > 50)
    throw new Error('numberOfMembers must be between 2 and 50');
  if (typeof contributionAmount !== 'number' || contributionAmount <= 0)
    throw new Error('contributionAmount must be positive');
  if (!Number.isInteger(cycleDuration) || cycleDuration < 3600)
    throw new Error('cycleDuration must be at least 1 hour (3600 seconds)');
}

function validateAddress(address) {
  if (!/^0x[0-9a-fA-F]{16}$/.test(address)) throw new Error('Invalid Flow address format');
}

module.exports = { validateContribution, validateCircleParams, validateAddress };
