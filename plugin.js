function registeredRoutes(app, packageJSON) {
  const version = packageJSON.dependencies.express;
  const regex = /^[^]?(4)/;
  const matchedRegex = version.match(regex);
  if (!matchedRegex || matchedRegex[1] !== "4") {
    console.log("Only Express 4.x is supported.");
    return [];
  }
  return getRoutes(app);
}

function getRoutes(app) {
  // Initialize the base path as empty string and start from app._router.stack
  return app._router.stack.reduce((routes, layer) => {
    return routes.concat(getRoutesFromLayer(layer, ''));
  }, []);
}

function getRoutesFromLayer(layer, parentPath) {
  // If this layer has a route, return the route's path and methods
  if (layer.route) {
    const path = layer.route.path;
    const methods = Object.keys(layer.route.methods);
    return methods.map((method) => `${method.toUpperCase()}   =>   ${encodeURI(parentPath + path)}`);
  }

  // If this layer has nested routers, process them iteratively
  if (layer.name === 'router' && layer.handle && layer.handle.stack) {
    const nestedPath = extractPathFromRegexp(layer.regexp);  // Convert regex to string path
    // Reduce the nested layers (from router) to collect routes
    return layer.handle.stack.reduce((nestedRoutes, nestedLayer) => {
      return nestedRoutes.concat(getRoutesFromLayer(nestedLayer, parentPath + nestedPath));
    }, []);
  }

  // If the layer doesn't match a route or router, return an empty array
  return [];
}

// Helper function to extract the path from the layer's regexp
function extractPathFromRegexp(regexp) {
  const path = regexp
    .toString()
    .replace('/^\\/', '')  // Remove the regex start characters
    .replace('\\/?(?=\\/|$)/i', '')  // Remove the regex end characters
    .replace(/\\\//g, '/');  // Replace escaped slashes with regular slashes
  return path;
}

module.exports = registeredRoutes;