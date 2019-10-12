const path = require("path");
const webpack = require("webpack");
const CleanWebpackPlugin = require("clean-webpack-plugin");
const MinifyPlugin = require("babel-minify-webpack-plugin");
const PrintTimeWebpackPlugin = require("print-time-webpack");
const IS_PRODUCTION = process.env.NODE_ENV === "production";
const fs = require("fs");
const WebpackOnBuildPlugin = require("on-build-webpack");
const buildDir = "./dist/";
const DIST_DIR = path.resolve(__dirname, "dist/");
const SRC_DIR = path.resolve(__dirname, "src");
const ASSET_EXTENSIONS = [
  "jpg",
  "jpeg",
  "png",
  "gif",
  "eot",
  "otf",
  "svg",
  "ttf",
  "woff",
  "woff2"
];
const MANIFEST_FILE = "manifest.json";

const manifestPath = path.join(SRC_DIR, MANIFEST_FILE);

module.exports = {
  output: {
    filename: MANIFEST_FILE,
    path: DIST_DIR
  },
  entry: {
    manifestPath
  },
  module: {
    rules: [
      {
        test: /\.html$/,
        use: [
          "file-loader",
          "extract-loader",
          {
            loader: "html-loader",
            options: {
              minimize: IS_PRODUCTION,
              attrs: ["link:href", "script:src", "img:src"]
            }
          }
        ]
      },
      {
        test: /\.css$/,
        use: [
          "file-loader",
          "extract-loader",
          {
            loader: "css-loader"
          }
        ]
      },
      {
        test: /\/index\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: "spawn-loader",
            options: {
              name: "[hash].js"
            }
          }
        ]
      },
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: [
          {
            loader: "babel-loader",
            query: {
              presets: ["@babel/preset-env", "@babel/preset-react"]
            }
          },
          // Ensure babel-polyfill is imported
          // Normally, this would just be an entry point, but relying on
          // spawn-loader is preventing us from doing that.
          {
            loader: "imports-loader",
            query: "__babelPolyfill=babel-polyfill"
          }
        ]
      },
      {
        test: new RegExp(".(" + ASSET_EXTENSIONS.join("|") + ")$"),
        use: {
          loader: "file-loader",
          options: {
            outputPath: "assets/"
          }
        }
      },
      {
        test: manifestPath,
        use: [
          { loader: "file-loader", options: { name: "manifest.[ext]" } },
          { loader: "extricate-loader" },
          { loader: "interpolate-loader" }
        ]
      }
    ]
  },
  plugins: [
    IS_PRODUCTION
      ? new WebpackOnBuildPlugin(stats => {
          const newlyCreatedAssets = stats.compilation.assets;

          const unlinked = [];

          fs.readdir(path.resolve(buildDir), (err, files) => {
            files.forEach(function(file) {
              if (!newlyCreatedAssets[file]) {
                fs.unlink(path.resolve(buildDir + file), () => {});
                unlinked.push(file);
              }
            });
            if (unlinked.length > 0) {
              console.log("Removed old assets: ", unlinked);
            }
          });
        })
      : /* no-op */ new Function(),
    new CleanWebpackPlugin(DIST_DIR),
    new webpack.ProvidePlugin({
      browser: "webextension-polyfill"
    }),
    IS_PRODUCTION ? new MinifyPlugin() : /* no-op */ new Function(),
    new PrintTimeWebpackPlugin()
  ],
  devtool: "eval-source-map"
};
