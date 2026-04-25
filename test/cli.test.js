'use strict';

const assert = require('assert');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const CLI = path.resolve(__dirname, '../bin/index.js');
const FIXTURE_E4 = path.resolve(__dirname, 'fixtures/app-e4.js');
const FIXTURE_E4_NOEXPORT = path.resolve(__dirname, 'fixtures/app-e4-noexport.js');
const FIXTURE_E5 = path.resolve(__dirname, 'fixtures/app-e5.js');

// Routes produced by the fixture apps (order-sensitive, matches registration order)
const E4_ROUTES = [
  'GET   =>   /api/users',
  'POST   =>   /api/users',
  'GET   =>   /api/users/:id',
  'PUT   =>   /api/users/:id',
  'DELETE   =>   /api/users/:id',
  'GET   =>   /health',
];

const E5_ROUTES = [
  'GET   =>   /api/items',
  'POST   =>   /api/items',
  'GET   =>   /api/items/:id',
  'DELETE   =>   /api/items/:id',
  'GET   =>   /health',
  'GET   =>   /ping',
  'GET   =>   /pong',
];

// Spawn `node bin/index.js [args]` with colors disabled, resolving paths from root.
function runCLI(args) {
  return new Promise(resolve => {
    const child = spawn(process.execPath, [CLI, ...args], {
      cwd: path.resolve(__dirname, '..'),
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', d => { stdout += d.toString(); });
    child.stderr.on('data', d => { stderr += d.toString(); });
    child.on('close', code => resolve({ stdout, stderr, code }));
  });
}

// Convert a routes array to the expected `--output print` string
function toPrintOutput(routes) {
  return routes
    .map(r => {
      const sep = '   =>   ';
      const idx = r.indexOf(sep);
      return `${r.slice(0, idx)}\t${r.slice(idx + sep.length)}`;
    })
    .join('\n') + '\n';
}

// ── Express 4.x ──────────────────────────────────────────────────────────────

describe('CLI — Express 4.x', () => {
  it('--output print: prints routes to stdout', async () => {
    const { stdout, code } = await runCLI(['-p', FIXTURE_E4, '-v', 'app', '-o', 'print']);
    assert.strictEqual(code, 0);
    assert.strictEqual(stdout, toPrintOutput(E4_ROUTES));
  });

  it('--output json: writes routes to a JSON file', async () => {
    const out = path.join(os.tmpdir(), `erc-test-e4-${Date.now()}.json`);
    try {
      const { code } = await runCLI(['-p', FIXTURE_E4, '-v', 'app', '-o', 'json', '-f', out]);
      assert.strictEqual(code, 0);
      const { routes } = JSON.parse(fs.readFileSync(out, 'utf8'));
      assert.deepStrictEqual(routes, E4_ROUTES);
    } finally {
      if (fs.existsSync(out)) fs.unlinkSync(out);
    }
  });

  it('handles an app file without module.exports (temp-file path)', async () => {
    const { stdout, code } = await runCLI(['-p', FIXTURE_E4_NOEXPORT, '-v', 'app', '-o', 'print']);
    assert.strictEqual(code, 0);
    assert.strictEqual(stdout, toPrintOutput([
      'GET   =>   /no-export',
      'POST   =>   /no-export',
    ]));
  });
});

// ── Express 5.x ──────────────────────────────────────────────────────────────

describe('CLI — Express 5.x', () => {
  it('--output print: prints routes to stdout', async () => {
    const { stdout, code } = await runCLI(['-p', FIXTURE_E5, '-v', 'app', '-o', 'print']);
    assert.strictEqual(code, 0);
    assert.strictEqual(stdout, toPrintOutput(E5_ROUTES));
  });

  it('--output json: writes routes to a JSON file', async () => {
    const out = path.join(os.tmpdir(), `erc-test-e5-${Date.now()}.json`);
    try {
      const { code } = await runCLI(['-p', FIXTURE_E5, '-v', 'app', '-o', 'json', '-f', out]);
      assert.strictEqual(code, 0);
      const { routes } = JSON.parse(fs.readFileSync(out, 'utf8'));
      assert.deepStrictEqual(routes, E5_ROUTES);
    } finally {
      if (fs.existsSync(out)) fs.unlinkSync(out);
    }
  });
});

// ── Error handling ────────────────────────────────────────────────────────────

describe('CLI — error handling', () => {
  it('exits 1 and reports file-not-found', async () => {
    const { stdout, stderr, code } = await runCLI([
      '-p', '/nonexistent/app.js', '-v', 'app', '-o', 'print',
    ]);
    assert.strictEqual(code, 1);
    assert.ok(
      (stdout + stderr).includes('File not found'),
      `expected "File not found" in output, got: ${stdout}${stderr}`
    );
  });

  it('exits 1 when the requested variable is not exported', async () => {
    const { stdout, stderr, code } = await runCLI([
      '-p', FIXTURE_E4, '-v', 'notExported', '-o', 'print',
    ]);
    assert.strictEqual(code, 1);
    assert.ok(
      (stdout + stderr).includes('notExported'),
      `expected variable name in output, got: ${stdout}${stderr}`
    );
  });

  it('exits 1 when --output json is used without --output-file', async () => {
    const { stdout, stderr, code } = await runCLI([
      '-p', FIXTURE_E4, '-v', 'app', '-o', 'json',
    ]);
    assert.strictEqual(code, 1);
    assert.ok(
      (stdout + stderr).toLowerCase().includes('output file'),
      `expected output-file hint in output, got: ${stdout}${stderr}`
    );
  });

  it('exits 1 for an unrecognised --output type', async () => {
    const { stdout, stderr, code } = await runCLI([
      '-p', FIXTURE_E4, '-v', 'app', '-o', 'xml',
    ]);
    assert.strictEqual(code, 1);
    assert.ok(
      (stdout + stderr).includes('xml'),
      `expected invalid type in output, got: ${stdout}${stderr}`
    );
  });
});
