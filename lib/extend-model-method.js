/**
 * modules/xxx.js で返却されるモジュールに
 * モデルスキーム (mongoose ドキュメント) を
 * 簡単に操作するための関数を拡張するための実装
 */

/**
 * モジュール
 */
var util       = require('util');
var exceptions = require('./exceptions.js');

/**
 * エクスポート
 */
exports = module.exports = extendModelMethod;

/**
 * モデルの操作関数を拡張
 */
function extendModelMethod() {
    var model               = arguments[0];
    var modelName           = arguments[1];
    var modelClass          = this.model(modelName);
    var inspectionCallbacks = undefined;
    var startIndex          = 2;
    var i;

    // adminCallback を指定
    if (util.isArray(arguments[2])) {
        inspectionCallbacks = arguments[2];
        startIndex          = 3;
    } else if (typeof arguments[2] == 'function') {
        inspectionCallbacks = [arguments[2]];
        startIndex          = 3;
    }

    // 指定された機能を全て拡張
    for (i = startIndex; i < arguments.length; i++) {
        var extendName = arguments[i];
        extendModelMethod[extendName](model, modelName, modelClass, inspectionCallbacks);
    }
}

/**
 * 定数
 */
const RETRY_DEFAULT = 3;  //回数指定がない場合の再試行回数
const RETRY_LIMIT   = 10; //これ以上は絶対再試行しない上限回数

/**
 * getXxxInfo(), getXxxList() を拡張
 */
extendModelMethod.get = function(model, modelName, modelClass, inspectionCallbacks) {
    var adminMethodName = undefined;
    var methodName      = undefined;

    adminMethodName = 'adminGet' + modelName + 'Info';
    methodName      = 'get'      + modelName + 'Info';
    model[adminMethodName] = function() {
        modelClass.findOne.apply(modelClass, arguments);
    }
    model[methodName] = adminMethodWrapper(methodName, model[adminMethodName], inspectionCallbacks);

    adminMethodName = 'adminGet' + modelName + 'List';
    methodName      = 'get'      + modelName + 'List';
    model[adminMethodName] = function() {
        modelClass.find.apply(modelClass, arguments);
    }
    model[methodName] = adminMethodWrapper(methodName, model[adminMethodName], inspectionCallbacks);

    adminMethodName = 'adminCount' + modelName + 'List';
    methodName      = 'count'      + modelName + 'List';
    model[adminMethodName] = function() {
        modelClass.count.apply(modelClass, arguments);
    }
    model[methodName] = adminMethodWrapper(methodName, model[adminMethodName], inspectionCallbacks);
}

/**
 * addXxxInfo(), addXxxInfoByRetry() を拡張
 */
extendModelMethod.add = function(model, modelName, modelClass, inspectionCallbacks) {
    var adminMethodName = undefined;
    var methodName      = undefined;

    adminMethodName = 'adminAdd' + modelName + 'Info';
    methodName      = 'add'      + modelName + 'Info';
    model[adminMethodName] = function(info, callback) {
        modelClass.write(function(Class) {
            newModel = new Class(info);
            newModel.save(callback);
        });
    }
    model[methodName] = adminMethodWrapper(methodName, model[adminMethodName], inspectionCallbacks);

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
    adminMethodName = 'adminAdd' + modelName + 'InfoByRetry';
    methodName      = 'add'      + modelName + 'InfoByRetry';
    model[adminMethodName] = function(info, retryCallback, errorCallback) {
        modelClass.write(function(Class) {
            newModel = new Class(info);
            extendModelMethod.add.retry(newModel, retryCallback, errorCallback, 0);
        });
    }
    model[methodName] = adminMethodWrapper(methodName, model[adminMethodName], inspectionCallbacks);
}

extendModelMethod.add.retry = function(newModel, retryCallback, errorCallback, retryCount) {
    retryCallback(newModel, retryCount);
    newModel.save(function(err) {
        // 再試行回数が上限に達したかどうか
        if (retryCount >= RETRY_LIMIT) {
            throw new exceptions.ExtendedModelRetryLimitExceeded(list);
        }

        // 再帰継続判定
        var result = errorCallback(err, newModel, retryCount);
        var type   = typeof(result);
        var cont   = false;
        if (type == 'boolean') {
            cont = result;
        } else if (type == 'number') {
            if (retryCount >= result) {
                throw new exceptions.ExtendedModelRetryExceeded(newModel);
            }
            cont = true;
        } else {
            if (retryCount >= RETRY_DEFAULT) {
                throw new exceptions.ExtendedModelRetryExceeded(newModel);
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
extendModelMethod.update = function(model, modelName, modelClass, inspectionCallbacks) {
    var adminMethodName = undefined;
    var methodName      = undefined;

    adminMethodName = 'adminUpdate' + modelName + 'Info';
    methodName      = 'update'      + modelName + 'Info';
    model[adminMethodName] = function() {
        writeArguments = arguments;
        modelClass.write(function(Class) {
            Class.update.apply(Class, writeArguments);
        });
    }
    model[methodName] = adminMethodWrapper(methodName, model[adminMethodName], inspectionCallbacks);

    adminMethodName = 'adminUpdate' + modelName + 'InfoByRetry';
    methodName      = 'update'      + modelName + 'InfoByRetry';
    model[adminMethodName] = function(cond, info, retryCallback, errorCallback) {
        writeArguments = arguments;
        modelClass.write(function(Class) {
            extendModelMethod.update.retry(Class, cond, info, retryCallback, errorCallback, 0);
        });
    }
    model[methodName] = adminMethodWrapper(methodName, model[adminMethodName], inspectionCallbacks);
}

extendModelMethod.update.retry = function(Class, cond, info, retryCallback, errorCallback, retryCount) {
    retryCallback(info, retryCount);
    Class.update(cond, info, function(err) {
        // 再試行回数が上限に達したかどうか
        if (retryCount >= RETRY_LIMIT) {
            throw new exceptions.ExtendedModelRetryLimitExceeded(list);
        }

        // 再帰継続判定
        var result = errorCallback(err, info, retryCount);
        var type   = typeof(result);
        var cont   = false;
        if (type == 'boolean') {
            cont = result;
        } else if (type == 'number') {
            if (retryCount >= result) {
                throw new exceptions.ExtendedModelRetryExceeded(info);
            }
            cont = true;
        } else {
            if (retryCount >= RETRY_DEFAULT) {
                throw new exceptions.ExtendedModelRetryExceeded(info);
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
extendModelMethod.delete = function(model, modelName, modelClass, inspectionCallbacks) {
    var adminMethodName = 'adminDelete' + modelName + 'Info';
    var methodName      = 'delete'      + modelName + 'Info';
    model[adminMethodName] = function() {
        writeArguments = arguments;
        modelClass.write(function(Class) {
            Class.remove.apply(Class, writeArguments);
        });
    }
    model[methodName] = adminMethodWrapper(methodName, model[adminMethodName], inspectionCallbacks);
}

////////////////////////////////////////////////////////////////////////////////

/**
 * 管理用関数のラッパー関数を生成する
 */
function adminMethodWrapper(methodName, adminMethod, inspectionCallbacks) {
    return function() {
        var thisArguments = arguments;
        var count = 0;
        function next() {
            adminMethod.apply(null, thisArguments);
        }
        function _next() {
            var callback = inspectionCallbacks[count++];
            if (!callback) {
                next();
                return;
            }
            callback(_next, methodName, thisArguments);
        }
        if (inspectionCallbacks) {
            _next();
        } else {
            next();
        }
    }
}
