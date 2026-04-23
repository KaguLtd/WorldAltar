import { baseConfig } from '../../packages/config/eslint.base.mjs';

export default [
  ...baseConfig,
  {
    ignores: ['src-tauri/target']
  }
];
