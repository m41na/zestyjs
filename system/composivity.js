var source = `
<div id="content">
    @for{post, id in posts}
    <div class="post" data-v-for="post, id in posts">
        <h1 data-v-title data-on-click="edit(@{id})">@{post.title}</h1>
        <h3>By <span data-author>@{post.author}</span></h3>
        <p data-body>@{post.body}</p>
    </div>
    @end{}
    <form>
        <input data-title.bind/><br/> 
        <input data-prop.="author"/><br/>
        <textarea data-prop="title"></textarea>
        <br/>
        <input type="button" data-on-click="send"/><br/>
    </form>
</div>
`;

var Tmpl = require('./templr.js');

function TmplNode(){
    this.match;
    this.value;
    this.parent;
    this.next;
    this.prev;
    this.child;
}

TmplNode.prototype.chidlren = function(){
    var top = child;
    return {
        add(obj){
            obj.prev = top;
            obj.parent = this;
            this.child.next = obj;
            top = obj;
            return top;
        },
        get(){
            var children = [];
            var next;
            while((next = child.next) != null){
                children.push(next);
            }
            return children;
        },
        pop(){
            top--;
            return this.children.pop;
        },
        head(){
            return this.children[top];
        },
        size(){
            return this.children.length;
        },
        back(){
            if(top - 1 > 0){
                return arr[--top];
            }
        }
    }
}

var regex = /(@for\{(.+?)\})|(@end\{\})|(@\{(.+?)\})/g;
var match;
var wip = tokens();
var start = 0;
var text;
while((match = regex.exec(source)) != null){
    var matched = match[0];
    
    text = source.substring(start, match.index);
    if (text.trim().length > 0) {
        wip.add({match: "", value: text});
        console.log(text);
    }

    if(matched.startsWith("@for{")){
        wip.add({match: matched, value: match[2]});
        console.log(matched);
    }
    else if(matched.startsWith("@{")){
        wip.add({match: matched, value: match[6]});
        console.log(matched);
    }
    else if(matched == "@end{}"){
        wip.add({match: matched, value: match[4]});
        console.log(matched);
    }
    else{
        console.log("unsupported match encoutered - " + matched);
    }
    start = regex.lastIndex;
}

text = source.substring(start);
if (text.trim().length > 0) {
    wip.add({ match: "", value: text });
    console.log(text);
}

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
