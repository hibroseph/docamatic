const path = require('path')

process.env.NODE_ENV = 'development'

module.exports = {
  entry: {
    app: ['./src/index.js']
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]-bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['react-app']
          }
        }
      }
    ]
  },
  optimization: {
    noEmitOnErrors: true
  }
}