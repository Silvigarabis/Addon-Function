
/* Copyright (C) 2021 reallyGoodBaker(Github)
This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; version 2.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program; if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA. */

var __export = {};

export class EventEmitter {
    events = {};
    on(type, handler) {
        !this.events[type]? (this.events[type] = [handler]) : this.events[type].push(handler);
    }
    off(type, handler) {
        if (!handler) return this.events[type] = null;
        this.events[type] && this.events[type].forEach((el, i) => {
            if (el == handler) this.events[type][i] = null;
        });
    }
    emit(type,...args) {
        this.events[type] && this.events[type].forEach(handler => handler.apply(handler, args));
    }
}

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
export function toAsync(func) {
    return new CompatibleAsyncFunction(func);
}

/**
 * FORMATTINGS
 * Copyright (C) 2021 3208536020(QQ)
 */
export const FORMATTINGS = {
    Red: "??c",
    DarkRed: "??4",
    Yellow: "??e",
    Gold: "??6",
    Orange: "??6",
    MineCoinGold: "??g",
    Green: "??a",
    DarkGreen: "??2",
    Blue: "??9",
    DarkBlue: "??1",
    Aqua: "??b",
    DarkAqua: "??3",
    Cyan: "??3",
    LightPurple: "??d",
    Pink: "??d",
    DarkPurple: "??5",
    Purple: "??5",
    White: "??f",
    Gray: "??7",
    DarkGray: "??8",
    Grey: "??8",
    Black: "??0",
    Reset: "??r",
    Obfuscated: "??k",
    RandomText: "??k",
    Garbled: "??k",
    Bold: "??l",
    Italic: "??o",
};

function initConsole(Minecraft) {

    const {Commands} = Minecraft;
    
    const span = (color=FORMATTINGS.White, msg='') => {
          if (!Array.isArray(msg)) return color + msg + FORMATTINGS.Reset;
          msg[0] = color + msg[0];
          msg[msg.length - 1] += FORMATTINGS.Reset;
          return msg;
    }
    
    const sendMsg = msg => Commands.run(`/tellraw @a[tag=debugger] {"rawtext": [{"text": "${msg}"}]}`);
    // const sendMsg = msg => console.log(`/tellraw @a[tag=debugger] {"rawtext": [{"text": "${msg}"}]}`);
    
    const parseObject = (obj) => {
          let res = '{\n';
          for (const key in obj) {
                const val = obj[key];
                if (val === null) (res += `${key}: null\n`);
                if (typeof val != 'object') (res += `${key}: ${typeof val === 'number'? span(FORMATTINGS.Purple, val): val}\n`);
                else (res += `${key}: {...}\n`);
          }
          return res + '}';
    }
    
    const printf = (() => {
    
          const pString = (format, arg) => format.replace('%s', arg && typeof arg === 'string'? arg: arg.toString());
          const pInt = (format, arg) => format.replace('%d', span(FORMATTINGS.Aqua, arg && typeof arg === 'number'? Math.floor(arg): typeof arg === 'string'? Math.floor(parseInt(arg)): NaN));
          const pFloat = (format, arg) => format.replace('%f', span(FORMATTINGS.Purple, typeof arg === 'number'? arg: typeof arg === 'string'? Math.floor(parseFloat(arg)): NaN));
          const pObj = (format, arg) => format.replace('%o', parseObject(arg));
    
          return (format, ...args) => {
                for (let i = 0; i < args.length; i++) {
                      let type = /(%[s|d|f|o])/.exec(format)[1];
                      if (type === '%s' && (format = pString(format, args[i]))) continue;
                      if (type === '%d' && (format = pInt(format, args[i]))) continue;
                      if (type === '%f' && (format = pFloat(format, args[i]))) continue;
                      if (type === '%o' && (format = pObj(format, args[i]))) continue;
                }
                return sendMsg(format);
          }
    })();
    
    function log(...args){
          let prefix = new Array(stack).fill('    ').join('');
          if (/%[s|d|f|o]/.test(args[0])) return printf(prefix + args.shift(), ...args);
          args = args.map(val => typeof val == 'number'? span(FORMATTINGS.Purple, val): val).join('\n');
          return sendMsg(prefix + args);
    };
    
    let counter = 0,
    stack = 0,
    timers = {},
    callStack = [];
    
    const Console = {
          log, info: log,
          assert(condition, assertText) {
                return !condition && log(span(FORMATTINGS.Red, assertText));
          },
          clear() {
                log('\n\n\n\n\n\n\n\n\n\n');
          },
          error(...args) {
                callStack.length >0 && log(span(FORMATTINGS.Red, callStack.join(' > ') + '\n'));
                return log(...span(FORMATTINGS.Red, args));
          },
          warn(...args) {
                return log(...span(FORMATTINGS.Yellow, args));
          },
          count(identifier) {
                return log(identifier + ': ' + counter++);
          },
          group(groupName=`??????${stack}`) {
                let res = log(`??? ${groupName}`);
                stack ++;
                return res;
          },
          groupEnd() {
                stack > 0&& stack--;
          },
          time(timer='default') {
                timers[timer] = new Date().getTime();
          },
          timeEnd(timer='default') {
                if (timers[timer]) {
                      let time = (new Date().getTime() - timers[timer])/1000;
                      timers[timer] = null;
                      log(`${timer}: ${time} s`);
                }
          },
          trace() {
                log(callStack.join('\n\n'));
          },
          /**
           * ??????Function.call???Function.apply??????????????????????????????????????????????????????line???????????????????????????????????????
           * @param {number} line 
           * 
           * @example
           * function test(){
           *    console.setTracePoint.call(test, 111);
           * }
           * test();
           * console.trace();  //  test at line: 111
           */
          setTracePoint(line) {
                let funcName = this.name || 'anonymous';
                line && (funcName += ` at line: ${line}`);
                callStack.push(funcName);
          }
    }
    
    return Console;
    
}

