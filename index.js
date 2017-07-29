
const tangler = require('tangler');
const path = require('path');

// for better error reporting
process.on('uncaughtException', (err) => {
    console.log(tangler.transformStack(err.stack));
    process.exit(1);
});

// Tangler calls the `init` entry funciton in lib/server.js
tangler
	.require(path.resolve('lib/server.js'))
	.default();
