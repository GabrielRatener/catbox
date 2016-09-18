
const tangler = require('tangler');
const path = require('path');

// for better error reporting
process.on('uncaughtException', (err) => {
    console.log(tangler.transformStack(err.stack));
    process.exit(1);
});

tangler.run(path.resolve('lib/server.js'));
