(function($) {
        
  var app = $.sammy('#content', function() {
    this.around(function(callback) {
      this.app.swap('');
      var cntxt = this;

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

        $('#tags').text("");
        tags_sorted = Object.keys(cntxt.tags).sort();
        $.each(tags_sorted, function(i, tag) {
          n = cntxt.tags[tag];
          tag_href = "#tag/"+tag.replace(/ /g, "%20");
          tag_string = tag.replace(/ /g, '&nbsp;');
          elem = $('<li><a href="'+tag_href+'">'+tag_string+'</a></li>');
          elem.css("font-size", (1+((n-median)/5))+"em");
          $('#tags').append(elem);
        });
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
      cntxt.setIndex();
      cntxt.createTagCloud();

      var a_id = this.params['id'];
      if (!this.articles[a_id]) { return this.notFound(); }

      this.load('/articles/'+a_id).then(function(article) {
        $('[id$=_content]').hide();
        rendered_article = convert(article);
        $('#'+a_id+'_content').html(rendered_article).slideDown();
        $('body').scrollTop($('#'+a_id).offset().top);
      });
    });

    this.get('#tag/:tag', function(cntxt) {
      cntxt.tag_filter = this.params['tag'];
      cntxt.setIndex();
      cntxt.createTagCloud();
    });

    this.get('#/', function(cntxt) {
      cntxt.setIndex();
      cntxt.createTagCloud();
    });

  });

  $(function() { app.run('#/'); });

})(jQuery);

