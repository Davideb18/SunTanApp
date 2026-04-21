module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        "babel-preset-expo",
        {
          jsxImportSource: "nativewind",
          reanimated: false, // Disabilita il plugin interno di Expo per evitare duplicati con NativeWind v4
        },
      ],
      "nativewind/babel",
    ],
  };
};
