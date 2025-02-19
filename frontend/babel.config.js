module.exports = {
  presets: [
    [
      "@babel/preset-env",
      {
        targets: "> 0.25%, not dead", // Suporta navegadores modernos
        useBuiltIns: "usage",
        corejs: 3,
      },
    ],
  ],
};
