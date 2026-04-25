'use strict';

const assert = require('assert');
const registeredRoutes = require('../plugin');

const noop = () => {};

// ── Express 3.x ──────────────────────────────────────────────────────────────
// Express 3.x is incompatible with Node ≥18 so we test via a structural mock
// that replicates the app.routes interface it exposes.

describe('Express 3.x (mock)', () => {
  const mockApp = {
    routes: {
      get:    [{ path: '/', method: 'get' }, { path: '/users', method: 'get' }],
      post:   [{ path: '/users', method: 'post' }],
      put:    [{ path: '/users/:id', method: 'put' }],
      delete: [{ path: '/users/:id', method: 'delete' }],
    },
  };

  it('returns flat routes from app.routes', () => {
    assert.deepStrictEqual(registeredRoutes(mockApp, null).sort(), [
      'DELETE   =>   /users/:id',
      'GET   =>   /',
      'GET   =>   /users',
      'POST   =>   /users',
      'PUT   =>   /users/:id',
    ]);
  });

  it('returns [] for an empty app.routes object', () => {
    assert.deepStrictEqual(registeredRoutes({ routes: {} }, null), []);
  });

  it('uppercases the HTTP method names', () => {
    const app = { routes: { get: [{ path: '/x', method: 'get' }] } };
    const [route] = registeredRoutes(app, null);
    assert.ok(route.startsWith('GET'));
  });
});

// ── Express 4.x ──────────────────────────────────────────────────────────────

describe('Express 4.x', () => {
  const express = require('express-v4');

  it('returns [] when no routes are registered', () => {
    assert.deepStrictEqual(registeredRoutes(express(), null), []);
  });

  it('handles all standard HTTP methods', () => {
    const app = express();
    app.get('/a', noop);
    app.post('/b', noop);
    app.put('/c', noop);
    app.patch('/d', noop);
    app.delete('/e', noop);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'DELETE   =>   /e',
      'GET   =>   /a',
      'PATCH   =>   /d',
      'POST   =>   /b',
      'PUT   =>   /c',
    ]);
  });

  it('preserves parameter names in flat route paths', () => {
    const app = express();
    app.get('/users/:userId/posts/:postId', noop);

    assert.deepStrictEqual(
      registeredRoutes(app, null),
      ['GET   =>   /users/:userId/posts/:postId']
    );
  });

  it('lists multiple methods on the same path as separate entries', () => {
    const app = express();
    app.get('/resource', noop);
    app.post('/resource', noop);
    app.delete('/resource', noop);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'DELETE   =>   /resource',
      'GET   =>   /resource',
      'POST   =>   /resource',
    ]);
  });

  it('prepends the mount path to nested router routes', () => {
    const app = express();
    const router = express.Router();
    router.get('/list', noop);
    router.post('/create', noop);
    app.use('/items', router);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'GET   =>   /items/list',
      'POST   =>   /items/create',
    ]);
  });

  it('handles three levels of nested routers', () => {
    const app = express();
    const v1 = express.Router();
    const users = express.Router();
    users.get('/', noop);
    users.get('/:id', noop);
    users.post('/', noop);
    v1.use('/users', users);
    app.use('/api/v1', v1);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'GET   =>   /api/v1/users',
      'GET   =>   /api/v1/users/:id',
      'POST   =>   /api/v1/users',
    ]);
  });

  it('handles root mount app.use("/", router)', () => {
    const app = express();
    const router = express.Router();
    router.get('/ping', noop);
    router.post('/ping', noop);
    app.use('/', router);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'GET   =>   /ping',
      'POST   =>   /ping',
    ]);
  });

  it('handles multiple routers mounted at different paths', () => {
    const app = express();
    const auth = express.Router();
    const data = express.Router();
    auth.post('/login', noop);
    auth.post('/logout', noop);
    data.get('/items', noop);
    data.delete('/items/:id', noop);
    app.use('/auth', auth);
    app.use('/data', data);
    app.get('/health', noop);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'DELETE   =>   /data/items/:id',
      'GET   =>   /data/items',
      'GET   =>   /health',
      'POST   =>   /auth/login',
      'POST   =>   /auth/logout',
    ]);
  });

  it('preserves parameter names in a parameterized mount prefix', () => {
    const app = express();
    const router = express.Router();
    router.get('/settings', noop);
    app.use('/orgs/:orgId', router);

    assert.deepStrictEqual(
      registeredRoutes(app, null),
      ['GET   =>   /orgs/:orgId/settings']
    );
  });

  it('normalizes redundant slashes in paths', () => {
    const app = express();
    const router = express.Router();
    router.get('/', noop);
    app.use('/', router);

    const routes = registeredRoutes(app, null);
    assert.ok(routes.every(r => !r.includes('//')), `unexpected double slash: ${routes}`);
  });

  it('returns routes in registration order', () => {
    const app = express();
    app.get('/first', noop);
    app.get('/second', noop);
    app.get('/third', noop);

    assert.deepStrictEqual(registeredRoutes(app, null), [
      'GET   =>   /first',
      'GET   =>   /second',
      'GET   =>   /third',
    ]);
  });

  it('ignores pure middleware layers (no route, no stack)', () => {
    const app = express();
    app.use((req, res, next) => next()); // middleware-only layer
    app.get('/real', noop);

    assert.deepStrictEqual(registeredRoutes(app, null), ['GET   =>   /real']);
  });
});

