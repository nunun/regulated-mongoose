/**
 * extended-model
 * mongoose.model の真に拡張した実装です。
 */
var mongoose   = require('mongoose');
var exceptions = require('./exceptions');

/**
 * エクスポート
 */
exports = module.exports = ExtendedModel;

/**
 * コンストラクタ
 */
function ExtendedModel(model) {
    this.__proto__.__proto__ = model;
    this.__super__ = model;
}

/**
 * リトライセーブ
 *
 * 例)
 * var mongoose = require('regulated-mongoose');
 * var randomstring = require('randomstring');
 * User = mongoose.model('User');
 *
 * // モデルの書き込みを開始
 * User.write(function(model) {
 *     var user = new model();
 *
 *     // セーブを実行
 *     user.retrySave(function(retryCount) {
 *         user.uuid = randomstring.generate(8);
 *         return function(err) {
 *             if (!err) {
 *                 model.find({}, function(err, docs) {
 *                     console.log(docs);
 *                 });
 *             }
 *
 *             // 次の再試行をどうするか指定します
 *             // 数値を返すと、指定回数以上で例外となります
 *             return 5;
 *
 *             // 例外にしない場合は次のように書きます
 *             // boolean は false になりません
 *             //return (retryCount < 5)? true : false;
 *         }
 *     });
 * });
 */
const MAX_RETRY = 5;
ExtendedModel.prototype.retrySave = function(retryCallback) {
    this.retrySaveRecursive(this, retryCallback, 0);
}
ExtendedModel.prototype.retrySaveRecursive = function(model, retryCallback, retryCount) {
    var result = retryCallback(retryCount);
    var type   = typeof result;

    // 保存する
    model.save(function(err) {
        // 関数が指定された場合
        // 結果で次の試行の動きを変える
        if (type == 'function') {
            result = result(err, retryCount);
            type   = typeof result;
        }

        // エラーであればリトライする
        if (err) {
            // 次の試行を選択する
            // typeof function : 関数の結果を再試行選択に用いる
            // typeof boolean  : false の場合再試行しない.
            // other           : 規定数以上再試行で例外
            if (type == 'boolean') {
                if (result === false) {
                    return;
                }
            } else if (type == 'number') {
                if (retryCount >= result) {
                    throw new exceptions.ExtendedModelMaxRetryExceeded(model);
                }
            } else {
                if (retryCount >= MAX_RETRY) {
                    throw new exceptions.ExtendedModelMaxRetryExceeded(model);
                }
            }

            model.retrySaveRecursive(model, retryCallback, retryCount + 1);
        }
    });
}
