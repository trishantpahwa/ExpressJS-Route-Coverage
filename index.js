const registeredRoutes = require("./plugin");

module.exports = {
  logRegisteredRoutes: (app, packageJSON) => {
    return registeredRoutes(app, packageJSON);
  },
};
