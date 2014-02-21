clean:
	rm index.html
	rm css/style.css
	rm js/weblog.min.js
	rm js/libs.min.js

build:
	haml -t ugly index.haml > index.html
	sass -t compressed css/style.sass > css/style.css
	coffee -pc js/weblog.coffee | uglifyjs - > js/weblog.min.js
	cat js/libs/*.js | uglifyjs - > js/libs.min.js
	ruby feed.rb

install:
	rm -r /srv/www/koehr.in/log/*
	mkdir -p /srv/www/koehr.in/log/articles/
	mkdir -p /srv/www/koehr.in/log/css/
	mkdir -p /srv/www/koehr.in/log/js/
	mkdir -p /srv/www/koehr.in/log/img/
	cp articles/* /srv/www/koehr.in/log/articles/
	cp css/*.woff css/style.css /srv/www/koehr.in/log/css
	cp js/*.js /srv/www/koehr.in/log/js/
	cp img/* /srv/www/koehr.in/log/img/
	cp *.html articles.json feed.rss /srv/www/koehr.in/log/

