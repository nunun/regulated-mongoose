/**
 * here
 * ヒアドキュメントを記述するために必要なツールセットを
 * 提供します。
 *
 * ヒアドキュメントの抽出処理は以下を参考にしています
 * https://github.com/cho45/node-here.js
 */
var fs = require('fs');

/**
 * エクスポート
 */
exports = module.exports = new Here();

/**
 * コンストラクタ
 */
function Here() {
}

/**
 * スタックフーレムの取得
 */
Here.prototype.stack = function(n) {
    var orig = Error.prepareStackTrace;
    Error.prepareStackTrace = function (error, stack) {
        return stack
    };
    var ret = new Error().stack;
    Error.prepareStackTrace = orig;
    return ret.slice(2 + ((!n)? 0 : n));
}

/**
 * スタックフレームからヒアドキュメントを抽出
 */
Here.prototype.readout = function(frame) {
    var body  = fs.readFileSync(frame.getFileName(), 'utf-8');
    var lines = body.split(/\n/);
    var pos   = frame.getColumnNumber() - 1;
    var len   = frame.getLineNumber() - 1;

    // ヒアドキュメントの位置を特定
    for (var i = 0; i < len; i++) {
        pos += lines[i].length + 1;
    }

    // ヒアドキュメント抜き出し
    var paren = body.indexOf(')', pos);
    var start = body.indexOf('/*', pos);
    var end   = body.indexOf('*/', pos);
    if (paren < start || start == -1 || end == -1) {
        body = '';
    } else {
        body = body.slice(start + 3, end - 1);
        if (arguments[0] !== '') {
            body = body.replace(/\\(.)/g, '$1');
        }
    }

    // 結果文字列 (最初と最後空行を削除)
    var ret = new String(body); // no warnings
    ret = ret.valueOf()
    ret = ret.replace(/^\s*\n/, '');
    ret = ret.replace(/\n\s*$/, '');

    // インデントを詰める
    var lines  = ret.split(/\n/);
    var indent = lines[0].match(/^\s*/);
    for (var i = 0, len = lines.length; i < len; i++) {
        lines[i] = lines[i].replace(new RegExp('^' + indent, 'g'), '');
    }
    return lines.join('\n');
}
