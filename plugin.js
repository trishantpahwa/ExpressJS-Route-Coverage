'use strict';

function registeredRoutes(app, _packageJSON) {
  // Express 4.x uses lazy router init; 5.x does not expose lazyrouter
  if (typeof app.lazyrouter === 'function') {
    try { app.lazyrouter(); } catch (_) {}
  }

  // Express 3.x: routes stored as { get: [{path,...}], post: [...] }
  if (app.routes && typeof app.routes === 'object' && !app._router) {
    return getRoutesV3(app);
  }

  const router = getRouter(app);
  if (!router || !Array.isArray(router.stack)) return [];

  return extractFromStack(router.stack, '');
}

// Safely resolve the internal router across Express versions.
// Express 4.x: app._router (app.router throws a deprecation error on 4.x)
// Express 5.x: app.router  (app._router is undefined)
function getRouter(app) {
  if (app._router && Array.isArray(app._router.stack)) return app._router;

  // Only attempt app.router when _router is absent to avoid the Express 4.x error
  if (!app._router) {
    try {
      const r = app.router;
      if (r && Array.isArray(r.stack)) return r;
    } catch (_) {}
  }

  return null;
}

function getRoutesV3(app) {
  return Object.keys(app.routes).flatMap(method =>
    app.routes[method].map(route => fmt(method, normalizePath(route.path)))
  );
}

function extractFromStack(stack, prefix) {
  return stack.flatMap(layer => extractFromLayer(layer, prefix));
}

function extractFromLayer(layer, prefix) {
  if (layer.route) {
    // Express 5.x allows app.get(['/a', '/b'], handler) — path may be an array
    const paths = Array.isArray(layer.route.path) ? layer.route.path : [layer.route.path];
    const methods = Object.keys(layer.route.methods).filter(m => layer.route.methods[m]);
    return paths.flatMap(p =>
      methods.map(m => fmt(m, normalizePath(prefix + p)))
    );
  }

  if (layer.handle && Array.isArray(layer.handle.stack)) {
    const mountPath = getMountPath(layer);
    return extractFromStack(layer.handle.stack, prefix + mountPath);
  }

  return [];
}

function getMountPath(layer) {
  // Express 4.x: layer.regexp with optional fast-path flags
  if (layer.regexp) {
    if (layer.regexp.fast_slash) return '/';
    if (layer.regexp.fast_star) return '/*';
    return parsePath(layer.regexp.source, layer.keys || []);
  }

  // Express 5.x: layer.matchers (closures over a compiled regexp) + layer.slash for '/'
  if (layer.matchers) {
    if (layer.slash) return '/';
    return extractPathFromMatcher(layer.matchers[0]);
  }

  return '/';
}

// Express 5.x stores the compiled regexp inside the matcher closure.
// Recover it by briefly intercepting RegExp.prototype.exec — the first call the
// matcher makes always invokes exec even on a non-matching probe path.
function extractPathFromMatcher(matcherFn) {
  if (typeof matcherFn !== 'function') return '/';

  let capturedRegexp = null;
  const originalExec = RegExp.prototype.exec;

  RegExp.prototype.exec = function interceptExec() {
    RegExp.prototype.exec = originalExec;
    capturedRegexp = this;
    return originalExec.apply(this, arguments);
  };

  try {
    matcherFn('/');
  } catch (_) {
    // ignore
  } finally {
    RegExp.prototype.exec = originalExec;
  }

  if (!capturedRegexp) return '/';
  return parsePath(capturedRegexp.source, []);
}

