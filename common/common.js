function GunsmithError(message, extra) {

    this.name = this.constructor.name;
    this.message = message;
    this.extra = extra;
    Error.captureStackTrace(this, this.constructor);
}

require('util').inherits(GunsmithError, Error);

module.exports = {
    GunsmithError
};