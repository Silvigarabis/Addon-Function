/**
 * EasyAsync -> async - await for es6
 * author: RGB39 or reallyGoodBaker(github)
 * license: GPL v2
 */

class CompatibleAsyncFunction {
    constructor (func) {
        if (typeof func !== 'function') throw Error('argument 0 should be a function');
        this.parser = new AsyncFuncParser(func.toString());
        this.func = eval(this.parser.parse());
    }

    [Symbol.toStringTag] = 'CompatibleAsyncFunction';

    call(...args) {
        return this.func(...args);
    }

}

class AsyncFuncParser {
    constructor (funcBody) {
        let _fb = /\{([\s\S]*)\}/.exec(funcBody)[1];
        this.func = funcBody.replace(/\{([\s\S]*)\}/, '{return new Promise(rgb_resolve => {$1});}');
        this.funcBody = _fb;
    }

    matches = [];

    static ParseError = class extends Error {
        constructor (msg) {
            super(msg);
            this.name = 'ParseError';
        }
    }

    matchParentheses() {
        let str = this.funcBody;
        let matchCount = 0;

        for (let i = 0; i < str.length; i++) {
            const char = str[i];

            if (char === '(') {
                matchCount++;
                this.matches.push([0,i]);
                continue;
            }

            if (char === ')') {
                matchCount--;
                this.matches.push([1,i]);
                continue;
            }
        }

        if (matchCount) throw AsyncFuncParser.ParseError('Unmatched parentheses');

    }

    getlMatchedIndex(lpIndex) {
        let state = false,
        matchCount = 0,
        stack = this.matches;

        for (let i = 0; i < stack.length; i++) {
            const [type, index] = stack[i];
            if (index == lpIndex) state = true;
            if (state) {

                if (type) {
                    matchCount--;
                    if (!matchCount) return index;
                } else {
                    matchCount++;
                }

            }
        }

    }

    getlMatchedArea(lpIndex) {
        return this.funcBody.slice(lpIndex+1, this.getlMatchedIndex(lpIndex));
    }

    getFollowedExpr(str, startWith) {
        let res = [];
        let regExp = new RegExp(startWith, 'g');
        while (true) {
            let reg = regExp.exec(str);

            if (!reg) return res;
            let i = reg.index;

            let exprs = i + startWith.length;
            let expre = this.getlMatchedIndex(exprs);
            let raw = str.slice(i, expre+1);
            res.push({end:expre, start: i, expr: raw.slice(startWith.length+1,-1), raw});
        }
    }

    getAwaitExpr() {
        return this.getFollowedExpr(this.funcBody, 'await');
    }

    getReturnExpr() {
        return this.getFollowedExpr(this.funcBody, 'return');
    }

    parseReturn() {
        let [returnInfo] = this.getReturnExpr();
        let _fb =  this.funcBody.replace(returnInfo.raw, `rgb_resolve(${returnInfo.expr})`);
        this.func = this.func.replace(this.funcBody, _fb);
        this.funcBody = _fb;
    }

    parseAwait() {
        let awaitInfo = this.getAwaitExpr();
        let _func = this.funcBody;
        awaitInfo.forEach(el => {
           if (el.raw) {
            _func = _func.replace(el.raw, `${el.expr}.then(awaitVal=>{`) + '})';
           }
        });
        this.func = this.func.replace(this.funcBody, _func);
        this.funcBody = _func;
    }

    parse() {
        this.matchParentheses();
        this.parseReturn();
        this.parseAwait();
        this.func = this.func.replace(/async[\s]*?/, '');
        return this.func.trim();
    }

}

/**
 * ???async????????????toAsync???????????????????????????CompatibleAsyncFunction?????????
 * ???????????????????????????????????????????????????CompatibleAsyncFunction??????call??????????????????
 * ????????????????????????????????????????????????????????????????????????CompatibleAsyncFunction???????????????
 * ??????????????????return()??????????????????true??????false?????????????????????????????????bug????????????
 * await????????????awaitVal???????????????????????????
 * @param {function} func 
 * @returns {CompatibleAsyncFunction}
 * @example
 * import toAsync from './easyAsync.js';
 * 
 * const foo = async (str) => {
 *      await(new Promise(res => setTimeout(() => {
 *          res(`Hello ${str}`);
 *      })));
 *      let val = awaitVal;
 *      console.log(val);
 *      return(true);
 * }
 * 
 * toAsync(foo).call('World'); //Hello World
 */
export default function toAsync(func) {
    return new CompatibleAsyncFunction(func);
}