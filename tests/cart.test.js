const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');
const { cart, addToCart } = require('../cart');

describe('cart module', () => {
  beforeEach(() => {
    cart.length = 0;
  });

  test('adding same product twice increases quantity', () => {
    const product = { nombre: 'Producto', precio: 100, imagenes: ['img'] };
    addToCart(product);
    addToCart(product);
    assert.strictEqual(cart.length, 1);
    assert.strictEqual(cart[0].quantity, 2);
  });
});
