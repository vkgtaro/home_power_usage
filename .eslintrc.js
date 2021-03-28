module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true
  },
  plugins: [
    'jest'
  ],
  extends: [
    'standard',
    'plugin:jest/recommended'
  ],
  parserOptions: {
    ecmaVersion: 12
  },
  rules: {
  }
}
