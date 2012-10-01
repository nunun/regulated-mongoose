/**
 * extended-model
 * mongoose.model �ο��˳�ĥ���������Ǥ���
 */
var mongoose   = require('mongoose');
var exceptions = require('./exceptions');

/**
 * �������ݡ���
 */
exports = module.exports = ExtendedModel;

/**
 * ���󥹥ȥ饯��
 */
function ExtendedModel(model) {
    this.__proto__.__proto__ = model;
    this.__super__ = model;
}

/**
 * ��ȥ饤������
 *
 * ��)
 * var mongoose = require('regulated-mongoose');
 * var randomstring = require('randomstring');
 * User = mongoose.model('User');
 *
 * // ��ǥ�ν񤭹��ߤ򳫻�
 * User.write(function(model) {
 *     var user = new model();
 *
 *     // �����֤�¹�
 *     user.retrySave(function(retryCount) {
 *         user.uuid = randomstring.generate(8);
 *         return function(err) {
 *             if (!err) {
 *                 model.find({}, function(err, docs) {
 *                     console.log(docs);
 *                 });
 *             }
 *
 *             // ���κƻ�Ԥ�ɤ����뤫���ꤷ�ޤ�
 *             // ���ͤ��֤��ȡ��������ʾ���㳰�Ȥʤ�ޤ�
 *             return 5;
 *
 *             // �㳰�ˤ��ʤ����ϼ��Τ褦�˽񤭤ޤ�
 *             // boolean �� false �ˤʤ�ޤ���
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

    // ��¸����
    model.save(function(err) {
        // �ؿ������ꤵ�줿���
        // ��̤Ǽ��λ�Ԥ�ư�����Ѥ���
        if (type == 'function') {
            result = result(err, retryCount);
            type   = typeof result;
        }

        // ���顼�Ǥ���Х�ȥ饤����
        if (err) {
            // ���λ�Ԥ����򤹤�
            // typeof function : �ؿ��η�̤�ƻ��������Ѥ���
            // typeof boolean  : false �ξ��ƻ�Ԥ��ʤ�.
            // other           : ������ʾ�ƻ�Ԥ��㳰
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
