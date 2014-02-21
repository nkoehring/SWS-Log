clean:
	rm index.html
	rm css/style.css
	rm js/weblog.min.js
	rm js/libs.min.js

all:
	haml -t ugly index.haml > index.html
	sass -t compressed css/style.sass > css/style.css
	coffee -pc js/weblog.coffee | uglifyjs - > js/weblog.min.js
	cat js/libs/*.js | uglifyjs - > js/libs.min.js

