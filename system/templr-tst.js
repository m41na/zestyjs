let TmplTest = {};

TmplTest.context = {
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

TmplTest.sports_data = {sports: [{name: "rugby"}, {name: "soccer"}, {name: "tennis"}]};

TmplTest.cozy = [
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

TmplTest.dozy = [
    "<ul class='sports'>",
    "@for{sport in sports}",
    "@if{sport.rank == 1}",
    "<li data-rank='@eval{sport.rank * 20}'>@{sport.name}</li>",
    "@elif{sport.rank == 2}",
    "<li data-rank='@eval{sport.rank * 15}'>@{sport.name}</li>",
    "@elif{sport.rank == 3}",
    "<li data-rank='@eval{sport.rank * 10}'>@{sport.name}</li>",
    "@else{}",
    "<li data-rank='none'>@{sport.name}</li>",
    "@end{}",
    "@end{}",
    "</ul>"
].join("");

TmplTest.eazy = "<div id='parent'>@slot{main}child content@slot{}</div>";

TmplTest.model = { xyz: 10, list: [10, 20, 25, 40], x: 25, profile: { name: 'mike', age: 30 } };

TmplTest.simple0 = "do eval @eval{(xyz / 2) > 10} retrieve value @{profile.name}";
TmplTest.simple1 = "do eval @eval{(xyz * 2) > 10} start if @if{list[2] >= 30} if matched @else{} else matched @end{} retrieve value @{profile.name}";
TmplTest.simple2 = "do eval @eval{(xyz * 2) > 10} start if @if{list[2] >= 30} if matched @elif{list[2] < 30} elif matched @end{} retrieve value @{profile.name}";
TmplTest.simple3 = "do eval @eval{(xyz ^ 2) > 10} start if @if{list[2] == 25} if matched @elif{list[2] == 40} elif matched @else{} else matched @end{} retrieve value @{profile.name}";
TmplTest.simple4 = "do eval @eval{(xyz - 2) > 10} start if @if{list[2] >= 30} if matched @elif{list[2] == 40} elif matched @else{} else matched @end{} retrieve value @{profile.name}";
TmplTest.simple5 = "do eval @eval{(xyz + 2) > 10} start for @for{a in list} <p>@{a}</p> @end{} end for @end{} retrieve value @{profile.name}";
TmplTest.simple6 = "do eval @eval{(xyz - 2) > 10} start for @for{elem, index in list} <p data-index='@{index}'>@{elem}</p> start if @if{elem > 30} if matched @elif{elem < 30} elif matched @else{} else matched @end{} end for @end{} retrieve value @{profile.name}";

TmplTest.sports_html = [
    "@extend{Data.simple_html}",

    "@block{ wrapped }",
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

TmplTest.yellow_html = [
    "@extend{Data.simple_html}",

    "@block{ wrapped }",
    "<p>YELLOW HERE!</p > ",
    "@block{}",

    "@extend{}"
].join("");

TmplTest.simple_html = [
    "@extend{Data.layout_html}",

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

TmplTest.layout_html = [
    "<div id=\"layout\">",

    "<div id=\"title\">@slot{title}Placeholder Title@slot{}</div>",

    "<div id=\"app\">",
    "@slot{ main }",
    "<h3>Messages</h3>",
    "@slot{}",
    "</div >",

    "</div>"
].join("");

TmplTest.complex_html = [
    "<div id=\"app\">",
    "<h3>sports</h3>",
    "<ul id=\"listing\">",
    "@for{sport, index in sports}",
    "<li><span>@eval{index + 1}</span> - @{sport.name}</li>",
    "@end{}",
    "</ul>",
    "",
    "<div>",
    "@if{sports[0].rank == 2}",
    "<p style=\"background-color:green;\">@{sports[0].name}</p>",
    "@else{}",
    "<p style=\"background-color:red;\">@{sports[0].name}</p>",
    "@end{}",
    "</div>",
    "",
    "<ul id=\"listing-1\">",
    "@for{sport, index in sports} @if{(index % 2 ) > 0}",
    "<li style=\"background-color:yellow;\"><span>@eval{index + 1}</span> - @{sport.name}</li>",
    "@else{}",
    "<li style=\"background-color:blue;\"><span>@eval{index + 1}</span> - @{sport.name}</li>",
    "@end{} @end{}",
    "</ul>",
    "",
    "<ul id=\"listing-3\">",
    "@for{sport, index in sports} @if{(index % 3 ) > 0}",
    "<li style=\"background-color:orange;\"><span>@eval{index + 1}</span> - @{sport.name}</li>",
    "@else{}",
    "<li style=\"background-color:indigo;\"><span>@eval{index + 1}</span> - @{sport.name}</li>",
    "@end{} @end{}",
    "</ul>",
    "</div>"
].join("");

TmplTest.if_html = [
    "<div>",
    "@set{x = 1} @if{ x > 3 } @{x} greater @elif{x == 3} equal @else{} less @end{}",
    "@eval{x*10}",
    "</div>"
].join("");

TmplTest.if_data = {x: 3};

TmplTest.for_html = [
    "<div>",
    "@for{ item, y in list} @{y} - @{item.a} awesome @end{}",
    "@eval{x*10}",
    "</div>"
].join("");

TmplTest.for_data = {x: 3, list: [{a:'one'},{a:'two'},{a:'three'}]};

TmplTest.line1 = "@for{ab in two} do @end @if{x>2} x>2 @elif{x<2} x<2 @else{} value=@{x} @end{} @end{} @set{b=2} @eval{b==2}";
TmplTest.line2 = "<parent>@slot{line} parent content @slot{}</parent>";
TmplTest.line3 = "@extend{line2} @block{line}@super{} <br/> show content@block{} @extend{}";

module.exports = TmplTest;
