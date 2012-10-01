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
 * 制約検証例外
 */
Exceptions.prototype.ExtendedModelMaxRetryExceeded = function(errors) {
    this.name        = 'ExtendedModelMaxRetryExceeded';
    this.message     = JSON.stringify(errors);
    this.errors      = errors;
}
Exceptions.prototype.ExtendedModelMaxRetryExceeded.prototype = Error.prototype;
