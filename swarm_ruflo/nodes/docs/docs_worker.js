'use strict';

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'C:\\AI_Agents\\notebooklm_docs\\';

function slugify(title) {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function generateMarkdownDoc(title, content) {
  const date = new Date().toISOString();
  const frontMatter = ['---', `title: "${title}"`, `date: "${date}"`, `author: "Ruflo-Agent"`, '---', ''].join(
    '\n'
  );

  const fileName = `${slugify(title)}.md`;
  const filePath = path.join(OUTPUT_DIR, fileName);

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(filePath, `${frontMatter}\n${content}\n`, 'utf8');

  console.log(`[Agent_Docs] Documento generado en ${filePath}`);

  return { status: 'SUCCESS', path: filePath };
}

module.exports = { generateMarkdownDoc };
