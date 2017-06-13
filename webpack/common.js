// const webpack = require('webpack');
const path = require('path');

module.exports = {
  context: path.resolve(__dirname, '..'),

  entry: {
    main: path.resolve(__dirname, '..', 'client/index.js')
  },

  resolve: {
    modules: [
      "node_modules",
      path.resolve(__dirname, '..', 'client')
    ],
    extensions: ['.js', '.jsx', '.json']
  },

  module: {
    rules: [
      {
        test: /\.js?$/,
        include: [
          path.resolve(__dirname, "..", "client")
        ],
        use: [
          {
            loader: 'babel-loader',
            options: {
              babelrc: false,
              presets: [
                'es2015',
                'react'
              ]
            }
          }
        ]
      }
    ]
  },

  devtool: 'source-map'  
}