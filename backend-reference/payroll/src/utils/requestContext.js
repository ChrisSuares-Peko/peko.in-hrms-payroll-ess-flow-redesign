const { AsyncLocalStorage } = require('async_hooks');

const store = new AsyncLocalStorage();

exports.runWithContext = (ctx, fn) => store.run(ctx, fn);
exports.getRequestContext = () => store.getStore();
