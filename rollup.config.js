import resolve from '@rollup/plugin-node-resolve';

export default [
  {
    input: 'content/content.js',
    output: {
      file: 'dist/content.bundle.js',
      format: 'iife'
    },
    plugins: [resolve()]
  },
  {
    input: 'worker/dither.worker.js',
    output: {
      file: 'dist/worker.bundle.js',
      format: 'iife'
    },
    plugins: [resolve()]
  }
];
