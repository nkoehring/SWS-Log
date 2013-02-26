all:
	haml -t ugly index.haml > index.html
	sass -t compressed css/style.sass > css/style.css
	coffee -o js/ -c js/weblog.coffee