function initTpa(Minecraft) {

/**
 * tpa
 * Copyright(C) 2021 3412490024(QQ)
 */
const { World, Commands} = Minecraft;

const targetMap = [];
const TICK = 20;

const TIMEOUT = 10 * TICK;

/* string name => array (string name, int timeout) */

function teleport(playerName, targetName) {
	try {
		Commands.run(`tp '${playerName}' '${targetName}'`);
	} catch (e) {
		
	}
}

function tellraw(playerName, message) {
	try {
		message = JSON.stringify({'rawtext':[{'text':message}]});
		Commands.run(`tellraw "${playerName}" ${message}`);
	} catch (e) {
	}
}

function deleteRequest(playerName) {
	delete targetMap[playerName];
}

World.events.chat.subscribe((event) => {
	if (event.message.startsWith('tpa ')) {
		event.cancel = true;
		const name = event.message.substr(4).trim();
		if (name == event.sender.name) {
			tellraw(name, '= =');
			return;
		}
		targetMap[event.sender.name] = {target : name, timeout : TIMEOUT};
		tellraw(event.sender.name, '?????????????????????');
	} else if (event.message == 'tpaccept') {
		event.cancel = true;
		const name = event.sender.name;
		for (let playerName in targetMap) {
			if (targetMap[playerName].target == name) {
				teleport(playerName, name);
				deleteRequest(playerName);
				tellraw(playerName, `??????${name}????????????????????????`);
				tellraw(name, `????????????${playerName}???????????????`);
				return;
			}
		}
		tellraw(name, '???????????????????????????????????????');
	} else if (event.message == 'tpdeny') {
		event.cancel = true;
		const name = event.sender.name;
		for (let playerName in targetMap) {
			if (targetMap[playerName].target == name) {
				deleteRequest(playerName);
				tellraw(playerName, `??????${name}????????????????????????`);
				return;
			}
		}
		tellraw(name, '???????????????????????????????????????');
	}
});

World.events.tick.subscribe(() => {
	for (let playerName in targetMap) {
		if (targetMap[playerName].timeout-- <= 0) {
			tellraw(playerName, `??????${targetMap[playerName].target}????????????????????????`);
			deleteRequest(playerName);
		}
	}
});

}

function __moduleDef(Minecraft, initializer, name) {
    __export[name] = initializer(Minecraft);
}

/**
 * ??????Minecraft
 */
export function init(Minecraft, option={
    console: true, tpa: true
}) {
    const {
        console, tpa,
    } = option;

    if(console) __moduleDef(Minecraft, initConsole, 'console');
    if(tpa) __moduleDef(Minecraft, initTpa, 'tpa');
}

