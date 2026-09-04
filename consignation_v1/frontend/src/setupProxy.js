const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  // Proxy toutes les requêtes /api vers le backend Spring Boot (localhost:8082)
  // Cela fonctionne même depuis le téléphone via ngrok car le proxy
  // tourne côté serveur (le PC), pas côté client (téléphone)
  app.use(
    '/api',
    createProxyMiddleware({
      target: 'http://localhost:8082',
      changeOrigin: true,
    })
  );
};
