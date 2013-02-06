// Generated by CoffeeScript 1.4.0
(function() {
  var Weblog,
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Weblog = (function() {

    Weblog.prototype.articles = {};

    Weblog.prototype.tags = {};

    Weblog.prototype.options = {};

    Weblog.prototype.events = {};

    Weblog.prototype.articleFilter = "";

    Weblog.prototype.content = 'content';

    Weblog.prototype.spinner = 'spinner';

    Weblog.prototype.articleTemplate = '<article id="a{id}">\n  <a href="#{id}" class="title">\n    <span class="date">{date}</span>\n    <h2>{title}</h2>\n  </a>\n  <div id="c{id}" class="content">\n    <div class="info_block">\n      <div class="pretty_date">{date}</div>\n      <div class="author"><a href="http://about.me/nkoehring">nkoehring</a></div>\n      <ul id="t{id}" class="tags">{tags}</ul>\n    </div>\n  </div>\n</article>';

    Weblog.prototype.articleTagTemplate = '<li><a href="#{tag}">{tag}</a></li>';

    Weblog.prototype.tagCloudTagTemplate = '<li style="font-size:{size}"><a href="#{tag}">{tag}</a></li>';

    Weblog.prototype.bind = function(event, func) {
      if (!this.events[event]) {
        this.events[event] = [];
      }
      return this.events[event].push(func);
    };

    Weblog.prototype.unbind = function(event, func) {
      if (!(event in this.events)) {
        return false;
      }
      return this.events[event].splice(this.events[event].indexOf(func), 1);
    };

    Weblog.prototype.trigger = function(event) {
      var e, _i, _len, _ref, _results;
      if (!(event in this.events)) {
        return false;
      }
      _ref = this.events[event];
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        e = _ref[_i];
        _results.push(e.apply(this, Array.prototype.slice.call(arguments, 1)));
      }
      return _results;
    };

    Weblog.prototype.filtered = function(stamp) {
      var filter;
      filter = this.articleFilter.toLowerCase();
      if (filter.length === 0) {
        return false;
      }
      console.log("filtering", filter);
      if (filter.indexOf("tag:") === 0) {
        filter = filter.slice(4);
        return (__indexOf.call(this.articles[stamp].tags.map("toLowerCase"), filter) < 0);
      } else {
        return this.articles[stamp].title.toLowerCase().indexOf(filter) < 0;
      }
    };

    Weblog.prototype.clearContentArea = function() {
      return this.content.clean();
    };

    Weblog.prototype.generateTagList = function() {
      var article, median, stamp, tag, template, total, unique, _i, _j, _len, _len1, _ref, _ref1, _ref2, _results;
      total = 0;
      unique = 0;
      median = 0;
      this.tags = [];
      _ref = this.articles;
      for (stamp in _ref) {
        article = _ref[stamp];
        if (this.filtered(stamp)) {
          continue;
        }
        _ref1 = article.tags;
        for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
          tag = _ref1[_i];
          total++;
          if (!(tag in this.tags)) {
            this.tags[tag] = 0;
            unique++;
          }
          this.tags[tag]++;
        }
      }
      median = total / unique;
      $('tags').clean();
      _ref2 = Object.keys(this.tags).sort();
      _results = [];
      for (_j = 0, _len1 = _ref2.length; _j < _len1; _j++) {
        tag = _ref2[_j];
        template = tpl(this.tagCloudTagTemplate, {
          tag: tag,
          size: (1 + (this.tags[tag] - median) / 5) + "em"
        });
        _results.push($('tags').append(template));
      }
      return _results;
    };

    Weblog.prototype.filterForTag = function(tag) {
      this.articleFilter = "tag:" + tag;
      return this.trigger("article-update");
    };

    Weblog.prototype.addArticle = function(stamp, title, tags) {
      var self, t, template, templated_tags, _i, _len;
      self = this;
      templated_tags = "";
      for (_i = 0, _len = tags.length; _i < _len; _i++) {
        t = tags[_i];
        templated_tags += tpl(this.articleTagTemplate, {
          tag: t
        });
      }
      template = tpl(this.articleTemplate, {
        id: stamp,
        title: title,
        date: prettyDate(new Date(parseInt(stamp) * 1000)),
        tags: templated_tags
      });
      return this.content.append(template);
    };

    Weblog.prototype.loadArticle = function(id, force) {
      var article, content, self;
      if (force == null) {
        force = false;
      }
      article = $("a" + id);
      if (force || !article.hasClass('loaded')) {
        self = this;
        content = $("c" + id);
        return Xhr.load("articles/" + id, {
          onSuccess: function(req) {
            self.articles[id].content = textile(req.responseText);
            content.append(self.articles[id].content);
            article.addClass('loaded');
            return self.trigger("article-loaded", id);
          },
          onFailure: function(e, req) {
            return console.log("failed to load article " + id);
          }
        });
      } else {
        return this.trigger("article-loaded", id);
      }
    };

    Weblog.prototype.openArticle = function(id) {
      var article, content;
      article = $("a" + id);
      content = $("c" + id);
      article.addClass('open');
      content.show('slide');
      return this.scrollFx.start({
        y: article.position().y
      });
    };

    Weblog.prototype.update = function() {
      var stamp, _i, _len, _ref, _results;
      _ref = Object.keys(this.articles).sort().reverse();
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        stamp = _ref[_i];
        if (!this.filtered(stamp)) {
          _results.push(this.addArticle(stamp, this.articles[stamp].title, this.articles[stamp].tags));
        } else {
          _results.push(void 0);
        }
      }
      return _results;
    };

    Weblog.prototype.reset = function() {
      this.articleFilter = "";
      return this.trigger('article-update');
    };

    Weblog.prototype.closeArticles = function() {
      return $$('article.open').each(function(e, i) {
        e.removeClass("open");
        return e.children(".content").each("hide");
      });
    };

    Weblog.prototype.checkFragment = function(e) {
      var hash;
      this.closeArticles();
      hash = location.hash.replace(" ", "");
      if (hash.length > 0) {
        hash = hash.substring(1);
        if (hash in this.articles) {
          this.trigger('article-open', hash);
        }
        if (hash in this.tags) {
          return this.trigger('tags-list', hash);
        }
      } else {
        return this.reset();
      }
    };

    function Weblog() {
      var self;
      self = this;
      this.content = $(this.content);
      this.spinner = $(this.spinner);
      this.scrollFx = new Fx.Scroll(document.body);
      Xhr.Options.spinner = this.spinner;
      this.bind('article-update', this.clearContentArea);
      this.bind('article-update', this.update);
      this.bind('article-update', this.generateTagList);
      this.bind('article-open', this.closeArticles);
      this.bind('article-open', this.loadArticle);
      this.bind('article-loaded', this.openArticle);
      this.bind('tags-list', this.filterForTag);
      window.addEventListener("hashchange", this.checkFragment.bind(this));
      Xhr.load('articles.json', {
        onSuccess: function(req) {
          self.articles = req.responseJSON.articles;
          self.options = req.responseJSON.options;
          return self.trigger('article-update');
        },
        onFailure: function(e, req) {
          this.content.update("<h1>Failed to load articles!</h1>");
          return this.content.append("<p>" + req.status + " – " + req.statusText + "</p>");
        }
      });
    }

    return Weblog;

  })();

  $(document).onReady(function() {
    return window.weblog = new Weblog;
  });

}).call(this);
