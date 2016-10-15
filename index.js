exports.handler = function (event, context, callback) {
    callback(null, JSON.stringify({event: event, context: context}));
};
