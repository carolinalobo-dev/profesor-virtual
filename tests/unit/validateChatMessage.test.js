import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateChatMessage } from '../../src/middlewares/validateChatMessage.js';

function run(body) {
  const req = { body };
  const res = { statusCode: null, payload: null, status(code) { this.statusCode = code; return this; }, json(data) { this.payload = data; return this; } };
  let passed = false;
  validateChatMessage(req, res, () => { passed = true; });
  return { req, res, passed };
}

const valid = { studentName: 'Ana', course: 'Python', message: 'Hola' };

test('acepta un cuerpo válido y usa WebChat por defecto', () => {
  const { req, passed } = run(valid);
  assert.ok(passed);
  assert.equal(req.body.channel, 'WebChat');
});

test('recorta espacios y elimina caracteres de control', () => {
  const { req } = run({ ...valid, studentName: '  Ana\u0000\u0007 López  ', message: 'Hola\u001b[31m' });
  assert.equal(req.body.studentName, 'Ana   López');
  assert.ok(!/[\u0000-\u001f]/.test(req.body.message));
});

test('rechaza campos vacíos, de tipo incorrecto o demasiado largos', () => {
  for (const body of [
    { ...valid, studentName: '' },
    { ...valid, course: '   ' },
    { ...valid, message: 42 },
    { ...valid, message: 'a'.repeat(1001) },
    { ...valid, studentName: 'a'.repeat(101) },
    null,
    undefined,
  ]) {
    const { res, passed } = run(body);
    assert.equal(passed, false);
    assert.equal(res.statusCode, 400);
  }
});

test('el mensaje de límite exacto (1000 caracteres) es válido', () => {
  assert.ok(run({ ...valid, message: 'a'.repeat(1000) }).passed);
});
