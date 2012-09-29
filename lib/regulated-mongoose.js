/**
 * regulated-mongoose
 * mongoose のラッパー実装です。
 */
var mongoose       = require('mongoose');
var RegulatedModel = require('./regulated-model.js');
var here           = require('./here.js');

/**
 * エクスポート
 */
exports = module.exports = new RegulatedMongoose(mongoose);

/**
 * コンストラクタ
 */
function RegulatedMongoose(mongoose) {
    this.__proto__.__proto__ = mongoose;
    this.__super__ = mongoose;

    this._descDocs    = {};
    this._descSection = {};
    this._desc        = {};

    this._models = {};
}

/**
 * 設定
 */
RegulatedMongoose.prototype.config = {};
RegulatedMongoose.prototype.configure = function(config) {
    this.config = config;
    RegulatedModel.configure(config.model);
}

/**
 * 定数: 未定義のセクション名
 */
const UNDEFINED_SECTION = '-';

/**
 * ドキュメント結果取得
 * - セクションに記録された説明を全て取得します。
 *   section を指定しない場合は未定義のセクションを
 *   取得します。
 */
RegulatedMongoose.prototype.descDocs = function(section) {
    s = UNDEFINED_SECTION;
    if (section !== undefined) {
        s = section;
    }
    return this._descDocs[s];
}

/**
 * 説明のセクション名を記述する
 * 第一引数、またはヒアドキュメントで記述
 * - 説明が指定したセクションに記録されるようになります。
 *   指定するまでは未定義のセクションに記録されます。
 */
RegulatedMongoose.prototype.descSection = function() {
    if (arguments.length > 0) {
        this._descSection = arguments[0];
    } else {
        this._descSection = here.readout(here.stack()[0]);
    }
}

/**
 * 説明を記述する
 * 第一引数、またはヒアドキュメントで記述
 * - get, post, param が呼び出されると、
 *   直前の説明が指定したセクションに記録されます。
 */
RegulatedMongoose.prototype.desc = function() {
    if (arguments.length > 0) {
        this._desc = arguments[0];
    } else {
        this._desc = here.readout(here.stack()[0]);
    }
}

/**
 * ドキュメントに追記
 * 保存した desc を descDocs に追加
 */
RegulatedMongoose.prototype.description = function(kind, name, tree) {
    var s = UNDEFINED_SECTION;
    if (this._descSection !== undefined) {
         s = this._descSection;
    }
    if (this._descDocs[s] === undefined) {
        this._descDocs[s] = new Array();
    }
    this._descDocs[s].push({
        kind: kind,
        name: name,
        desc: this._desc,
        tree: tree
    });
    this._desc = undefined;
}

/**
 * model をフック
 * 記録した説明をドキュメントに追加する
 */
RegulatedMongoose.prototype.model = function() {
    // 第二引数が指定された場合、モデル定義である
    // これはドキュメントに記録する
    if (arguments[1] !== undefined) {
        this.description('model-schema', arguments[0], arguments[1].tree);
        return this.__super__.model.apply(this, arguments);
    }

    // 第二引数が指定され *ない* 場合、モデル取得である
    // カスタマイズした新しいモデル定義を返す
    var modelName = arguments[0];
    var model = this._models[modelName];
    if (model === undefined) {
        model = new RegulatedModel(modelName);
        this._models[modelName] = model;
    }
    return model;
}

