import test from 'node:test';
import assert from 'node:assert/strict';
import {parseInline, plainFormattedText} from '../site/naruto/template-saga-studio/text-format.js';

test('bold and existing italics can be combined without exposing markers', () => {
  const nodes = parseInline('Um **trecho *importante*** e *outro*.');
  assert.equal(nodes[1].type, 'strong');
  assert.equal(nodes[1].children[1].type, 'em');
  assert.equal(plainFormattedText('Um **trecho *importante*** e *outro*.'), 'Um trecho importante e outro.');
});

test('images keep URLs and descriptions but do not inflate the word count', () => {
  const text = 'Antes\n\n![uma longa descrição](https://example.com/photo.png?w=2400&h=1200)\n\nDepois';
  const image = parseInline(text).find(node => node.type === 'image');
  assert.equal(image.src, 'https://example.com/photo.png?w=2400&h=1200');
  assert.equal(image.alt, 'uma longa descrição');
  assert.equal(plainFormattedText(text).trim().split(/\s+/).length, 2);
});

test('raw HTML and executable image protocols remain inert text', () => {
  for (const text of ['<img src=x onerror=alert(1)>', '![x](javascript:alert(1))', '![x](data:text/html,example)']) {
    assert.deepEqual(parseInline(text), [{type: 'text', text}]);
  }
});

test('escaped stars stay literal and unfinished formatting preserves the draft', () => {
  assert.equal(plainFormattedText('Texto \\*literal\\* e **inacabado'), 'Texto *literal* e **inacabado');
});
