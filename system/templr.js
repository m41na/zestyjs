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
        { rank: 3, name: 'hockey' }
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

function setProp(expr) {
    return function(ctx) {
        var parts = expr.split("=");
        var prop = parts[0].trim();
        ctx[prop] = eval(parts[1].trim());
        return prop;
    }
}

//console.log(objProp('age', { age: 30 }));
//console.log(objProp('profile[\'reg-addr\'][0].type', context));

function resProp(expr) {
    return function(ctx) {
        return objProp(expr, ctx);
    };
}

//console.log(resProp('profile[age]')(context));
//console.log(resProp('profile[\'reg-addr\'][0].type')(context));
//console.log(resProp('profile[reg-addr][1].type')(context));

function resExpr(expr) {
    return function(ctx) {
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

//console.log(resExpr('ctx.age > 30')({ ctx: { name: 'mike', age: 20 } }));
//console.log(resExpr("ctx['age'] > 30 && ctx.age > 35")({ ctx: { name: 'mike', age: 40 } }));
//console.log(resExpr("age > 30")({ name: 'mike', age: 40 }));

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
    "@incl{dozy}",
    "</div>"
].join("");

var dozy = [
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
    "</ul>"
].join("");

var eazy = "<div id='parent'>@slot{}child content@slot{/}</div>";

function loadTemplate(name) {
    var index;
    if((index = name.search(/^dom:/)) > -1){
        return he.decode(document.querySelector(name.substring('dom:'.length)).innerHTML);
    }
    else if((index = name.search(/^tpl:/)) > -1){
        return he.decode(document.querySelector(name.substring('tpl:'.length)).innerHTML);
    }
    else if((index = name.search(/^fs:/)) > -1){
        throw Error('loading from file system not yet implemented');
    }
    else{
        return eval(name);
    }
}

function splitTemplate(template) {
    var regex = /(@\{(.+?)\})|(@if\{(.+?)\})|(@else\{(.*?)\})|(@end\{\})|(@for\{(.+?)\})|(@eval\{(.+?)\})|(@set\{(\w+?=.+?)\})|(@incl\{(.+?)\})|(@extend\{(.*?)\})|(@block\{(.*?)\})|(@super\{(\s*?)\})|(@slot\{(.*?)\})/g;
    var match;
    var start = 0;
    var stack = [];
    //process
    while ((match = regex.exec(template)) != null) {
        for (var i in match) {
            console.log("match[" + i + "]->" + match[i]);
        }
        var val;
        var matched = match[0];

        var text = template.substring(start, match.index);
        if (text.trim().length > 0) {
            console.log('text before next match -> ' + text);
            stack.push({ matched: "", value: text });
        }

        if (matched.startsWith("@{")) {
            //must be an expression
            val = match[2];
            console.log('@{} expr matched -> ' + match[1]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@if{")) {
            val = match[4];
            console.log("@if condition matched -> " + match[3]);
            stack.push({ matched: matched, value: val });
        } else if (matched == "@else{}") {
            val = "";
            console.log("last @else{} condition reached -> " + match[5]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@else{")) {
            val = match[6];
            console.log("@else{expr} condition matched -> " + match[5]);
            stack.push({ matched: matched, value: val });
        } else if (matched == "@end{}") {
            val = "";
            console.log('reached @end of block -> ' + match[7]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@for{")) {
            val = match[9];
            console.log("@for condition matched -> " + match[8]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@eval{")) {
            val = match[11];
            console.log('@eval matched -> ' + match[10]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@set{")) {
            val = match[13];
            console.log("@set statement matched -> " + match[12]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@incl{")) {
            val = match[15];
            console.log("@incl statement matched -> " + match[14]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@extend{")) {
            val = match[17];
            console.log('@extend{} directive matched -> ' + match[16]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@block{")) {
            val = match[19];
            console.log("@block directive matched -> " + match[18]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@super{")) {
            val = match[21];
            console.log("@super directive matched -> " + match[20]);
            stack.push({ matched: matched, value: val });
        } else if (matched.startsWith("@slot{")) {
            val = match[23];
            console.log("@slot directive matched -> " + match[22]);
            stack.push({ matched: matched, value: val });
        } else {
            throw Error('unexpected token matched -> ' + matched);
        }
        //reset start
        start = regex.lastIndex;
    }
    //get last section
    text = template ? template.substring(start) : "";
    if (text.trim().length > 0) {
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
        } else if (entry.matched.startsWith("@incl{")) {
            var incl_res = expandIncl(index, stack, context);
            index = incl_res.index;
        } else if (entry.matched.startsWith("@extend{")) {
            var ext_res = expandExtend(index, stack, context);
            index = ext_res.index;
        } else {
            if (entry.matched.startsWith("@{")) {
                entry.value = resProp(entry.value)(context);
            } else if (entry.matched.startsWith("@eval{")) {
                entry.value = resExpr(entry.value)(context);
            } else if (entry.matched.startsWith("@set{")) {
                entry.value = setProp(entry.value)(context);
            } else {
                console.log("must be text only -> " + entry.value);
            }
        }
        index++;
    }
    return stack;
}

function splitExpand(template) {
    return function(context) {
        return expandTemplate(0, splitTemplate(template), context);
    }
}

function expandIf(start, stack, context) {
    var index = start;
    //splice @if{} from stack
    var if_tag = stack.splice(index, 1)[0];
    var found = resExpr(if_tag.value)(context);
    //process stack
    var entry = stack[index];
    while (entry.matched != "@end{}") {
        if (entry.matched.startsWith("@if{")) {
            entry.value = resExpr(entry.value)(context);
            found = entry.value;
            stack.splice(index, 1);
            entry = stack[index];
            continue;
        } else if (entry.matched == "@else{}") {
            var else_res = expandElse(index, stack, context, !found);
            index = else_res.index;
            found = else_res.found;
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
            } else if (entry.matched.startsWith("@{")) {
                entry.value = resProp(entry.value)(context);
            } else if (entry.matched.startsWith("@eval{")) {
                entry.value = resExpr(entry.value)(context);
            } else if (entry.matched.startsWith("@set{")) {
                entry.value = setProp(entry.value)(context);
            }
        }
        entry = stack[++index];
    }
    stack.splice(index, 1);
    return { index: index, found: found };
}

function expandElIf(start, stack, context) {
    var index = start;
    //splice @elif{} from stack
    var elif_tag = stack.splice(index, 1)[0];
    var found = resExpr(elif_tag.value)(context);
    //process stack
    var entry = stack[index];
    while (entry.matched != "@end{}") {
        if (entry.matched.startsWith("@if{")) {
            var if_res = expandIf(index, stack, context);
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
                entry.value = resProp(entry.value)(context);
            } else if (entry.matched.startsWith("@eval{")) {
                entry.value = resExpr(entry.value)(context);
            } else if (entry.matched.startsWith("@set{")) {
                entry.value = setProp(entry.value)(context);
            }
        }
        entry = stack[++index];
    }
    return { index: index, found: found };
}

function expandElse(start, stack, context, keep) {
    var index = start;
    var found = keep;
    //splice @else{} from stack
    stack.splice(index, 1);
    //process stack
    var entry = stack[index];
    while (entry.matched != "@end{}") {
        if (entry.matched.startsWith("@if{")) {
            var if_res = expandIf(index, stack, context);
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
                entry.value = resProp(entry.value)(context);
            } else if (entry.matched.startsWith("@eval{")) {
                entry.value = resExpr(entry.value)(context);
            } else if (entry.matched.startsWith("@set{")) {
                entry.value = setProp(entry.value)(context);
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

function resFor(elements, cursor, key) {
    return function(stack) {
        var result = [];
        for (var index in elements) {
            var local_copy = JSON.parse(JSON.stringify(stack));
            //var local_copy = stack.slice(0);
            var ctx = {};
            ctx[cursor] = elements[index];
            if (key) ctx[key] = index;
            result = result.concat(expandTemplate(0, local_copy, ctx));
        }
        return result;
    };
}

function expandFor(start, stack, context) {
    var index = start;
    var local = [];
    //splice @for tag to extract [elements, stack, cursor, key]
    var for_tag = stack.splice(index, 1)[0];
    var params = forParams(for_tag.value);
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
    var for_res = resFor(context[params.elements], params.cursor, params.key)(local);
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

function expandIncl(start, stack, context) {
    var index = start;
    //splice @if{} from stack
    var incl_tag = stack.splice(index, 1)[0];
    var incl = splitExpand(loadTemplate(incl_tag.value))(context);
    stack.splice.apply(stack, [index, 0].concat(incl));
    return { index: (index + incl.length) };
}

// console.log(splitExpand(eazy)(context).reduce(function(acc, curr) {
//     return acc.concat(curr.value);
// }, ""));

var content_html = [
    "@extend{layout_html}",

    "@block{ title } Content Layout @block{}",

    "@block{ main }",
    "<div id=\"content\">",
    "@super{}",
    "<ul id=\"listing\">",
    "@for{sport, index in sports}",
    "<li><span>@eval{index + 1}</span> - @{sport.name}</li>",
    "@end{}",
    "</ul>",
    "</div > ",
    "@block{}",

    "@extend{}"
].join("");

var simple_html = [
    "@extend{layout_html}",

    "@block{ title } Simple Layout @block{}",

    "@block{ main }",
    "<div id=\"content\">",
    "@super{}",
    "<p>It's your birthday!!</p>",
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

//Now dealing with layouts
// console.log(splitTemplate(simple_html).reduce(function(acc, curr) {
//     return acc.concat(curr.value);
// }, ""));

// console.log(splitTemplate(layout_html).reduce(function(acc, curr) {
//     return acc.concat(curr.value);
// }, ""));

// console.log(expandExtend(splitTemplate(simple_html)).reduce(function(acc, curr) {
//     return acc.concat(curr.value);
// }, ""));

function expandExtend(stack) {
    var index = 0;
    //store @extend tag
    var ext_tag = stack.splice(index, 1)[0];

    //read child first
    var block;
    var blocks = {};
    var supers = {};
    var block_index;
    //find block elements
    while (index < stack.length) {
        var entry = stack[index];
        if (entry.matched == "@extend{}") {
            console.log("end of " + entry.matched + " directive reached");
            stack.splice(index, 1);
            break;
        } else if (entry.matched.startsWith("@extend{")) {
            console.log("must be a nested @extend. Go back to splitTemplate()");
            throw Error('nested @extend not currently a valid construct');
        } else if (entry.matched == "@block{}") {
            console.log("end of '" + block + "' @block definition reached");
            blocks[block] = stack.splice(block_index, (index - block_index));
            stack.splice(block_index, 1);
            index = block_index;
            continue;
        } else if (entry.matched == "@super{}") {
            console.log("@super directive encoutered for '" + block + "'block");
            var insert_index = index;
            supers[block] = function(array) {
                blocks[block].splice.apply(blocks[block], [insert_index, 1].concat(array));
            };
            stack.splice(index, 1);
            continue;
        } else if (entry.matched.startsWith("@block{")) {
            block = entry.value.trim();
            block_index = index;
            console.log("start of '" + block + "' @block definition");
            stack.splice(index, 1);
            continue;
        } else {
            console.log("skipping item");
        }
        ++index;
    }

    //split layout and merge blocks
    index = 0;
    var ext_name;
    var slot, slot_index;
    var layout = splitTemplate(loadTemplate(ext_tag.value));
    while (index < layout.length) {
        var entry = layout[index];
        if (entry.matched == "@slot{}") {
            console.log("end of '" + slot + "' @slot reached");
            //insert @super content into block
            if (supers[slot]) {
                supers[slot](layout.splice(slot_index, (index - slot_index)));
            }
            //replace slot with @block content
            if (blocks[slot]) {
                layout.splice.apply(layout, [slot_index, (index - slot_index)].concat(blocks[slot]));
            } else {
                throw Error("There is no block defined for '" + slot + "' slot");
            }
            index = slot_index + blocks[slot].length;
            layout.splice(index, 1);
            continue;
        } else if (entry.matched.startsWith("@slot{")) {
            console.log("start of '" + entry.matched + "' encountered");
            layout.splice(index, 1);
            slot = entry.value.trim();
            slot_index = index;
            continue;
        } else if (entry.matched == "@extend{}") {
            console.log("must be end of a nested '" + entry.matched + "' extend tag");
            layout.splice(index, 1);
            return layout;
        } else if (entry.matched.startsWith("@extend{")) {
            console.log("start of nested '" + entry.matched + "' extend tag");
            ext_name = entry.value;
            var nested = splitTemplate(loadTemplate(entry.value));
            layout.splice.apply(layout, [index, 1].concat(nested));
            index += nested.length;
            continue;
        } else {
            console.log("skip item");
        }
        index++;
    }
    return layout;
}

function splitExpandLayout(template) {
    return function(context) {
        return expandTemplate(0, expandExtend(splitTemplate(template)), context);
    }
}

// console.log(splitExpandLayout(content_html)(context).reduce(function(acc, curr) {
//     return acc.concat(curr.value);
// }, ""));