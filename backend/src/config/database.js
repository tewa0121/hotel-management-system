// Backward-compatible alias.
// Many models, routes and controllers still import '../config/database'.
// Re-exporting db.js means the whole app now shares ONE connection pool
// (before, two separate pools were created). This file is removed in Step 2.
module.exports = require('./db');