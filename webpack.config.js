const path = require("path");

module.exports = {
  entry: ['regenerator-runtime/runtime','./front-end/main.js'],
  output: {
    path: path.join(__dirname, "/dist"),
    filename: "index_bundle.js"
  },
  mode:"development",
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader"
        },
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      }
    ]
  }
};