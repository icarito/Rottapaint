const appJson = require('./app.json');

const baseUrl = process.env.EXPO_PUBLIC_BASE_URL;

module.exports = () => {
  const config = { ...appJson.expo };

  if (baseUrl) {
    config.experiments = {
      ...config.experiments,
      baseUrl,
    };
  }

  return config;
};
