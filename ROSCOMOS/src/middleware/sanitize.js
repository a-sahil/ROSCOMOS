const sanitize = (req, _res, next) => {
  const clean = o => { for (const k in o) { if (typeof o[k] === "string") o[k] = o[k].replace(/[${}]/g,""); else if (o[k] && typeof o[k] === "object") clean(o[k]); } };
  if (req.body)  clean(req.body);
  if (req.query) clean(req.query);
  next();
};
module.exports = { sanitize };