// Parse the mount path out of an Express layer regexp source string.
//
// Handles three formats:
//   Express 4.x static  (path-to-regexp@0.1.x): ^\/api\/?(?=\/|$)
//   Express 4.x param:                           ^\/orgs(?:\/([^/]+?))\/?(?=\/|$)
//   Express 5.x         (path-to-regexp@8.x):    ^(?:\/api)(?:\/$)?(?=\/|$)
//
// The `keys` array (from layer.keys) supplies parameter names for capture groups.
// When keys is empty (Express 5.x mount layers), params are named :param0, :param1, …
function parsePath(source, keys) {
  let rest = source.startsWith('^') ? source.slice(1) : source;

  // Express 5.x wraps the path literal in a single outer (?:…) group.
  // Unwrap only when it is NOT itself a parameter wrapper.
  if (rest.startsWith('(?:') && !isParamWrapper(rest)) {
    const inner = unwrapNonCapturingGroup(rest);
    if (inner !== null) rest = inner;
  }

  const parts = [];
  let ki = 0;

  while (rest.length > 0) {
    // Escaped slash (\/)
    if (rest.startsWith('\\/')) {
      if (rest[2] === '?') break; // \/? = optional trailing slash — suffix starts here
      parts.push('/');
      rest = rest.slice(2);
      continue;
    }

    // Unescaped / — defensive against unusual regexp sources
    if (rest[0] === '/') {
      parts.push('/');
      rest = rest.slice(1);
      continue;
    }

    // Non-capturing group that wraps a path parameter: (?:\/captureGroup)?
    // Express 4.x uses this form for named params, e.g. (?:\/([^/]+?))
    if (rest.startsWith('(?:') && isParamWrapper(rest)) {
      rest = rest.slice(3);     // skip (?:
      parts.push('/');
      rest = rest.slice(2);     // skip \/
      // consume the inner capture group
      let depth = 0, i = 0;
      while (i < rest.length) {
        if (rest[i] === '(') depth++;
        else if (rest[i] === ')' && --depth === 0) { i++; break; }
        i++;
      }
      rest = rest.slice(i);
      if (rest[0] === ')') rest = rest.slice(1); // close the outer (?:
      const isOptional = rest[0] === '?';
      if (isOptional) rest = rest.slice(1);
      const key = keys[ki++];
      parts.push(`:${key ? key.name : `param${ki - 1}`}${isOptional ? '?' : ''}`);
      continue;
    }

    // Non-capturing group or lookahead that is NOT a param wrapper → suffix, stop
    if (rest.startsWith('(?:') || rest.startsWith('(?=') || rest.startsWith('(?!')) break;

    // Bare capturing group → route parameter (Express 5.x unwrapped form)
    if (rest[0] === '(') {
      let depth = 0, i = 0;
      while (i < rest.length) {
        if (rest[i] === '(') depth++;
        else if (rest[i] === ')' && --depth === 0) { i++; break; }
        i++;
      }
      rest = rest.slice(i);
      if (rest[0] === '?') rest = rest.slice(1);
      const key = keys[ki++];
      parts.push(`:${key ? key.name : `param${ki - 1}`}`);
      continue;
    }

    // Backslash-escaped character (other than \/)
    if (rest[0] === '\\' && rest.length > 1) {
      parts.push(rest[1]);
      rest = rest.slice(2);
      continue;
    }

    // Literal character — stop at regex metacharacters
    if (!/[\\()?$*+[\]|^]/.test(rest[0])) {
      parts.push(rest[0]);
      rest = rest.slice(1);
      continue;
    }

    break;
  }

  return normalizePath(parts.join(''));
}

// Returns true when str is a (?:\/captureGroup) parameter wrapper, not a suffix.
// Distinguishes (?:\/([^/]+?)) from (?:\/$) or (?:\/(?=$)).
function isParamWrapper(str) {
  const after = str.slice(3); // content after (?:
  if (!after.startsWith('\\/')) return false;
  const inner = after.slice(2); // content after (?:\/
  return inner[0] === '(' &&
    !inner.startsWith('(?:') &&
    !inner.startsWith('(?=') &&
    !inner.startsWith('(?!');
}

// Return the content inside the outermost (?:…) group, or null on parse failure.
function unwrapNonCapturingGroup(str) {
  let depth = 0, i = 0;
  for (; i < str.length; i++) {
    if (str[i] === '(') depth++;
    else if (str[i] === ')' && --depth === 0) { i++; break; }
  }
  return depth === 0 ? str.slice(3, i - 1) : null;
}

function normalizePath(p) {
  const s = ('/' + p).replace(/\/+/g, '/');
  return s.length > 1 ? s.replace(/\/$/, '') : s;
}

function fmt(method, routePath) {
  return `${method.toUpperCase()}   =>   ${routePath}`;
}

module.exports = registeredRoutes;
