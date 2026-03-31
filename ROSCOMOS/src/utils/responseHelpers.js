function successResponse(res, data, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function errorResponse(res, message, statusCode = 400) {
  return res.status(statusCode).json({ success: false, error: message });
}

function notFound(res, entity = 'Resource') {
  return res.status(404).json({ success: false, error: `${entity} not found` });
}

module.exports = { successResponse, errorResponse, notFound };
