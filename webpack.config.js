const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const WebpackShellPluginNext = require("webpack-shell-plugin-next");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

module.exports = {
  // Entry files for our popup and background pages
  entry: {
    popup: "./src/apps/popup/index.js",
    background: "./src/apps/background/background.js",
    script: "./src/apps/script/script.js",
    homepage: "./src/apps/homepage/index.js",
    onboarding: "./src/apps/tabpage/onboarding.js",
    webboard: "./src/apps/tabpage/webboard.js"
  },
  // Extension will be built into ./dist folder, which we can then load as unpacked extension in Chrome
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[fullhash].js",
    publicPath: "",
  },
  // Here we define loaders for different file types
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        include: [path.resolve(__dirname, "./src")],
        exclude: /node_modules/,
        use: {
          loader: "ts-loader",
        },
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"],
      },
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        use: [
          {
            loader: "url-loader",
            options: {
              limit: 8192,
              name: "assets/[name].[ext]",
            },
          },
        ],
      },
      {
        test: /\.(ttf|woff|woff2?)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "css/fonts/[name]-[fullhash:8].[ext]",
          },
        },
      },
      {
        enforce: "pre",
        test: /\.js$/,
        exclude: /node_modules/,
        loader: "source-map-loader",
      },
    ],
  },
  plugins: [
    // create CSS file with all used styles
    new MiniCssExtractPlugin(),
    // create popup.html from template and inject styles and script bundles
    new HtmlWebpackPlugin({
      chunks: ["popup"],
      hash: true,
      filename: "index.html",
      template: "./src/apps/popup/index.html",
    }),
    new HtmlWebpackPlugin({
      chunks: ["homepage"],
      hash: true,
      filename: "homepage.html",
      template: "./src/apps/homepage/homepage.html",
    }),
    new HtmlWebpackPlugin({
      chunks: ["onboarding"],
      hash: true,
      filename: "onboarding.html",
      template: "./src/apps/tabpage/tabpage.html"
    }),
    new HtmlWebpackPlugin({
      chunks: ["webboard"],
      hash:true,
      filename:"webboard.html",
      template:"./src/apps/tabpage/tabpage.html"
    }),
    // copy extension manifest and icons
    new CopyWebpackPlugin({
      patterns: [{ from: "./manifest.json" }, { context: "./icons/", from: "docamatic-icon*", to: "./icons/" }],
    }),
    //new CleanWebpackPlugin(["dist"]),
    new WebpackManifestPlugin({ fileName: "assetManifest.json", basePath: "" }),
    new WebpackShellPluginNext({
      onBeforeBuild: {
        scripts: ["echo onBeforeBuild",
          "./watch.sh"]
      },
      onDoneWatch: {
        scripts: [
          "echo onWatchRun",
          "./watch.sh"
        ]
      },
      onAfterDone : {
        scripts: [
          "node refresh-paths.js"
        ]
      },
      onBuildStart: {
        scripts: [
          "rm -rf dist/"],
      }
    }),
    //new BundleAnalyzerPlugin(),
  ],
  devtool: "source-map",
};
