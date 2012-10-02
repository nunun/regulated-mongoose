/**
 * modules/xxx.js で返却されるモジュールに
 * モデルスキーム (mongoose ドキュメント) を
 * 簡単に操作するための関数を拡張するための実装
 */

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
            m = new Class(info);
            m.save(function(err) {
                return callback.apply(null, arguments);
            });
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
            m = new Class(info);
            m.retrySave(function(retryCount) {
                retryCallback(m, retryCount);
                return errorCallback;
            });
        });
    }
}

/**
 * updateXxxInfo() を拡張
 */
extendModelMethod.update = function(model, modelName, modelClass) {
    var methodName = 'update' + modelName + 'Info';
    model[methodName] = function(cond, info, callback) {
        modelClass.write(function(Class) {
            Class.update(cond, info, function() {
                return callback.apply(null, arguments);
            });
        });
    }
}

/**
 * deleteXxxInfo() を拡張
 */
extendModelMethod.delete = function(model, modelName, modelClass) {
    var methodName = 'delete' + modelName + 'Info';
    model[methodName] = function(cond, callback) {
        modelClass.write(function(Class) {
            Class.remove(cond, function() {
                return callback.apply(null, arguments);
            });
        });
    }
}

