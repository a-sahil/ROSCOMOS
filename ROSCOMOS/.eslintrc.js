module.exports = {
  env: { node: true, es2021: true },
  extends: ['eslint:recommended'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    semi: ['error', 'always'],
    quotes: ['error', 'single']
  }
};
