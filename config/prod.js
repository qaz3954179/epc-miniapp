module.exports = {
  env: {
    NODE_ENV: '"production"',
  },
  defineConstants: {
    'process.env.TARO_APP_API_URL': JSON.stringify('https://api.epc.example.com'),
  },
  mini: {},
  h5: {
    /**
     * WebpackChain to customize webpack configuration
     * https://github.com/neutrinojs/webpack-chain
     */
    // chainWebpack(chain) {},
  },
}
