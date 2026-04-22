module.exports = {
  env: {
    NODE_ENV: '"development"',
  },
  defineConstants: {
    'process.env.TARO_APP_API_URL': JSON.stringify('http://localhost:8000'),
  },
  mini: {},
  h5: {},
}
