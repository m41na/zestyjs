var line2 = "<parent>@slot{line} parent content @slot{}</parent>";

var simple_html = [
    "@extend{layout_html}",

    "@block{ title } Simple Layout @block{}",

    "@block{ main }",
    "<div id=\"content\">",
    "@super{}",
    "<p>It's your birthday!!</p>",
    "@slot{wrapped}<p>Sports List</p>@slot{}",
    "</div > ",
    "@block{}",

    "@extend{}"
].join("");

var layout_html = [
    "<div id=\"layout\">",

    "<div id=\"title\">@slot{title}Placeholder Title@slot{}</div>",

    "<div id=\"app\">",
    "@slot{ main }",
    "<h3>Messages</h3>",
    "@slot{}",
    "</div >",

    "</div>"
].join("");

var fs;
try {
    fs = require('fs');
} catch (error) {
    console.log('trouble with require - ' + error);
}

let Logger = function (flag) {
    var enabled = flag;
    return {
        log: function (str) {
            if (enabled) {
                console.log(str)
            }
        },
        enable: function (val) {
            enabled = val;
        }
    }
}(false);

let Tmpl = {};

Tmpl.objProp = function (path, obj) {
    return path.split(/\.|\[['"]?(.+?)["']?\]/).filter(function (val) {
        return val;
    }).reduce(function (prev, curr) {
        return prev ? prev[curr] : null;
    }, obj);
}

Tmpl.setProp = function (expr) {
    return function (ctx) {
        var parts = expr.split("=");
        var prop = parts[0].trim();
        ctx[prop] = eval(parts[1].trim());
        return prop;
    }
}

Tmpl.resProp = function (expr) {
    return function (ctx) {
        return this.objProp(expr, ctx);
    }.bind(this);
}

