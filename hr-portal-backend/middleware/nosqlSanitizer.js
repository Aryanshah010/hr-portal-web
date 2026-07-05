const sanitizeObject = (target) => {
  if (target instanceof Object) {
    for (const key in target) {
      if (key.startsWith("$") || key.includes(".")) {
        delete target[key];
      } else {
        sanitizeObject(target[key]);
      }
    }
  }
  return target;
};

export const cleanNoSqlInjection = (req, res, next) => {
  if (req.body) req.body = sanitizeObject(req.body);
  if (req.query) req.query = sanitizeObject(req.query);
  if (req.params) req.params = sanitizeObject(req.params);

  next();
};
