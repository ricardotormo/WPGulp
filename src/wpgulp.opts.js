
const opts = {
  // Project options.
  projectURL: 'LOCAL_PROJECT_URL', // Local project URL of your already running WordPress site. Could be something like wpgulp.local or localhost:3000 depending upon your local WordPress setup.
  productURL: './', // Theme/Plugin URL. Leave it like it is, since our gulpfile.js lives in the root folder.
  browserAutoOpen: true,
  port: 8000,
  injectChanges: true
}

module.exports = opts;
