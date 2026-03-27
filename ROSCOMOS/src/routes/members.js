const express = require("express");
const r = express.Router({ mergeParams: true });
const { authenticate } = require("../middleware/auth");
const { joinCircle } = require("../controllers/memberController");
r.post("/join", authenticate, joinCircle);
module.exports = r;
