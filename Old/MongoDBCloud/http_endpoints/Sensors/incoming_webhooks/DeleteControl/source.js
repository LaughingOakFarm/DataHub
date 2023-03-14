// This function is the webhook's request handler.
exports = function(payload, response) {
    // Query params, e.g. '?arg1=hello&arg2=world' => {arg1: "hello", arg2: "world"}
    const {DID, CID, Action} = payload.query;

    // Calling a function:
    return context.functions.execute("DeleteControl", DID, CID, Action);
};