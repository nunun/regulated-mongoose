/**
 * exceptions
 * このモジュールで使われる例外一覧
 */

/**
 * エクスポート
 */
exports = module.exports = new Exceptions();

/**
 * コンストラクタ
 */
function Exceptions() {
}

/**
 * 再試行回数到達例外
 */
Exceptions.prototype.ExtendedModelRetryExceeded = function(errors) {
    this.name        = 'ExtendedModelRetryExceeded';
    this.message     = JSON.stringify(errors);
    this.errors      = errors;
}
Exceptions.prototype.ExtendedModelRetryExceeded.prototype = Error.prototype;

/**
 * 再試行上限回数到達例外
 */
Exceptions.prototype.ExtendedModelRetryLimitExceeded = function(errors) {
    this.name        = 'ExtendedModelRetryLimitExceeded';
    this.message     = JSON.stringify(errors);
    this.errors      = errors;
}
Exceptions.prototype.ExtendedModelRetryLimitExceeded.prototype = Error.prototype;

