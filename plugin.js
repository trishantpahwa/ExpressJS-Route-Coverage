function registeredRoutes(app, packageJSON) {
  const version = packageJSON.dependencies.express;
  const regex = /^[^]?(4)/;
  const matchedRegex = version.match(regex);
  if (!matchedRegex || matchedRegex[1] !== "4") {
    console.log("Only Express 4.x is supported.");
    return [];
  }
  const _routes = app._router.stack.filter((route) => route.name === "bound dispatch").map((route) => route.route);
  return _routes.map((route) => {
    let _method = Object.keys(route.methods)[0], _path = route.path, _description = "";
    if (_path.path) {
      _path = _path.path;
    }
    return `${_method.toUpperCase()}   =>   ${encodeURI(_path)}`;
  });
}

module.exports = registeredRoutes;
