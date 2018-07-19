var Tmpl = require('./templr.js');

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

console.log(Tmpl.objProp('age', { age: 30 }));
console.log(Tmpl.objProp('profile[\'reg-addr\'][0].type', context));

console.log(Tmpl.resProp('profile[age]')(context));
console.log(Tmpl.resProp('profile[\'reg-addr\'][0].type')(context));
console.log(Tmpl.resProp('profile[reg-addr][1].type')(context));

console.log(Tmpl.resExpr('ctx.age > 30')({ ctx: { name: 'mike', age: 20 } }));
console.log(Tmpl.resExpr("ctx['age'] > 30 && ctx.age > 35")({ ctx: { name: 'mike', age: 40 } }));
console.log(Tmpl.resExpr("age > 30")({ name: 'mike', age: 40 }));var cozy = [
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

var eazy = "<div id='parent'>@slot{main}child content@slot{}</div>";

console.log(Tmpl.forParams("abs, xyc in letters"));
console.log(Tmpl.forParams("abc in letters"));

var model = { xyz: 10, list: [10, 20, 25, 40], x: 25, profile: { name: 'mike', age: 30 } };

var simple0 = "do eval @eval{(xyz / 2) > 10} retrieve value @{profile.name}";
var simple1 = "do eval @eval{(xyz * 2) > 10} start if @if{list[2] >= 30} if matched @else{} else matched @end{} retrieve value @{profile.name}";
var simple2 = "do eval @eval{(xyz * 2) > 10} start if @if{list[2] >= 30} if matched @else{list[2] < 30} elif matched @end{} retrieve value @{profile.name}";
var simple3 = "do eval @eval{(xyz ^ 2) > 10} start if @if{list[2] == 25} if matched @else{list[2] == 40} elif matched @else{} else matched @end{} retrieve value @{profile.name}";
var simple4 = "do eval @eval{(xyz - 2) > 10} start if @if{list[2] >= 30} if matched @else{list[2] == 40} elif matched @else{} else matched @end{} retrieve value @{profile.name}";
var simple5 = "do eval @eval{(xyz + 2) > 10} start for @for{a in list} <p>@{a}</p> @end{} end for @end{} retrieve value @{profile.name}";
var simple6 = "do eval @eval{(xyz - 2) > 10} start for @for{elem, index in list} <p data-index='@{index}'>@{elem}</p> start if @if{elem > 30} if matched @else{elem < 30} elif matched @else{} else matched @end{} end for @end{} retrieve value @{profile.name}";

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

// console.log(Tmpl.splitTemplate(simple_html).reduce(function(acc, curr) {
//     return acc.concat("\n" + curr.value || curr.matched || "");
// }, ""));

// console.log(Tmpl.splitTemplate(layout_html).reduce(function(acc, curr) {
//     return acc.concat(curr.value);
// }, ""));

console.log(Tmpl.expandExtend(Tmpl.splitTemplate(simple_html)).reduce(function(acc, curr) {
    return acc.concat(curr.value + "\n");
}, ""));
