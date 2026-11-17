// Parse only the formatting offered by the editor. Everything else stays text.
export function parseInline(text) {
  const nodes = [];
  const pattern = /!\[([^\]\n]*)\]\((https?:\/\/[^\s)]+)\)|(?<!\\)(\*\*|\*)(?!\*)([\s\S]+?)(?<!\\)\3(?!\*)/g;
  let offset = 0;
  for (const match of text.matchAll(pattern)) {
    if (match.index > offset) nodes.push({ type: 'text', text: text.slice(offset, match.index).replace(/\\\*/g, '*') });
    if (match[2]) nodes.push({ type: 'image', alt: match[1], src: match[2] });
    else nodes.push({ type: match[3] === '**' ? 'strong' : 'em', children: parseInline(match[4]) });
    offset = match.index + match[0].length;
  }
  if (offset < text.length) nodes.push({ type: 'text', text: text.slice(offset).replace(/\\\*/g, '*') });
  return nodes;
}

export function appendFormatted(target, text) {
  const doc = target.ownerDocument;
  function append(parent, nodes) {
    for (const node of nodes) {
      if (node.type === 'text') {
        node.text.split('\n').forEach((line, index) => {
          if (index) parent.append(doc.createElement('br'));
          parent.append(line);
        });
      } else if (node.type === 'image') {
        const img = doc.createElement('img');
        img.className = 'sm-content-image';
        img.src = node.src;
        img.alt = node.alt;
        // Inline constraints survive the forum's general image rules.
        img.style.cssText = 'display:block!important;max-width:100%!important;width:auto!important;height:auto!important;margin:16px auto!important;float:none!important;';
        parent.append(img);
      } else {
        const element = doc.createElement(node.type);
        append(element, node.children);
        parent.append(element);
      }
    }
  }
  append(target, parseInline(text));
}

export function plainFormattedText(text) {
  function plain(nodes) {
    return nodes.map(node => node.type === 'image' ? '' : node.type === 'text' ? node.text : plain(node.children)).join('');
  }
  return plain(parseInline(text));
}
