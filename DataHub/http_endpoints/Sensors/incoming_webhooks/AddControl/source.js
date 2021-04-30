// This function is the webhook's request handler.
exports = function(payload, response) {
    const {DID, CID, Action} = payload.query;

    // Calling a function:
    return context.functions.execute("AddControl", DID, CID, Action);
};