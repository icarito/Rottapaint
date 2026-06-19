// Carga app.json y permite inyectar configuración específica del entorno.
//
// Para GitHub Pages la app se sirve bajo un subpath (p. ej. /Rottapaint/),
// así que exponemos EXPO_PUBLIC_BASE_URL para fijar experiments.baseUrl solo
// en CI. En local (dev) la variable no existe y se sirve desde la raíz "/".
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
