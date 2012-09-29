/**
 * regulated-mongoose
 * mongoose のラッパー実装です。
 */
var mongoose = require('mongoose');

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

    // コンフィグを参照する
    var config  = RegulatedModel.config;
    var modelDB = config[modelName + '.' + target];
    if (modelDB == undefined) {
        modelDB = config[target];
    }

    // 接続済コネクションがあればそれを使用
    db = RegulatedModel.connections[modelDB];
    if (db == undefined) {
        db = mongoose.createConnection(modelDB);
        RegulatedModel.connections[modelDB] = db;
    }

    // モデルを取得
    return db.model(modelName);
}

/**
 * 読込系メソッドをプロキシ
 */
RegulatedModel.prototype.find = function() {
    this.modelForRead.find.apply(modelForRead, arguments);
}
RegulatedModel.prototype.findOne = function() {
    this.modelForRead.findOne.apply(modelForRead, arguments);
}
RegulatedModel.prototype.findById = function() {
    this.modelForRead.findById.apply(modelForRead, arguments);
}
RegulatedModel.prototype.count = function() {
    this.modelForRead.count.apply(modelForRead, arguments);
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
