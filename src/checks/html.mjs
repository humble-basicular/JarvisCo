import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { parse } from 'parse5';

export function nodes(root) {
  return [root, ...(root.childNodes ?? []).flatMap(nodes)];
}
export function attr(node, name) { return node.attrs?.find((a) => a.name === name)?.value; }
export function text(node) {
  if (['script', 'style'].includes(node.tagName)) return '';
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(text).join(' ');
}
// DOM textContent: no separator between nodes, so missing source whitespace shows.
export function textContent(node) {
  if (['script', 'style'].includes(node.tagName)) return '';
  return node.nodeName === '#text' ? node.value : (node.childNodes ?? []).map(textContent).join('');
}
export function pages(dir = 'dist') {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) return pages(file);
    if (!entry.name.endsWith('.html')) return [];
    const html = readFileSync(file, 'utf8');
    const tree = parse(html);
    return [{ file, path: relative('dist', file), html, tree, nodes: nodes(tree) }];
  });
}
export function normalized(value) { return value.replace(/\s+/gu, ' ').trim(); }
