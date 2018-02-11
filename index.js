'use strict';

if (process.env.NODE_ENV === 'production') {
  module.exports = require('./cjs/react-joi-validation.production.min.js');
} else {
  module.exports = require('./cjs/react-joi-validation.development.js');
}
