const request = require('supertest');
const app = require('../../app');

function buildCirclePayload(overrides = {}) {
  return {
    numberOfMembers: 4,
    contributionAmount: 100.0,
    cycleDuration: 604800,
    ...overrides,
  };
}

module.exports = { request, app, buildCirclePayload };
