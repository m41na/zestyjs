function now() {
    return new java.text.SimpleDateFormat("hh:mm:ss").format(new java.util.Date());
}

function TodosView() {}

TodosView.prototype.getLayout = function() {
    return 'www/themes/basic/basic.ftl';
};

TodosView.prototype.getTemplate = function() {
    return "<p>The current date and time is ${now}.</p>";
};

TodosView.prototype.getModel = function() {
    return { "now": now() };
};

TodosView.prototype.outputName = function() {
    return 'index';
};