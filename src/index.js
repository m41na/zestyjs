import model  from './model';
import Templr from '../system/templr3.js';
import tpl_listing from '../system/partials/listing.jst';
import tpl_layout from '../system/partials/layout.jst';
import tpl_widget from '../system/partials/widget.jst';
import tpl_main from '../system/partials/main.jst';

let selector = "#app";

let App = function(){};

App.prototype.compile = function(selector){
    return new Templr(selector);
};

App.prototype.render = function(expanded){
    let compiled = expanded;

    return function(dom, model){
        if(document){
            let markup = compiled.render(model);
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
var compiled = app.compile(tpl_listing);
var renderer = app.render(compiled);
(function(){
    if(window){
        window.onload = ()=>renderer(selector, model);
    }
})();