Tmpl.resExpr = function (expr) {
    return function (ctx) {
        //padd with a space at the end for regex to match
        var exec = expr.concat(' ').replace(/(\w+(\.|\[).*?)\s/g, function (m, p) {
            return this.objProp(p, ctx);
        }.bind(this));
        if (exec.search(/([a-zA-Z_]+?)\s/g) > -1) {
            exec = expr.concat(' ').replace(/([a-zA-Z_]+?)\s/g, function (m, p) {
                var e = this.objProp(p, ctx);
                return this.isNumeric(e) ? e : this.isString(e) ? "'" + e + "'" : e;
            }.bind(this));
        }
        Logger.log('executable expression -> ' + exec);
        return eval(exec);
    }.bind(this);
}

Tmpl.isNumeric = function (n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

Tmpl.isNumber = function (value) {
    return typeof value === 'number' && isFinite(value);
}

Tmpl.isString = function (value) {
    return typeof value === 'string' || value instanceof String;
}

Tmpl.isObject = function (value) {
    return value && typeof value === 'object' && value.constructor === Object;
}

Tmpl.isArray = function (value) {
    return value && Array.isArray(value);
}

Tmpl.isFunction = function (value) {
    return typeof value === 'function';
}

Tmpl.isRegExp = function (value) {
    return value && typeof value === 'object' && value.constructor === RegExp;
}

Tmpl.isError = function (value) {
    return value instanceof Error && typeof value.message !== 'undefined';
}

Tmpl.isDate = function (value) {
    return value instanceof Date;
}

Tmpl.mergeArrays = function (a, b) {
    //in-place merging instead of a.concat(b) which creates new array
    if (a.length > b.length) {
        a.push.apply(a, b);
        return a;
    }
    else {
        b.unshift.apply(b, a);
        return b;
    }
}

Tmpl.newNode = function (type, value) {
    return {
        type: type,
        value: value,
        parent: null,
        child: null,
        next: null,
        prev: null
    }
}

Tmpl.buildElements = function (template, name) {
    var regex = /(@\{(.+?)\})|(@eval\{(.+?)\})|(@set\{(\w+?=.+?)\})|(@if\{(.+?)\})|(@elif\{(.+?)\})|(@else\{\})|(@end\{\})|(@for\{(.+?)\})|(@incl\{(.+?)\})|(@extend\{(.*?)\})|(@block\{(.*?)\})|(@super\{\})|(@slot\{(.*?)\})/g;
    var match;
    var start = 0;
    var parent = this.newNode('node', name);
    var current;
    var link = function(type, value){
        let node = Tmpl.newNode(type, value);
        node.parent = parent;
        current.next = node;
        node.prev = current;
        current = node;
    }
    var branch = function(node){
        var curr = node;
        return {
            get: function(){
                return curr;
            },
            set: function(node){
                curr = node;
            }
        }
    }
    //process
    while ((match = regex.exec(template)) != null) {
        // for (var i in match) {
        //     Logger.log("match[" + i + "]->" + match[i]);
        // }
        var val;
        var matched = match[0];

        var text = template.substring(start, match.index);
        if (text.trim().length > 0) {
            Logger.log('text before next match -> ' + text);
            link('text', { matched: "", value: text });
        }

        if (matched.startsWith("@{")) {
            val = match[2];
            Logger.log('@{} expr matched -> ' + match[1]);
            link('expr', { matched: matched, value: val });
        } else if (matched.startsWith("@eval{")) {
            val = match[4];
            Logger.log('@eval matched -> ' + match[3]);
            link('eval', { matched: matched, value: val });
        } else if (matched.startsWith("@set{")) {
            val = match[6];
            Logger.log("@set statement matched -> " + match[5]);
            link('set', { matched: matched, value: val });
        } else if (matched.startsWith("@if{")) {
            val = match[8];
            Logger.log("@if condition matched -> " + match[7]);
            link('if', { matched: matched, value: val });
        } else if (matched.startsWith("@elif{")) {
            val = match[10];
            Logger.log("@elif condition matched -> " + match[9]);
            link('elif', { matched: matched, value: val });
        } else if (matched == "@else{}") {
            val = null;
            Logger.log("@else condition reached -> " + match[11]);
            link('else', { matched: matched, value: val });
        } else if (matched == "@end{}") {
            val = null;
            Logger.log('reached @end of statements -> ' + match[12]);
            link('end', { matched: matched, value: val });
        } else if (matched.startsWith("@for{")) {
            val = match[14];
            Logger.log("@for condition matched -> " + match[13]);
            link('for', { matched: matched, value: val });
        } else if (matched.startsWith("@incl{")) {
            val = match[16];
            Logger.log("@incl statement matched -> " + match[15]);
            link({ matched: matched, value: val }, 'incl');
            var include = this.buildElements(this.loadTemplate(val), val);
            link('incl', include);
        } else if (matched == "@extend{}") {
            val = null;
            Logger.log('end of @extend{} directive reached -> ' + match[17]);
            link('extend$', { matched: matched, value: val });
            return element;
        } else if (matched.startsWith("@extend{")) {
            val = match[18];
            Logger.log('beginning of @extend{} directive matched -> ' + match[17]);
            link({ matched: matched, value: val }, 'extend');
            var extend = this.buildElements(this.loadTemplate(val), val);
            parent.parent = extend;
        } else if (matched == "@block{}") {
            val = null;
            Logger.log("end of @block directive reached -> " + match[19]);
            link('block$', { matched: matched, value: val });
        } else if (matched.startsWith("@block{")) {
            val = match[20];
            Logger.log("@block directive matched -> " + match[19]);
            link('block', { matched: matched, value: val });
        } else if (matched.startsWith("@super{")) {
            val = null;
            Logger.log("@super directive matched -> " + match[21]);
            link('super', { matched: matched, value: val });
        } else if (matched == "@slot{}") {
            val = null;
            Logger.log("end of @slot directive reached -> " + match[22]);
            link('slot$', { matched: matched, value: val });
        } else if (matched.startsWith("@slot{")) {
            val = match[23];
            Logger.log("beginning of @slot{} directive matched -> " + match[22]);
            link('slot', { matched: matched, value: val });
        } else {
            throw Error('unexpected token matched -> ' + matched);
        }
        //reset start
        start = regex.lastIndex;
    }
    //get last section
    text = template ? template.substring(start) : "";
    if (text.trim().length > 0) {
        Logger.log('text before end of template -> ' + text);
        link('text', { matched: "", value: text });
    }
    //return
    return element;
}

Tmpl.loadTemplate = function (name) {
    var index;
    if ((index = name.search(/^dom:/)) > -1) {
        return he.decode(document.querySelector(name.substring('dom:'.length)).innerHTML);
    }
    else if ((index = name.search(/^tpl:/)) > -1) {
        return he.decode(document.querySelector(name.substring('tpl:'.length)).innerHTML);
    }
    else if ((index = name.search(/^fs:/)) > -1) {
        return this.loadFsTemplate(name.substring('fs:'.length));
    }
    else {
        return eval(name);
    }
}

Tmpl.loadFsTemplate = function (name) {
    var data = fs.readFileSync(name, "utf-8");
    var templ = /<template.*?>([^].*?)<\/template>/.exec(data);
    return templ[1];
}

Tmpl.expandTemplate = function (start, stack) {
    return function (context) {
        var index = start;
        while (index < stack.length) {
            var entry = stack[index];
            if (entry.matched.startsWith("@if{")) {
                var if_res = this.expandIf(index, stack)(context);
                index = if_res.index;
            } else if (entry.matched.startsWith("@for{")) {
                var for_res = this.expandFor(index, stack)(context);
                index = for_res.index;
            } else if (entry.matched == "@end{}") {
                Logger.log("handle @end{} logic");
            } else {
                if (entry.matched.startsWith("@{")) {
                    entry.value = this.resProp(entry.value)(context);
                } else if (entry.matched.startsWith("@eval{")) {
                    entry.value = this.resExpr(entry.value)(context);
                } else if (entry.matched.startsWith("@set{")) {
                    entry.value = this.setProp(entry.value)(context);
                } else {
                    Logger.log("must be text only -> " + entry.value);
                }
            }
            index++;
        }
        return stack;
    }.bind(this);
}

Tmpl.expandIf = function (start, stack) {
    return function (context) {
        var index = start;
        //splice @if{} from stack
        var if_tag = stack.splice(index, 1)[0];
        var found = this.resExpr(if_tag.value)(context);
        //process stack
        var entry = stack[index];
        while (entry.matched != "@end{}") {
            if (entry.matched.startsWith("@if{")) {
                entry.value = this.resExpr(entry.value)(context);
                found = entry.value;
                stack.splice(index, 1);
                entry = stack[index];
                continue;
            } else if (entry.matched == "@else{}") {
                var else_res = this.expandElse(index, stack, !found)(context);
                index = else_res.index;
                found = else_res.found;
                entry = stack[index];
                continue;
            } else if (entry.matched.startsWith("@else{")) {
                var elif_res = this.expandElIf(index, stack)(context);
                index = elif_res.index;
                entry = stack[index];
                continue;
            } else {
                if (!found) {
                    stack.splice(index, 1);
                    entry = stack[index];
                    continue;
                } else if (entry.matched.startsWith("@{")) {
                    entry.value = this.resProp(entry.value)(context);
                } else if (entry.matched.startsWith("@eval{")) {
                    entry.value = this.resExpr(entry.value)(context);
                } else if (entry.matched.startsWith("@set{")) {
                    entry.value = this.setProp(entry.value)(context);
                }
            }
            entry = stack[++index];
        }
        stack.splice(index, 1);
        return { index: index, found: found };
    }.bind(this);
}

Tmpl.expandElIf = function (start, stack) {
    return function (context) {
        var index = start;
        //splice @elif{} from stack
        var elif_tag = stack.splice(index, 1)[0];
        var found = this.resExpr(elif_tag.value)(context);
        //process stack
        var entry = stack[index];
        while (entry.matched != "@end{}") {
            if (entry.matched.startsWith("@if{")) {
                var if_res = this.expandIf(index, stack)(context);
                index = if_res.index;
                found = if_res.found;
                continue;
            } else if (entry.matched == "@else{}") {
                break;
            } else if (entry.matched.startsWith("@else{")) {
                break;
            } else {
                if (!found) {
                    stack.splice(index, 1);
                    entry = stack[index];
                    continue;
                } else if (entry.matched.startsWith("@{")) {
                    entry.value = this.resProp(entry.value)(context);
                } else if (entry.matched.startsWith("@eval{")) {
                    entry.value = this.resExpr(entry.value)(context);
                } else if (entry.matched.startsWith("@set{")) {
                    entry.value = this.setProp(entry.value)(context);
                }
            }
            entry = stack[++index];
        }
        return { index: index, found: found };
    }.bind(this);
}

Tmpl.expandElse = function (start, stack, keep) {
    return function (context) {
        var index = start;
        var found = keep;
        //splice @else{} from stack
        stack.splice(index, 1);
        //process stack
        var entry = stack[index];
        while (entry.matched != "@end{}") {
            if (entry.matched.startsWith("@if{")) {
                var if_res = this.expandIf(index, stack)(context);
                index = if_res.index;
                found = if_res.found;
                continue;
            } else if (entry.matched == "@else{}") {
                found = keep;
                stack.splice(index, 1);
                entry = stack[index];
                continue;
            } else if (entry.matched.startsWith("@else{")) {
                throw Error("encountered illegal @else{...} inside @else{} block");
                break;
            } else {
                if (!found) {
                    stack.splice(index, 1);
                    entry = stack[index];
                    continue;
                } else if (entry.matched.startsWith("@{")) {
                    entry.value = this.resProp(entry.value)(context);
                } else if (entry.matched.startsWith("@eval{")) {
                    entry.value = this.resExpr(entry.value)(context);
                } else if (entry.matched.startsWith("@set{")) {
                    entry.value = this.setProp(entry.value)(context);
                }
            }
            entry = stack[++index];
        }
        return { index: index, found: found };
    }.bind(this);
}

Tmpl.forParams = function (expr) {
    var regex_2 = /(\w+?)\s*?in\s*?(\w+?)$/g;
    var regex_3 = /(\w+?)\s*?,?\s*?(\w+?)\s*?in\s*?(\w+?)$/g;
    var match;
    if (!expr.includes(",")) {
        if ((match = regex_2.exec(expr)) != null) {
            return { cursor: match[1], elements: match[2] };
        } else {
            throw Error('seems like \'' + expr + '\' is an invalid @for expression');
        }
    } else {
        if ((match = regex_3.exec(expr)) != null) {
            return { cursor: match[1], key: match[2], elements: match[3] };
        } else {
            throw Error('seems like \'' + expr + '\' is an invalid @for expression');
        }
    }
}

Tmpl.resFor = function (elements, cursor, key) {
    return function (stack) {
        var result = [];
        for (var index in elements) {
            var local = stack.map(e => { return { matched: e.matched, value: e.value }; });
            var ctx = {};
            ctx[cursor] = elements[index];
            if (key) ctx[key] = index;
            result = result.concat(this.expandTemplate(0, local)(ctx));
        }
        return result;
    }.bind(this);
}

Tmpl.expandFor = function (start, stack) {
    return function (context) {
        var index = start;
        var local = [];
        //splice @for tag to extract [elements, stack, cursor, key]
        var for_tag = stack.splice(index, 1)[0];
        var params = this.forParams(for_tag.value);
        //process stack
        var entry = stack[index];
        var depth = 0;
        while (depth > 0 || entry.matched != "@end{}") {
            if (entry.matched.startsWith("@if{")) {
                depth++;
            }
            if (entry.matched == "@end{}" && depth > 0) {
                depth--;
            }
            local = local.concat(stack.splice(index, 1));
            entry = stack[index];
        }
        //drop @end tag which belongs to @for
        stack.splice(index, 1);
        //expand
        var for_res = this.resFor(context[params.elements], params.cursor, params.key)(local);
        //insert array into stack array
        stack.splice.apply(stack, [index, 0].concat(for_res));
        return { index: (index + for_res.length) };
    }.bind(this);
}

Tmpl.expandIncl = function (start, stack) {
    return function (context) {
        var index = start;
        //splice @if{} from stack
        var incl_tag = stack.splice(index, 1)[0];
        var incl = this.splitExpand(this.loadTemplate(incl_tag.value))(context);
        stack.splice.apply(stack, [index, 0].concat(incl));
        return { index: (index + incl.length) };
    }.bind(this);
}

try {
    module.exports = Tmpl;
} catch (error) {
    console.log(error);
}