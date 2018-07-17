var model = {
    sports: [{
        rank: 1,
        name: 'rugby'
    }, {
        rank: 2,
        name: 'field'
    }, {
        rank: 3,
        name: 'soccer'
    }, {
        rank: 4,
        name: 'biking'
    }]
};

var Tmpl = require('./templr.js');
var he = require('./he.js');

let selector = "#app";

let App = function(){};
App.prototype.compile = function(template, model){
    var markup = Tmpl.loadTemplate(template);
    var expanded = Tmpl.splitExpandLayout(he.decocde(markup))(model);
    console.log(expanded);
    return expanded;
};
App.prototype.render = function(expanded){
    var markup = expanded.reduce(function(acc, curr) {
        return acc.concat(curr.value || "");
    }, "");

    return function(dom){
        if(document){
            //render content
            var range = document.createRange();
            var target = document.querySelector(dom);
            //make 'target' the context node
            range.selectNode(target);
            //create node from text
            var frag = range.createContextualFragment(markup);
            //replace target
            target.parentNode.replaceChild(frag, target);
        }
        else{
            console.log('document object not available');
        }
    }
}

let app = new App();
var compiled = app.compile("fs:system/partials/listing.jst", model);
var renderer = app.render(compiled);
(function(){
    if(window){
        window.onload = ()=>renderer(selector);
    }
})();
