const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const ManifestPlugin = require("webpack-manifest-plugin");
const WebpackShellPlugin = require("webpack-shell-plugin");

module.exports = {
  // Entry files for our popup and background pages
  entry: {
    popup: "./src/popup/index.js",
    background: "./src/background/index.js",
    script: "./src/index.js"
  },
  // Extension will be built into ./dist folder, which we can then load as unpacked extension in Chrome
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[hash].js"
  },
  // Here we define loaders for different file types
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        include: [path.resolve(__dirname, "./src")],
        exclude: /node_modules/,
        use: {
          loader: "ts-loader"
        }
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192,
              name: "assets/[hash].[ext]"
            }
          }
        ]
      }, {
        test: /\.(ttf|woff|woff2?)$/,
        use: {
          loader: 'file-loader'
          , options: {
            name: 'css/fonts/[name]-[hash:8].[ext]'
          }
        }
      },
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "source-map-loader"
      }
    ]
  },
  plugins: [
    // create CSS file with all used styles
    new MiniCssExtractPlugin(),
    // create popup.html from template and inject styles and script bundles
    new HtmlWebpackPlugin({
      chunks: ["popup"],
      hash: true,
      filename: "index.html",
      template: "./src/popup/index.html"
    }),
    // copy extension manifest and icons
    new CopyWebpackPlugin([
      { from: "./src/manifest.json" },
      { context: "./icons/", from: "icon*", to: "./icons/" }
    ]),
    new CleanWebpackPlugin(["dist"]),
    new ManifestPlugin({ fileName: "assetManifest.json" }),
    new WebpackShellPlugin({ onBuildStart: ["rm -rf dist/"], onBuildEnd: ["node refreshPaths.js"] })
  ],
  devtool: "source-map"
};