// ── Express 5.x ──────────────────────────────────────────────────────────────

describe('Express 5.x', () => {
  const express = require('express-v5');

  it('returns [] when no routes are registered', () => {
    assert.deepStrictEqual(registeredRoutes(express(), null), []);
  });

  it('handles all standard HTTP methods', () => {
    const app = express();
    app.get('/a', noop);
    app.post('/b', noop);
    app.put('/c', noop);
    app.patch('/d', noop);
    app.delete('/e', noop);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'DELETE   =>   /e',
      'GET   =>   /a',
      'PATCH   =>   /d',
      'POST   =>   /b',
      'PUT   =>   /c',
    ]);
  });

  it('preserves parameter names in flat route paths', () => {
    const app = express();
    app.get('/users/:userId/posts/:postId', noop);

    assert.deepStrictEqual(
      registeredRoutes(app, null),
      ['GET   =>   /users/:userId/posts/:postId']
    );
  });

  it('handles array of paths on a single route handler (Express 5 feature)', () => {
    const app = express();
    app.get(['/ping', '/pong'], noop);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'GET   =>   /ping',
      'GET   =>   /pong',
    ]);
  });

  it('lists multiple methods on the same path as separate entries', () => {
    const app = express();
    app.get('/resource', noop);
    app.post('/resource', noop);
    app.delete('/resource', noop);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'DELETE   =>   /resource',
      'GET   =>   /resource',
      'POST   =>   /resource',
    ]);
  });

  it('prepends the mount path to nested router routes', () => {
    const app = express();
    const router = express.Router();
    router.get('/list', noop);
    router.post('/create', noop);
    app.use('/items', router);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'GET   =>   /items/list',
      'POST   =>   /items/create',
    ]);
  });

  it('handles three levels of nested routers', () => {
    const app = express();
    const v1 = express.Router();
    const users = express.Router();
    users.get('/', noop);
    users.get('/:id', noop);
    users.post('/', noop);
    v1.use('/users', users);
    app.use('/api/v1', v1);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'GET   =>   /api/v1/users',
      'GET   =>   /api/v1/users/:id',
      'POST   =>   /api/v1/users',
    ]);
  });

  it('handles root mount app.use("/", router)', () => {
    const app = express();
    const router = express.Router();
    router.get('/ping', noop);
    app.use('/', router);

    assert.deepStrictEqual(registeredRoutes(app, null), ['GET   =>   /ping']);
  });

  it('handles multiple routers mounted at different paths', () => {
    const app = express();
    const auth = express.Router();
    const data = express.Router();
    auth.post('/login', noop);
    data.get('/items', noop);
    data.delete('/items/:id', noop);
    app.use('/auth', auth);
    app.use('/data', data);
    app.get('/health', noop);

    assert.deepStrictEqual(registeredRoutes(app, null).sort(), [
      'DELETE   =>   /data/items/:id',
      'GET   =>   /data/items',
      'GET   =>   /health',
      'POST   =>   /auth/login',
    ]);
  });

  it('uses generic :param names for a parameterized mount prefix (known limitation)', () => {
    // Express 5 stores the compiled regexp inside a closure; param names from
    // layer.keys are only populated after matching, not at inspection time.
    const app = express();
    const router = express.Router();
    router.get('/settings', noop);
    app.use('/orgs/:orgId', router);

    const routes = registeredRoutes(app, null);
    // Path structure must be correct even if param name is generic
    assert.strictEqual(routes.length, 1);
    assert.ok(
      /^GET   =>   \/orgs\/:.*\/settings$/.test(routes[0]),
      `unexpected route: ${routes[0]}`
    );
  });

  it('normalizes redundant slashes in paths', () => {
    const app = express();
    const router = express.Router();
    router.get('/', noop);
    app.use('/', router);

    const routes = registeredRoutes(app, null);
    assert.ok(routes.every(r => !r.includes('//')), `unexpected double slash: ${routes}`);
  });

  it('returns routes in registration order', () => {
    const app = express();
    app.get('/first', noop);
    app.get('/second', noop);
    app.get('/third', noop);

    assert.deepStrictEqual(registeredRoutes(app, null), [
      'GET   =>   /first',
      'GET   =>   /second',
      'GET   =>   /third',
    ]);
  });
});
