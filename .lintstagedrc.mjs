export default {
  // TypeScript + JavaScript files
  '*.{ts,tsx,js,jsx}': ['eslint --fix', 'prettier --write'],

  // JSON files
  '*.json': ['prettier --write'],

  // Markdown files
  '*.md': ['prettier --write'],

  // CSS/SCSS files
  '*.{css,scss}': ['prettier --write'],
};
