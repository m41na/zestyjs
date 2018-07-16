;(function(dom, template) {
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
    var markup = document.querySelector(template);
    var expanded = splitExpandLayout(he.decode(markup.innerHTML))(model).reduce(function(acc, curr) {
        return acc.concat(curr.value || "");
    }, "");
    console.log(expanded);

    //render content
    var range = document.createRange();
    var target = document.querySelector(dom);
    //make 'target' the context node
    range.selectNode(target);
    //create node from text
    var frag = range.createContextualFragment(expanded);
    //replace target
    target.parentNode.replaceChild(frag, target);
})("#app", "#listing");