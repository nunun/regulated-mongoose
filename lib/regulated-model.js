/**
 * regulated-model
 * mongoose.model が返すモデルのラッパー実装です。
 */
var mongoose      = require('mongoose');
var ExtendedModel = require('./extended-model.js');

/**
 * エクスポート
 */
exports = module.exports = RegulatedModel;

/**
 * コンストラクタ
 */
function RegulatedModel(modelName) {
    //this.__proto__.__proto__ = ...;
    //this.__super__ = ...;

    this.modelName     = modelName;
    this.modelForRead  = this.obtainModel(modelName, 'r');
    this.modelForWrite = undefined;
}

/**
 * 設定
 */
RegulatedModel.config = {};
RegulatedModel.configure = function(config) {
    RegulatedModel.config = config;
}

/**
 * コネクション
 */
RegulatedModel.connections = {};
RegulatedModel.models      = {};

/**
 * モデルの獲得
 */
RegulatedModel.prototype.obtainModel = function(modelName, mode) {
    // ターゲット名を確定
    var target = undefined;
    if (mode == 'r') {
        target = 'read';
    } else if (mode == 'w') {
        target = 'write';
    } else {
        console.log('unsupported mode \'%s\'.', mode);
        process.exit(1);
    }

    // モデルのターゲット名
    var modelTarget = modelName + '.' + target;

    // 取得済モデルがあればそれを使用
    // なければ取得する
    var model = RegulatedModel.models[modelTarget];
    if (model === undefined) {

        // コンフィグを参照する
        var config = RegulatedModel.config;
        var modelConfig = config[modelTarget];
        if (modelConfig == undefined) {
            modelConfig = config[target];
        }

        // 接続済コネクションがあればそれを使用
        var db = RegulatedModel.connections[modelConfig];
        if (db == undefined) {
            db = mongoose.createConnection(modelConfig);
            RegulatedModel.connections[modelConfig] = db;
        }

        // モデルのクラス定義を生成
        // TODO 継承を手動でやらずにライブラリを使用すると
        //      うまくかけるかもしれないので調査して直す
        //      (ExtendedModel の定義も見直すこと)
        var modelBase = db.model(modelName);
        function modelNew() {
            modelBase.apply(this, arguments);
        }
        modelNew.__proto__           = modelBase;
        modelNew.prototype.__proto__ = new ExtendedModel(modelBase.prototype);
        RegulatedModel.models[modelTarget] = modelNew;
        model = modelNew;
    }

    // モデルを返却
    return model;
}

/**
 * 読み込みメソッドをプロキシ
 */
RegulatedModel.prototype.find = function() {
    this.modelForRead.find.apply(this.modelForRead, arguments);
}
RegulatedModel.prototype.findOne = function() {
    this.modelForRead.findOne.apply(this.modelForRead, arguments);
}
RegulatedModel.prototype.findById = function() {
    this.modelForRead.findById.apply(this.modelForRead, arguments);
}
RegulatedModel.prototype.count = function() {
    this.modelForRead.count.apply(this.modelForRead, arguments);
}

/**
 * 書き込みは wirte メソッドを経由させる
 */
RegulatedModel.prototype.write = function(callback) {
    if (this.modelForWrite == undefined) {
        this.modelForWrite = this.obtainModel(this.modelName, 'w');
    }
    return callback(this.modelForWrite);
}
