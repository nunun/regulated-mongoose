/**
 * regulated-mongoose
 * mongoose �Υ�åѡ������Ǥ���
 */
var mongoose = require('mongoose');

/**
 * �������ݡ���
 */
exports = module.exports = RegulatedModel;

/**
 * ���󥹥ȥ饯��
 */
function RegulatedModel(modelName) {
    //this.__proto__.__proto__ = ...;
    //this.__super__ = ...;

    this.modelName     = modelName;
    this.modelForRead  = this.obtainModel(modelName, 'r');
    this.modelForWrite = undefined;
}

/**
 * ����
 */
RegulatedModel.config = {};
RegulatedModel.configure = function(config) {
    RegulatedModel.config = config;
}

/**
 * ���ͥ������
 */
RegulatedModel.connections = {};

/**
 * ��ǥ�γ���
 */
RegulatedModel.prototype.obtainModel = function(modelName, mode) {
    // �������å�̾�����
    var target = undefined;
    if (mode == 'r') {
        target = 'read';
    } else if (mode == 'w') {
        target = 'write';
    } else {
        console.log('unsupported mode \'%s\'.', mode);
        process.exit(1);
    }

    // ����ե����򻲾Ȥ���
    var config  = RegulatedModel.config;
    var modelDB = config[modelName + '.' + target];
    if (modelDB == undefined) {
        modelDB = config[target];
    }

    // ��³�ѥ��ͥ�����󤬤���Ф�������
    db = RegulatedModel.connections[modelDB];
    if (db == undefined) {
        db = mongoose.createConnection(modelDB);
        RegulatedModel.connections[modelDB] = db;
    }

    // ��ǥ�����
    return db.model(modelName);
}

/**
 * �ɹ��ϥ᥽�åɤ�ץ���
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
 * �񤭹��ߤ� wirte �᥽�åɤ��ͳ������
 */
RegulatedModel.prototype.write = function(callback) {
    if (this.modelForWrite == undefined) {
        this.modelForWrite = this.obtainModel(this.modelName, 'w');
    }
    return callback(this.modelForWrite);
}
