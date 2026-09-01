const test = require('node:test');
const assert = require('node:assert/strict');
const {
  BLOBS, DRIFT, blobCenter, blobRadius, alphaHex, paintField, start
} = require('../assets/js/ambient-bg.js');

test('BLOBS: 4 blobs, each fully shaped with a 6-digit hex hue', () => {
  assert.equal(BLOBS.length, 4);
  for (const b of BLOBS) {
    for (const k of ['hue', 'bx', 'by', 'sx', 'sy', 'phase', 'r']) {
      assert.ok(k in b, `blob missing ${k}`);
    }
    assert.match(b.hue, /^#[0-9A-Fa-f]{6}$/);
  }
});

test('blobCenter never wanders more than DRIFT from the blob base, at any time', () => {
  const w = 1440, h = 900, eps = 1e-6;
  for (const b of BLOBS) {
    for (let t = 0; t < 240; t += 0.37) {
      const c = blobCenter(b, t, w, h);
      assert.ok(c.x >= (b.bx - DRIFT) * w - eps && c.x <= (b.bx + DRIFT) * w + eps,
        `x out of band for ${b.hue} at t=${t}`);
      assert.ok(c.y >= (b.by - DRIFT) * h - eps && c.y <= (b.by + DRIFT) * h + eps,
        `y out of band for ${b.hue} at t=${t}`);
    }
  }
});

test('blobCenter is pure: same inputs -> same output', () => {
  assert.deepEqual(
    blobCenter(BLOBS[0], 12.5, 800, 600),
    blobCenter(BLOBS[0], 12.5, 800, 600)
  );
});

test('blobRadius uses max(w,h) and scales with blob.r', () => {
  assert.equal(blobRadius(BLOBS[0], 2000, 1000), blobRadius(BLOBS[0], 1000, 2000));
  assert.ok(blobRadius(BLOBS[1], 1000, 1000) > blobRadius(BLOBS[2], 1000, 1000)); // r 1.15 > 0.70
});

test('alphaHex: clamped, two-digit, lowercase', () => {
  assert.equal(alphaHex(0), '00');
  assert.equal(alphaHex(10), '0a');
  assert.equal(alphaHex(0x33), '33');
  assert.equal(alphaHex(255), 'ff');
  assert.equal(alphaHex(300), 'ff');
  assert.equal(alphaHex(-5), '00');
});

test('paintField: clears to base, switches to lighter, draws 4 three-stop gradients, resets compositing', () => {
  const calls = [];
  const grads = [];
  const ctx = {
    _op: null,
    set globalCompositeOperation(v) { this._op = v; calls.push(['op', v]); },
    get globalCompositeOperation() { return this._op; },
    set fillStyle(v) { calls.push(['fill', v]); },
    get fillStyle() { return null; },
    fillRect() { calls.push(['rect']); },
    createRadialGradient() {
      const g = { stops: [], addColorStop(o, c) { this.stops.push([o, c]); } };
      grads.push(g);
      return g;
    }
  };
  paintField(ctx, 800, 600, 3.0);

  assert.deepEqual(calls[0], ['op', 'source-over']);
  assert.deepEqual(calls[1], ['fill', '#060608']);
  assert.ok(calls.some(c => c[0] === 'op' && c[1] === 'lighter'));
  assert.equal(grads.length, 4);
  for (const g of grads) {
    assert.equal(g.stops.length, 3);
    assert.match(g.stops[2][1], /00$/); // outer stop fully transparent
  }
  assert.deepEqual(calls[calls.length - 1], ['op', 'source-over']); // reset at the end
});

test('start() no-ops (returns null) when there is no #ambient-bg canvas', () => {
  assert.equal(start({ getElementById: () => null }), null);
});
