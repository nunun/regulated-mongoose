/**
 * modules/xxx.js で返却されるモジュールに
 * モデルスキーム (mongoose ドキュメント) を
 * 簡単に操作するための関数を拡張するための実装
 */

/**
 * モジュール
 */
var exceptions = require('./exceptions.js');

/**
 * エクスポート
 */
exports = module.exports = extendModelMethod;

/**
 * モデルの操作関数を拡張
 */
function extendModelMethod() {
    var model      = arguments[0];
    var modelName  = arguments[1];
    var modelClass = this.model(modelName);
    var i;

    // 指定された機能を全て拡張
    for (i = 2; i < arguments.length; i++) {
        var extendName = arguments[i];
        extendModelMethod[extendName](model, modelName, modelClass);
    }
}

/**
 * 定数
 */
const MAX_RETRY = 5;

/**
 * getXxxInfo(), getXxxList() を拡張
 */
extendModelMethod.get = function(model, modelName, modelClass) {
    var methodName = undefined;

    methodName = 'get' + modelName + 'Info';
    model[methodName] = function() {
        modelClass.findOne.apply(modelClass, arguments);
    }

    methodName = 'get' + modelName + 'List';
    model[methodName] = function() {
        modelClass.find.apply(modelClass, arguments);
    }
}

/**
 * addXxxInfo(), addXxxInfoByRetry() を拡張
 */
extendModelMethod.add = function(model, modelName, modelClass) {
    var methodName = undefined;

    methodName = 'add' + modelName + 'Info';
    model[methodName] = function(info, callback) {
        modelClass.write(function(Class) {
            newModel = new Class(info);
            newModel.save(callback);
        });
    }

    // 例)
    // var authModel = require('./models/auth.js');
    // authModel.addAutoLoginInfoByRetry({
    //     auto_login_id: null
    // }, function(model, retryCount) {
    //     model.auto_login_id = '11';
    // }, function(err) {
    //     if (!err) {
    //         authModel.getAutoLoginList({}, function(err, docs) {
    //             console.log(docs);
    //         });
    //     }
    // });
    methodName = 'add' + modelName + 'InfoByRetry';
    model[methodName] = function(info, retryCallback, errorCallback) {
        modelClass.write(function(Class) {
            newModel = new Class(info);
            extendModelMethod.add.retry(newModel, retryCallback, errorCallback, 0);
        });
    }
}

extendModelMethod.add.retry = function(newModel, retryCallback, errorCallback, retryCount) {
    retryCallback(newModel, retryCount);
    newModel.save(function(err) {
        var result = errorCallback(err, newModel, retryCount);
        var type   = typeof(result);
        var cont   = false;

        // 再帰継続判定
        if (type == 'boolean') {
            cont = result;
        } else if (type == 'number') {
            if (retryCount >= result) {
                throw new exceptions.ExtendedModelMaxRetryExceeded(newModel);
            }
            cont = true;
        } else {
            if (retryCount >= MAX_RETRY) {
                throw new exceptions.ExtendedModelMaxRetryExceeded(newModel);
            }
            cont = true;
        }

        // 再帰継続
        if (err && cont) {
            extendModelMethod.add.retry(newModel, retryCallback, errorCallback, retryCount + 1);
        }
    });
}

/**
 * updateXxxInfo(), updateXxxInfoByRetry() を拡張
 */
extendModelMethod.update = function(model, modelName, modelClass) {
    var methodName = undefined;

    methodName = 'update' + modelName + 'Info';
    model[methodName] = function() {
        writeArguments = arguments;
        modelClass.write(function(Class) {
            Class.update.apply(Class, writeArguments);
        });
    }

    methodName = 'update' + modelName + 'InfoByRetry';
    model[methodName] = function(cond, info, retryCallback, errorCallback) {
        writeArguments = arguments;
        modelClass.write(function(Class) {
            extendModelMethod.update.retry(Class, cond, info, retryCallback, errorCallback, 0);
        });
    }
}

extendModelMethod.update.retry = function(Class, cond, info, retryCallback, errorCallback, retryCount) {
    retryCallback(info, retryCount);
    Class.update(cond, info, function(err) {
        var result = errorCallback(err, info, retryCount);
        var type   = typeof(result);
        var cont   = false;

        // 再帰継続判定
        if (type == 'boolean') {
            cont = result;
        } else if (type == 'number') {
            if (retryCount >= result) {
                throw new exceptions.ExtendedModelMaxRetryExceeded(info);
            }
            cont = true;
        } else {
            if (retryCount >= MAX_RETRY) {
                throw new exceptions.ExtendedModelMaxRetryExceeded(info);
            }
            cont = true;
        }

        // 再帰継続
        if (err && cont) {
            extendModelMethod.update.retry(Class, cond, info, retryCallback, errorCallback, retryCount + 1);
        }
    });
}

/**
 * deleteXxxInfo() を拡張
 */
extendModelMethod.delete = function(model, modelName, modelClass) {
    var methodName = 'delete' + modelName + 'Info';
    model[methodName] = function() {
        writeArguments = arguments;
        modelClass.write(function(Class) {
            Class.remove.apply(Class, writeArguments);
        });
    }
}
