const path = require("path");
const HtmlWebpackPlugin = require('html-webpack-plugin')

process.env.NODE_ENV = "development";

module.exports = {
  entry: {
    popup: ['./src/popup/index.js'],
    app: ["./index.js"],
    background: ["./src/background/background.js"]
  },
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name]-bundle.js"
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["react-app"]
          }
        }
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        loader: "url-loader?name=app/images/[name].[ext]"
      }
    ]
  },
  optimization: {
    noEmitOnErrors: true
  },
  // plugins: [
  //   new HtmlWebpackPlugin({
  //     inject: true,
  //     chunks: ['popup'],
  //     filename: 'index.html',
  //     template: './src/popup/popup.html'
  //   })
  // ]
};
