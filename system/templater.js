var context = {
    name: "James",
    profile: {
        doe: '2010/02/01',
        age: 30,
        'reg-addr': [{
                type: 'home',
                street: 'king street'
            },
            {
                type: 'work',
                street: 'deval pass'
            }
        ]
    },
    skills: ['C++', 'Java', 'Ruby', 'C', 'Python'],
    sports: [
        { rank: 1, name: 'rugby' },
        { rank: 2, name: 'field' },
        { rank: 3, name: 'soccer' }
    ]
};

function objProp(path, obj) {
    //console.log('path -> ' + path + ', obj -> ' + obj);
    return path.split(/\.|\[['"]?(.+?)["']?\]/).filter(function(val) {
        return val;
    }).reduce(function(prev, curr) {
        return prev ? prev[curr] : null;
    }, obj);
}

//console.log(objProp('age', { age: 30 }));
//console.log(objProp('profile[\'reg-addr\'][0].type', context));

function resProp() {
    return function(expr, ctx) {
        return objProp(expr, ctx);
    };
}

//console.log(resProp().call(this, 'profile[age]', context));
//console.log(resProp().call(this, 'profile[\'reg-addr\'][0].type', context));
//console.log(resProp().call(this, 'profile[reg-addr][1].type', context));

function resExpr() {
    return function(expr, ctx) {
        //padd with a space at the end for regex to match
        var exec = expr.concat(' ').replace(/(\w+(\.|\[).*?)\s/g, function(m, p) {
            return objProp(p, ctx);
        });
        if (exec.search(/([a-zA-Z_]+?)\s/g) > -1) {
            exec = expr.concat(' ').replace(/([a-zA-Z_]+?)\s/g, function(m, p) {
                return objProp(p, ctx);
            });
        }
        console.log('executable expression -> ' + exec);
        return eval(exec);
    };
}

//console.log(resExpr().call(this, 'ctx.age > 30', { ctx: { name: 'mike', age: 20 } }));
//console.log(resExpr().call(this, "ctx['age'] > 30 && ctx.age > 35", { ctx: { name: 'mike', age: 40 } }));
//console.log(resExpr().call(this, "age > 30", { name: 'mike', age: 40 }));

var cozy = [
    "<div class='person'>",
    "<p data-doe='@{profile.doe}'>@{name}</p>",
    "@if{profile.age < 20}",
    "<div style='background-color=red'>@{profile['reg-addr'][0].type}</div>",
    "@else{}",
    "<div style='background-color=green'>@{profile['reg-addr'][1].type}</div>",
    "@end{}",
    "<ul class='skills'>",
    "@for{skill in skills}",
    "<li>@{skill}</li>",
    "@end{}",
    "</ul>",
    "<hr/>",
    "<ul class='sports'>",
    "@for{sport in sports}",
    "@if{sport.rank == 1}",
    "<li data-rank='@eval{sport.rank * 20}'>@{sport.name}</li>",
    "@else{sport.rank == 2}",
    "<li data-rank='@eval{sport.rank * 15}'>@{sport.name}</li>",
    "@else{sport.rank == 3}",
    "<li data-rank='@eval{sport.rank * 10}'>@{sport.name}</li>",
    "@else{}",
    "<li data-rank='none'>@{sport.name}</li>",
    "@end{}",
    "@end{}",
    "</ul>",
    "</div>"
].join("");

function splitTemplate(template) {
    var regex = /(@\{(.+?)\})|(@if\{(.+?)\})|(@else\{(.*?)\})|(@end\{\})|(@for\{(.+?)\})|(@eval\{(.+?)\})/g;
    var match;
    var start = 0;
    var stack = [];

    while ((match = regex.exec(template)) != null) {
        // for (var i in match) {
        //     console.log("match[" + i + "]->" + match[i]);
        // }
        var val, evaled, istrue;
        var matched = match[0];

        var text = template.substring(start, match.index);
        if (text.length > 0) {
            console.log('text before next match -> ' + text);
            stack.push({ matched: "", value: text });
        }

        if (matched.startsWith("@{")) {
            //must be an expression
            val = match[2];
            console.log('@{} expr matched -> ' + match[1]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@eval{")) {
            val = match[11];
            console.log('@eval matched -> ' + match[10]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@if{")) {
            val = match[4];
            console.log("@if condition matched -> " + match[3]);
            stack.push({ matched: matched, value: val });
        } else if (matched == "@else{}") {
            console.log("last @else{} condition reached -> " + match[5]);
            stack.push({ matched: matched, value: "" });
        } else if (matched.startsWith("@else{")) {
            val = match[6];
            console.log("@else{expr} condition matched -> " + match[5]);
            stack.push({ matched: matched, value: val });
        } else if (matched == "@end{}") {
            console.log('reached @end of block -> ' + match[7]);
            stack.push({ matched: matched, value: "" });
        } else if (matched.startsWith("@for{")) {
            val = match[9];
            console.log("@for condition matched -> " + match[8]);
            stack.push({ matched: matched, value: val });
        } else {
            throw Error('unexpected token matched -> ' + matched);
        }

        //reset start
        start = regex.lastIndex;
    }
    //get last section
    text = template ? template.substring(start) : "";
    if (text.length > 0) {
        console.log('text before end of template -> ' + text);
        stack.push({ matched: "", value: text });
    }

    //return
    return stack;
}

function expandTemplate(start, stack, context) {
    var index = start;
    while (index < stack.length) {
        var entry = stack[index];
        if (entry.matched.startsWith("@if{")) {
            var if_res = expandIf(index, stack, context);
            index = if_res.index;
        } else if (entry.matched.startsWith("@for{")) {
            var for_res = expandFor(index, stack, context);
            index = for_res.index;
        } else if (entry.matched == "@end{}") {
            console.log("handle @end{} logic");
        } else {
            if (entry.matched.startsWith("@{")) {
                entry.value = resProp().call(this, entry.value, context);
            } else if (entry.matched.startsWith("@eval{")) {
                entry.value = resExpr().call(this, entry.value, context);
            } else {
                console.log("must be text only -> " + entry.value);
            }
        }
        index++;
    }
    return stack;
}

function expandIf(start, stack, context) {
    var index = start;
    var found = false;
    var entry = stack[index];
    while (entry.matched != "@end{}") {
        if (entry.matched.startsWith("@if{")) {
            entry.value = resExpr().call(this, entry.value, context);
            found = entry.value;
            stack.splice(index, 1);
            entry = stack[index];
            continue;
        } else if (entry.matched == "@else{}") {
            var else_res = expandElse(index, stack, context, !found);
            index = else_res.index;
            entry = stack[index];
            continue;
        } else if (entry.matched.startsWith("@else{")) {
            var elif_res = expandElIf(index, stack, context);
            index = elif_res.index;
            entry = stack[index];
            continue;
        } else {
            if (!found) {
                stack.splice(index, 1);
                entry = stack[index];
                continue;
            }
        }
        entry = stack[++index];
    }
    stack.splice(index, 1);
    return { index: index, found: found };
}

function expandElIf(start, stack, context) {
    var index = start;
    var found = false;
    var entry = stack[index];

    while (entry.matched != "@end{}") {
        if (entry.matched.startsWith("@if{")) {
            var if_res = expandIf(index, stack, context);
            index = if_res.index;
            continue;
        } else if (entry.matched == "@else{}") {
            break;
        } else if (entry.matched.startsWith("@else{")) {
            entry.value = resExpr().call(this, entry.value, context);
            found = entry.value;
            stack.splice(index, 1);
            entry = stack[index];
            continue;
        } else {
            if (!found) {
                stack.splice(index, 1);
                entry = stack[index];
                continue;
            }
        }
        entry = stack[++index];
    }
    return { index: index, found: found };
}

function expandElse(start, stack, context, keep) {
    var index = start;
    var found = false;
    var entry = stack[index];
    while (entry.matched != "@end{}") {
        if (entry.matched.startsWith("@if{")) {
            var if_res = expandIf(index, stack, context);
            index = if_res.index;
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
            }
        }
        entry = stack[++index];
    }
    return { index: index, found: found };
}

function forParams(expr) {
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

//console.log(forParams("abs, xyc in letters"));
//console.log(forParams("abc in letters"));

function resFor() {
    return function(elements, stack, cursor, key) {
        var result = [];
        for (var index in elements) {
            var local_copy = JSON.parse(JSON.stringify(stack))
            var ctx = {};
            ctx[cursor] = elements[index];
            if (key) ctx[key] = index;
            result = result.concat(expandTemplate(0, local_copy, ctx));
        }
        return result;
    };
}

//console.log(resFor().call(this, context.profile['reg-addr'], '@{addr.type}', 'addr'));
//console.log(resFor().call(this, context['skills'], '@{skill}', 'skill'));
//console.log(resFor().call(this, context.sports, "<li data-num='@{count}'>@{sport.name}</li>", 'sport', 'count'));

function expandFor(start, stack, context) {
    var index = start;
    var local = [];
    var entry = stack[index];
    stack.splice(index, 1);

    var params = forParams(entry.value);
    //elements, stack, cursor, key
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
    //expand
    var for_res = resFor().call(this, context[params.elements], local, params.cursor, params.key);
    //insert array into stack array
    stack.splice.apply(stack, [index, 0].concat(for_res));
    return { index: (index + for_res.length) };
}

var model = { xyz: 10, list: [10, 20, 25, 40], x: 25, profile: { name: 'mike', age: 30 } };

var simple0 = "do eval @eval{(xyz / 2) > 10} retrieve value @{profile.name}";
var simple1 = "do eval @eval{(xyz * 2) > 10} start if @if{list[2] >= 30} if matched @else{} else matched @end{} retrieve value @{profile.name}";
var simple2 = "do eval @eval{(xyz * 2) > 10} start if @if{list[2] >= 30} if matched @else{list[2] < 30} elif matched @end{} retrieve value @{profile.name}";
var simple3 = "do eval @eval{(xyz ^ 2) > 10} start if @if{list[2] == 25} if matched @else{list[2] == 40} elif matched @else{} else matched @end{} retrieve value @{profile.name}";
var simple4 = "do eval @eval{(xyz - 2) > 10} start if @if{list[2] >= 30} if matched @else{list[2] == 40} elif matched @else{} else matched @end{} retrieve value @{profile.name}";
var simple5 = "do eval @eval{(xyz + 2) > 10} start for @for{a in list} <p>@{a}</p> @end{} end for @end{} retrieve value @{profile.name}";
var simple6 = "do eval @eval{(xyz - 2) > 10} start for @for{elem, index in list} <p data-index='@{index}'>@{elem}</p> start if @if{elem > 30} if matched @else{elem < 30} elif matched @else{} else matched @end{} end for @end{} retrieve value @{profile.name}";

console.log(expandTemplate(0, splitTemplate(simple6), model).reduce(function(acc, curr) {
    return acc.concat(curr.value);
}, ""));