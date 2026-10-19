const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const { WebpackManifestPlugin } = require("webpack-manifest-plugin");
const WebpackShellPluginNext = require("webpack-shell-plugin-next");
const BundleAnalyzerPlugin = require("webpack-bundle-analyzer").BundleAnalyzerPlugin;

const config = {
  // Entry files for our popup and background pages
  entry: {
    popup: "./src/apps/popup/index.js",
    background: "./src/apps/background/background.js",
    // "script" is the content script in manifest.json; keep the name
    script: "./src/apps/script/loader.js",
    "notes-ui": "./src/apps/script/notes-ui.js",
    homepage: "./src/apps/homepage/index.js",
    onboarding: "./src/apps/tabpage/onboarding.js",
    offscreen: "./src/apps/offscreen/offscreen.js",
    options: "./src/apps/options/options.js"
  },
  // Extension will be built into ./dist folder, which we can then load as unpacked extension in Chrome
  output: {
    path: path.resolve(__dirname, "dist"),
    // The notes UI is injected by the background by file name, so it has no
    // hash (see NOTES_UI_FILE in src/utils/constants.js)
    filename: (pathData) => (pathData.chunk.name === "notes-ui" ? "[name].js" : "[name].[fullhash].js"),
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
      // Webpack 5 asset modules (replace the deprecated url-loader/file-loader)
      {
        test: /\.(jpe?g|png|gif|svg)$/i,
        // Images under 8KB are inlined as data URLs, larger ones become files
        type: "asset",
        parser: { dataUrlCondition: { maxSize: 8192 } },
        generator: { filename: "assets/[name][ext]" },
      },
      {
        test: /\.(ttf|woff|woff2?)$/,
        type: "asset/resource",
        generator: { filename: "css/fonts/[name]-[hash:8][ext]" },
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
      chunks: ["options"],
      filename: "options.html",
      template: "./src/apps/options/options.html"
    }),
    new HtmlWebpackPlugin({
      chunks: ["offscreen"],
      filename: "offscreen.html",
      template: "./src/apps/offscreen/offscreen.html"
    }),
    // copy extension manifest and icons
    new CopyWebpackPlugin({
      patterns: [{ from: "./manifest.json" }, { context: "./icons/", from: "docamatic-icon*", to: "./icons/" }],
    }),
    new WebpackManifestPlugin({ fileName: "assetManifest.json", basePath: "" }),
    new WebpackShellPluginNext({
      onBeforeBuild: {
        scripts: ["echo onBeforeBuild",
          "node clean-dist.js"]
      },
      onDoneWatch: {
        scripts: [
          "echo onWatchRun",
          "node clean-dist.js"
        ]
      },
      onAfterDone : {
        scripts: [
          "node refresh-paths.js"
        ]
      }
    }),
    //new BundleAnalyzerPlugin(),
  ],
};

module.exports = (env, argv) => ({
  ...config,
  // Production uses "hidden" source maps: the .map files are still written
  // (and uploaded to Sentry) but the shipped bundles don't reference them, so
  // users' DevTools don't try to load maps that aren't in the extension zip
  devtool: argv.mode === "production" ? "hidden-source-map" : "source-map",
});
