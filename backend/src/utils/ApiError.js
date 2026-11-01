// An error that knows which HTTP status it should become.
// Throw it anywhere (even inside a database transaction): the transaction is
// rolled back and the controller turns it into a clean JSON response.
class ApiError extends Error {
    constructor(statusCode, message, errors = null) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.errors = errors;
    }
}

module.exports = ApiError;