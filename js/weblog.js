(function($) {
        
  var app = $.sammy('#content', function() {
    this.around(function(callback) {
      this.app.swap('');
      var cntxt = this;

      cntxt.createAboutPage = function() {
        title = "<h2>Über mich</h2>";
        this.load('/articles/about').then(function(article) {
          rendered_article = convert(article);
          cntxt.$element().html(title).append(rendered_article);
        });

      }

      cntxt.autoTag = function(stamp) {
        unixmillies = parseInt(stamp)*1000; // we need milliseconds since epoch for Date
        article_year = (new Date(unixmillies)).getFullYear();
        current_year = (new Date).getFullYear();
        article = cntxt.articles[stamp];

        // need to check against doubles
        if (article.tags.indexOf(""+article_year) < 0) article.tags.push(""+article_year);
        if (article_year < current_year && article.tags.indexOf("archive") < 0)
          article.tags.push("archive");
        return true;
      }

      cntxt.createTagsHTML = function(elem, tag_hash_or_list, median) {
        if (!median) median = 0;
        elem = $(elem);
        elem.text("");

        if (isArray(tag_hash_or_list)) tags_sorted = tag_hash_or_list.sort();
        else tags_sorted = Object.keys(tag_hash_or_list).sort();

        $.each(tags_sorted, function(i, tag) {
          if (isArray(tag_hash_or_list)) n = 1;
          else n = tag_hash_or_list[tag];
          tag_href = "#tag/"+tag.replace(/ /g, "%20");
          tag_string = tag.replace(/ /g, '&nbsp;');
          tag_obj = $('<li><a href="'+tag_href+'">'+tag_string+'</a></li>');
          tag_obj.css("font-size", (1+((n-median)/5))+"em");
          elem.append(tag_obj);
        });
        return elem;
      }

      cntxt.setIndex = function() {
        $.each(cntxt.articles_sorted, function(i, stamp) {
          attrs = cntxt.articles[stamp];
          unixmillies = parseInt(stamp)*1000; // we need milliseconds since epoch for Date
          date = new Date(unixmillies);
          cntxt.autoTag(stamp);

          html = '<article id="'+stamp+'">'+
            '<a href="#/'+stamp+'"><h2>'+attrs.title+'</h2><span class="date">'+prettyDate(date)+
            '</span></a>'+'<div id="'+stamp+'_content"></div></article>';

          if (attrs.tags.indexOf(cntxt.tag_filter) >= 0) {
            cntxt.$element().prepend(html);
          } else if (!cntxt.tag_filter && attrs.tags.indexOf("archive") == -1) {
            cntxt.$element().prepend(html);
          }
        });
        if (!cntxt.tag_filter)
          cntxt.$element().append('<a href="#tag/archive"><h3>view archived articles</h3></a>');
        else if (cntxt.tag_filter == "archive")
          cntxt.$element().append('<a href="#/"><h3>view current articles</h3></a>');
      }

      cntxt.createTagCloud = function() {
        cntxt.tags = {};
        median = 0;
        total = 0;

        $.each(cntxt.articles, function(i, attrs) {
          $.each(attrs.tags, function(j, tag) {
            total++;
            if (tag in cntxt.tags) cntxt.tags[tag]++;
            else {
              median++;
              cntxt.tags[tag] = 1;
            }
          });
        });
        median = total/median;
        cntxt.createTagsHTML("#tags", cntxt.tags, median);
      }

      if (!cntxt.articles) {
        cntxt.load('/articles.json?v=1316385264', {json: true}).then(function(data) {
          cntxt.articles_sorted = Object.keys(data.articles).sort();
          cntxt.articles = data.articles;
          cntxt.options = data.options;
        }).then(callback);
      } else {
        callback();
      }
    });

    this.get('#/:id', function(cntxt) {

      var a_id = this.params['id'];
      if (!cntxt.articles[a_id]) { return this.notFound(); }

      if (cntxt.articles[a_id].tags.indexOf("archive") >= 0) cntxt.tag_filter = "archive";
      cntxt.setIndex();
      cntxt.createTagCloud();

      this.load('/articles/'+a_id).then(function(article) {
        $('[id$=_content]').hide();

        unixmillies = parseInt(a_id)*1000; // we need milliseconds since epoch for Date
        date = new Date(unixmillies);
        pretty_date = '<div class="pretty_date">'+prettyDate(date)+'</div>';

        /* currently fixed, may be changed some day */
        author = '<div class="author"><a href="http://about.me/nkoehring">nkoehring</a></div>';

        tag_hash = cntxt.articles[a_id].tags
        tag_list = '<ul id="'+a_id+'_tags" class="tags"></ul>'
        tag_list = cntxt.createTagsHTML(tag_list, tag_hash, 1);

        info_block = $('<div class="info_block"></div>');
        info_block.append(pretty_date);
        info_block.append(author);
        info_block.append(tag_list);

        rendered_article = convert(article);

        $('body').animate({'scrollTop': $('#'+a_id).offset().top - 20}, 500);

        $('#'+a_id).addClass("open");
        $('#'+a_id+'_content').html(info_block).append(rendered_article).slideDown('500');
      });
    });

    this.get('#tag/:tag', function(cntxt) {
      cntxt.tag_filter = this.params['tag'];
      cntxt.setIndex();
      cntxt.createTagCloud();
    });

    this.get('#about/', function(cntxt) {
      cntxt.createAboutPage();
      cntxt.createTagCloud();
    });

    this.get('#/', function(cntxt) {
      cntxt.setIndex();
      cntxt.createTagCloud();
    });

  });

  $(function() {
    $('body > header').click(function() {location.href = '#/';});
    app.run('#/');
  });

})(jQuery);