/* GNU GENERAL PUBLIC LICENSE
Version 2, June 1991

Copyright (C) 1989, 1991 Free Software Foundation, Inc.
51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA

Everyone is permitted to copy and distribute verbatim copies of this license document, but changing it is not allowed.

Preamble

The licenses for most software are designed to take away your freedom to share and change it. By contrast, the GNU General Public License is intended to guarantee your freedom to share and change free software--to make sure the software is free for all its users. This General Public License applies to most of the Free Software Foundation's software and to any other program whose authors commit to using it. (Some other Free Software Foundation software is covered by the GNU Lesser General Public License instead.) You can apply it to your programs, too.

When we speak of free software, we are referring to freedom, not price. Our General Public Licenses are designed to make sure that you have the freedom to distribute copies of free software (and charge for this service if you wish), that you receive source code or can get it if you want it, that you can change the software or use pieces of it in new free programs; and that you know you can do these things.

To protect your rights, we need to make restrictions that forbid anyone to deny you these rights or to ask you to surrender the rights. These restrictions translate to certain responsibilities for you if you distribute copies of the software, or if you modify it.

For example, if you distribute copies of such a program, whether gratis or for a fee, you must give the recipients all the rights that you have. You must make sure that they, too, receive or can get the source code. And you must show them these terms so they know their rights.

We protect your rights with two steps: (1) copyright the software, and (2) offer you this license which gives you legal permission to copy, distribute and/or modify the software.

Also, for each author's protection and ours, we want to make certain that everyone understands that there is no warranty for this free software. If the software is modified by someone else and passed on, we want its recipients to know that what they have is not the original, so that any problems introduced by others will not reflect on the original authors' reputations.

Finally, any free program is threatened constantly by software patents. We wish to avoid the danger that redistributors of a free program will individually obtain patent licenses, in effect making the program proprietary. To prevent this, we have made it clear that any patent must be licensed for everyone's free use or not licensed at all.

The precise terms and conditions for copying, distribution and modification follow.

TERMS AND CONDITIONS FOR COPYING, DISTRIBUTION AND MODIFICATION

0. This License applies to any program or other work which contains a notice placed by the copyright holder saying it may be distributed under the terms of this General Public License. The "Program", below, refers to any such program or work, and a "work based on the Program" means either the Program or any derivative work under copyright law: that is to say, a work containing the Program or a portion of it, either verbatim or with modifications and/or translated into another language. (Hereinafter, translation is included without limitation in the term "modification".) Each licensee is addressed as "you".
Activities other than copying, distribution and modification are not covered by this License; they are outside its scope. The act of running the Program is not restricted, and the output from the Program is covered only if its contents constitute a work based on the Program (independent of having been made by running the Program). Whether that is true depends on what the Program does.

1. You may copy and distribute verbatim copies of the Program's source code as you receive it, in any medium, provided that you conspicuously and appropriately publish on each copy an appropriate copyright notice and disclaimer of warranty; keep intact all the notices that refer to this License and to the absence of any warranty; and give any other recipients of the Program a copy of this License along with the Program.
You may charge a fee for the physical act of transferring a copy, and you may at your option offer warranty protection in exchange for a fee.

2. You may modify your copy or copies of the Program or any portion of it, thus forming a work based on the Program, and copy and distribute such modifications or work under the terms of Section 1 above, provided that you also meet all of these conditions:
a) You must cause the modified files to carry prominent notices stating that you changed the files and the date of any change.
b) You must cause any work that you distribute or publish, that in whole or in part contains or is derived from the Program or any part thereof, to be licensed as a whole at no charge to all third parties under the terms of this License.
c) If the modified program normally reads commands interactively when run, you must cause it, when started running for such interactive use in the most ordinary way, to print or display an announcement including an appropriate copyright notice and a notice that there is no warranty (or else, saying that you provide a warranty) and that users may redistribute the program under these conditions, and telling the user how to view a copy of this License. (Exception: if the Program itself is interactive but does not normally print such an announcement, your work based on the Program is not required to print an announcement.)
These requirements apply to the modified work as a whole. If identifiable sections of that work are not derived from the Program, and can be reasonably considered independent and separate works in themselves, then this License, and its terms, do not apply to those sections when you distribute them as separate works. But when you distribute the same sections as part of a whole which is a work based on the Program, the distribution of the whole must be on the terms of this License, whose permissions for other licensees extend to the entire whole, and thus to each and every part regardless of who wrote it.

Thus, it is not the intent of this section to claim rights or contest your rights to work written entirely by you; rather, the intent is to exercise the right to control the distribution of derivative or collective works based on the Program.

In addition, mere aggregation of another work not based on the Program with the Program (or with a work based on the Program) on a volume of a storage or distribution medium does not bring the other work under the scope of this License.

3. You may copy and distribute the Program (or a work based on it, under Section 2) in object code or executable form under the terms of Sections 1 and 2 above provided that you also do one of the following:
a) Accompany it with the complete corresponding machine-readable source code, which must be distributed under the terms of Sections 1 and 2 above on a medium customarily used for software interchange; or,
b) Accompany it with a written offer, valid for at least three years, to give any third party, for a charge no more than your cost of physically performing source distribution, a complete machine-readable copy of the corresponding source code, to be distributed under the terms of Sections 1 and 2 above on a medium customarily used for software interchange; or,
c) Accompany it with the information you received as to the offer to distribute corresponding source code. (This alternative is allowed only for noncommercial distribution and only if you received the program in object code or executable form with such an offer, in accord with Subsection b above.)
The source code for a work means the preferred form of the work for making modifications to it. For an executable work, complete source code means all the source code for all modules it contains, plus any associated interface definition files, plus the scripts used to control compilation and installation of the executable. However, as a special exception, the source code distributed need not include anything that is normally distributed (in either source or binary form) with the major components (compiler, kernel, and so on) of the operating system on which the executable runs, unless that component itself accompanies the executable.

If distribution of executable or object code is made by offering access to copy from a designated place, then offering equivalent access to copy the source code from the same place counts as distribution of the source code, even though third parties are not compelled to copy the source along with the object code.

4. You may not copy, modify, sublicense, or distribute the Program except as expressly provided under this License. Any attempt otherwise to copy, modify, sublicense or distribute the Program is void, and will automatically terminate your rights under this License. However, parties who have received copies, or rights, from you under this License will not have their licenses terminated so long as such parties remain in full compliance.
5. You are not required to accept this License, since you have not signed it. However, nothing else grants you permission to modify or distribute the Program or its derivative works. These actions are prohibited by law if you do not accept this License. Therefore, by modifying or distributing the Program (or any work based on the Program), you indicate your acceptance of this License to do so, and all its terms and conditions for copying, distributing or modifying the Program or works based on it.
6. Each time you redistribute the Program (or any work based on the Program), the recipient automatically receives a license from the original licensor to copy, distribute or modify the Program subject to these terms and conditions. You may not impose any further restrictions on the recipients' exercise of the rights granted herein. You are not responsible for enforcing compliance by third parties to this License.
7. If, as a consequence of a court judgment or allegation of patent infringement or for any other reason (not limited to patent issues), conditions are imposed on you (whether by court order, agreement or otherwise) that contradict the conditions of this License, they do not excuse you from the conditions of this License. If you cannot distribute so as to satisfy simultaneously your obligations under this License and any other pertinent obligations, then as a consequence you may not distribute the Program at all. For example, if a patent license would not permit royalty-free redistribution of the Program by all those who receive copies directly or indirectly through you, then the only way you could satisfy both it and this License would be to refrain entirely from distribution of the Program.
If any portion of this section is held invalid or unenforceable under any particular circumstance, the balance of the section is intended to apply and the section as a whole is intended to apply in other circumstances.

It is not the purpose of this section to induce you to infringe any patents or other property right claims or to contest validity of any such claims; this section has the sole purpose of protecting the integrity of the free software distribution system, which is implemented by public license practices. Many people have made generous contributions to the wide range of software distributed through that system in reliance on consistent application of that system; it is up to the author/donor to decide if he or she is willing to distribute software through any other system and a licensee cannot impose that choice.

This section is intended to make thoroughly clear what is believed to be a consequence of the rest of this License.

8. If the distribution and/or use of the Program is restricted in certain countries either by patents or by copyrighted interfaces, the original copyright holder who places the Program under this License may add an explicit geographical distribution limitation excluding those countries, so that distribution is permitted only in or among countries not thus excluded. In such case, this License incorporates the limitation as if written in the body of this License.
9. The Free Software Foundation may publish revised and/or new versions of the General Public License from time to time. Such new versions will be similar in spirit to the present version, but may differ in detail to address new problems or concerns.
Each version is given a distinguishing version number. If the Program specifies a version number of this License which applies to it and "any later version", you have the option of following the terms and conditions either of that version or of any later version published by the Free Software Foundation. If the Program does not specify a version number of this License, you may choose any version ever published by the Free Software Foundation.

10. If you wish to incorporate parts of the Program into other free programs whose distribution conditions are different, write to the author to ask for permission. For software which is copyrighted by the Free Software Foundation, write to the Free Software Foundation; we sometimes make exceptions for this. Our decision will be guided by the two goals of preserving the free status of all derivatives of our free software and of promoting the sharing and reuse of software generally.
NO WARRANTY

11. BECAUSE THE PROGRAM IS LICENSED FREE OF CHARGE, THERE IS NO WARRANTY FOR THE PROGRAM, TO THE EXTENT PERMITTED BY APPLICABLE LAW. EXCEPT WHEN OTHERWISE STATED IN WRITING THE COPYRIGHT HOLDERS AND/OR OTHER PARTIES PROVIDE THE PROGRAM "AS IS" WITHOUT WARRANTY OF ANY KIND, EITHER EXPRESSED OR IMPLIED, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE. THE ENTIRE RISK AS TO THE QUALITY AND PERFORMANCE OF THE PROGRAM IS WITH YOU. SHOULD THE PROGRAM PROVE DEFECTIVE, YOU ASSUME THE COST OF ALL NECESSARY SERVICING, REPAIR OR CORRECTION.
12. IN NO EVENT UNLESS REQUIRED BY APPLICABLE LAW OR AGREED TO IN WRITING WILL ANY COPYRIGHT HOLDER, OR ANY OTHER PARTY WHO MAY MODIFY AND/OR REDISTRIBUTE THE PROGRAM AS PERMITTED ABOVE, BE LIABLE TO YOU FOR DAMAGES, INCLUDING ANY GENERAL, SPECIAL, INCIDENTAL OR CONSEQUENTIAL DAMAGES ARISING OUT OF THE USE OR INABILITY TO USE THE PROGRAM (INCLUDING BUT NOT LIMITED TO LOSS OF DATA OR DATA BEING RENDERED INACCURATE OR LOSSES SUSTAINED BY YOU OR THIRD PARTIES OR A FAILURE OF THE PROGRAM TO OPERATE WITH ANY OTHER PROGRAMS), EVEN IF SUCH HOLDER OR OTHER PARTY HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.
END OF TERMS AND CONDITIONS

How to Apply These Terms to Your New Programs

If you develop a new program, and you want it to be of the greatest possible use to the public, the best way to achieve this is to make it free software which everyone can redistribute and change under these terms.

To do so, attach the following notices to the program. It is safest to attach them to the start of each source file to most effectively convey the exclusion of warranty; and each file should have at least the "copyright" line and a pointer to where the full notice is found.

<one line to give the program's name and an idea of what it does.>
Copyright (C) <yyyy> <name of author>

This program is free software; you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with this program; if not, write to the Free Software Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301, USA.

Also add information on how to contact you by electronic and paper mail.

If the program is interactive, make it output a short notice like this when it starts in an interactive mode:

Gnomovision version 69, Copyright (C) year name of author Gnomovision comes with ABSOLUTELY NO WARRANTY; for details type `show w'. This is free software, and you are welcome to redistribute it under certain conditions; type `show c' for details.

The hypothetical commands `show w' and `show c' should show the appropriate parts of the General Public License. Of course, the commands you use may be called something other than `show w' and `show c'; they could even be mouse-clicks or menu items--whatever suits your program.

You should also get your employer (if you work as a programmer) or your school, if any, to sign a "copyright disclaimer" for the program, if necessary. Here is a sample; alter the names:

Yoyodyne, Inc., hereby disclaims all copyright interest in the program `Gnomovision' (which makes passes at compilers) written by James Hacker.

<signature of Ty Coon>, 1 April 1989 Ty Coon, President of Vice

This General Public License does not permit incorporating your program into proprietary programs. If your program is a subroutine library, you may consider it more useful to permit linking proprietary applications with the library. If this is what you want to do, use the GNU Lesser General Public License instead of this License.*/