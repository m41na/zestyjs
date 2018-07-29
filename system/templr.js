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

try {
    module.exports = Tmpl;
} catch (error) {
    console.log(error);
}