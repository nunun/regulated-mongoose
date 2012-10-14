/**
 * modules/xxx.js で返却されるモジュールに
 * 複数モデルスキーム (mongoose ドキュメント) を
 * 簡単に操作するための関数を拡張するための実装
 */

/**
 * モジュール
 */
var exceptions = require('./exceptions.js');

/**
 * エクスポート
 */
exports = module.exports = extendMultipleMethod;

/**
 * 複数モデルの操作関数を拡張
 */
function extendMultipleMethod() {
    var model    = arguments[0];
    var mongoose = this;
    model.addMultiple = function(list, callback) {
        var added = [];
        extendMultipleMethod.recursive(mongoose, list, added, callback);
    }
    model.addMultipleByRetry = function(list, retryCallback, errorCallback) {
        extendMultipleMethod.retry(mongoose, list, retryCallback, errorCallback, 0);
    }
}

/**
 * 再試行回数
 */
const RETRY_DEFAULT = 3;  //回数指定がない場合の再試行回数
const RETRY_LIMIT   = 10; //これ以上は絶対再試行しない上限回数

/**
 * 再帰的に追加する
 *
 * ■ 注意
 * list が delete されることに注意。
 * もしかしたら extendMultipleMethod.recursive の呼び出し側で
 * list を duplicate する必要があるかもしれないので
 * 各呼び出し箇所を検討する
 */
extendMultipleMethod.recursive = function(mongoose, list, added, callback) {
    var modelName = undefined;
    var modelInfo = undefined;
    for (var key in list) {
        modelName = key;
        modelInfo = list[key];
        delete list[key];
        break;
    }

    // もうとるものがないなら全て成功
    if (modelName == undefined) {
        callback(null, added);
        return;
    }

    // モデルが存在するか確認
    if (!mongoose.models[modelName]) {
        var err = new Error('no model: ' + modelName);
        extendMultipleMethod.rollback(err, added, callback);
        return;
    }

    // 追加
    modelClass = mongoose.model(modelName);
    modelClass.write(function(Class) {
        var newModel = new Class(modelInfo);
        newModel.save(function(err, m) {
            if (!err) {
                added.push(m);
                extendMultipleMethod.recursive(mongoose, list, added, callback);
            } else {
                extendMultipleMethod.rollback(err, added, callback);
            }
        });
    });
}

/**
 * 途中まで生成したものをロールバックし
 * 失敗としてコールバック
 */
//extendMultipleMethod.rollback = function(err, added, callback) {
//    added.forEach(function(item) {
//        console.log('rollback: ' + item);
//        item.remove();
//    });
//    callback(err);
//}
extendMultipleMethod.rollback = function(err, added, callback) {
    var item = added.shift();
    if (item === undefined) {
        callback(err, added);
        return;
    }
    console.log('rollback: ' + item);
    item.remove(function() {
        extendMultipleMethod.rollback(err, added, callback);
    });
}

/**
 * 再試行保存
 */
extendMultipleMethod.retry = function(mongoose, list, retryCallback, errorCallback, retryCount) {
    retryCallback(list, retryCount);
    var added = [];
    var duped = [];
    for (var key in list) {
        duped[key] = list[key];
    }
    extendMultipleMethod.recursive(mongoose, duped, added, function(err, added) {
        // 再試行回数が上限に達したかどうか
        if (retryCount >= RETRY_LIMIT) {
            throw new exceptions.ExtendedModelRetryLimitExceeded(list);
        }

        // 再帰継続判定
        var result = errorCallback(err, added, retryCount);
        var type   = typeof(result);
        var cont   = false;
        if (type == 'boolean') {
            cont = result;
        } else if (type == 'number') {
            if (retryCount >= result) {
                throw new exceptions.ExtendedModelRetryExceeded(list);
            }
            cont = true;
        } else {
            if (retryCount >= RETRY_DEFAULT) {
                throw new exceptions.ExtendedModelRetryExceeded(list);
            }
            cont = true;
        }

        // 再帰継続
        if (err && cont) {
            extendMultipleMethod.retry(mongoose, list, retryCallback, errorCallback, retryCount + 1);
        }
    });
}
