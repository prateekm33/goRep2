const webpack = require('webpack');
const webpackMerge = require("webpack-merge");
const path = require('path');


const plugins = []

if (process.env.NODE_ENV === 'production'){
  plugins.push(new webpack.optimize.UglifyJsPlugin({
    compress : {
      warnings: false,
      drop_console: true,
      unused: false
    }
  }))
}

module.exports = webpackMerge(require("./common.js"), {
  output: {
    path: path.resolve(__dirname, "..", "client", "dist"),
    filename: "[name].bundle.js"
  },

  plugins
});