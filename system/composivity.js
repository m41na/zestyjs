var Tmpl = require('./templr.js');

var ctx = {x: 5};
var ex1 = 'x < 5';
var ex2 = 'x > 10';
var ex3 = 'x >= 5';
var ex4 = 'x == 5';

if(Tmpl.resExpr(ex1)(ctx)){
    console.log(`${ex1} is true`);
}
else if(Tmpl.resExpr(ex2)(ctx)){
    console.log(`${ex2} is true`);
}
else if(Tmpl.resExpr(ex3)(ctx)){
    console.log(`${ex3} is true`);
}
else if(Tmpl.resExpr(ex4)(ctx)){
    console.log(`${ex4} is true`);
}
else{
    console.log(`none is true`);
}

//if statement using functional construct
var doif = function(options){
    return function(ctx){
        return options.find(op=>Tmpl.resExpr(op)(ctx));
    }
} 
console.log(doif([ex1,ex2,ex3,ex4])(ctx));

for(var i = 0; i < 5; i++){
    console.log(`i = ${i}`);
}

var numbers = {
    one: 'moja',
    two: 'mbili',
    three: 'tatu',
    four: 'nne'
}
//for loop using functional construct
Object.keys(numbers).map((e, i)=>console.log(`${e} = ${numbers[e]}`));
var dofor = function(cursor, key, expr){
    return function(elements){
        if(Array.isArray(elements)){
            return elements.map((e, i)=>{
                var local = {};
                local[key] = i;
                local[cursor] = e;
                var res = Tmpl.resProp(expr)(local);
                return res;
            });
        }
        else if(elements && typeof elements === 'object' && elements.constructor === Object){
            return Object.keys(elements).map(e=>{
                var local = {};
                local[key] = e;
                local[cursor] = elements[e];
                var res = Tmpl.resProp(expr)(local);
                return res;
            });
        }
        else{
            throw Error('cannot enumerate object values');
        }
    }
}

console.log(dofor("num", "i", "num")(Object.keys(numbers)));
console.log(dofor("num", "i", "num")(numbers));

for(var e in numbers){
    if(e === 'one'){
        console.log(`${e} - numero uno!!`);
    }
    else{
        console.log(`${e} - better luck next time`);
    }
}

//composing for with if
var options = dofor("num", "i", "num")(Object.keys(numbers)).map(e=>{
    var val = {};
    val['e'] = e;
    return val;
});

options.forEach(e=>{
    doif(["e == 'one'"])(e);
});

var markup = [
    "<ul class='skills'>",
    "@for{skill in skills}",
    "<li>@{skill}</li>",
    "@end{}",
    "</ul>"];

var splits = [
    {matched: "", value: "<ul class='skills'>"},
    {matched: "@for{skill in skills}", value: "skill in skills"},
    {matched: "", value: "<li>"},
    {matched: "@{skill}", value: "skill"},
    {matched: "", value: "</li>"},
    {matched: "@end{}", value: ""},
    {matched: "", value: "</ul>"}
];

var values = {skills: ['C++', 'Java', 'Ruby', 'C', 'Python']};

function doFor(start, stack){
    var index = start;
    while(index < stack.length){
        var item = stack[index];
        if(item.matched == ""){
            var val = item.value;
            item.value = function(){
                return val;
            }
        }
        else if(item.matched.startsWith("@for{")){
            var last = index + 1;
            var item = stack[last];
            while(item.matched != "@end{}"){
                item = stack[++last];
            }
            
            console.log(`@for elements are between ${index} and ${last}`);
            var for_params = Tmpl.forParams(stack[index].value);
            var replacement = {
                matched: "",
                value: new function(){
                    return function(context){
                        var cur = for_params.cursor;
                        return context[for_params.elements].map((el, i)=>{
                            var ctx = {};
                            ctx[cur] = el;
                            if(for_params.key) context[key] = i;
                            var stack_copy = spliced.slice(1, spliced.length).map(e=>{return {matched: e.matched, value: e.value};});
                            var for_target = Tmpl.expandTemplate(0, stack_copy);
                            var expanded = for_target(ctx);
                            return expanded;
                        });
                    }
                }
            }
            //replace stack items
            var spliced = stack.splice(index, last, replacement);
            last = index;
        }
        index++;
    }
    return stack;
}

console.log(doFor(0, splits).reduce(function(acc, curr) {
    return acc.concat(curr.value(values));
}, ""));