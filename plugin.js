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
  // Use reduce to accumulate routes into a single array
  return app._router.stack.reduce((routes, layer) => {
    return routes.concat(getRoutesFromLayer(layer, ''));
  }, []);
}

function getRoutesFromLayer(layer, parentPath) {
  // If this layer has a route, format it as 'METHOD   =>   /path'
  if (layer.route) {
    const path = layer.route.path;
    const methods = Object.keys(layer.route.methods);
    // Format each method with its path
    return methods.map((method) => `${method.toUpperCase()}   =>   ${ensureSlash(parentPath + path)}`);
  }

  // If this layer is a nested router, process its stack recursively
  if (layer.name === 'router' && layer.handle && layer.handle.stack) {
    const nestedPath = ensureSlash(parentPath + extractPathFromRegexp(layer.regexp));  // Convert regex to path string
    return layer.handle.stack.reduce((nestedRoutes, nestedLayer) => {
      return nestedRoutes.concat(getRoutesFromLayer(nestedLayer, nestedPath));
    }, []);
  }

  return [];
}

// Ensure correct slashing between parentPath and path segments
function ensureSlash(path) {
  if (!path.startsWith('/')) {
    path = '/' + path;  // Ensure the path starts with a '/'
  }
  return path.replace(/\/+/g, '/');  // Ensure there's exactly one slash between parts
}

// Helper function to convert Express's path regex to a string
function extractPathFromRegexp(regexp) {
  const path = regexp
    .toString()
    .replace('/^\\/', '/')  // Ensure path starts with '/'
    .replace('\\/?(?=\\/|$)/i', '')  // Remove end regex characters
    .replace(/\\\//g, '/')  // Convert escaped slashes to normal slashes
    .replace(/\/$/, '');  // Remove trailing slash
  return path;
}


module.exports = registeredRoutes;