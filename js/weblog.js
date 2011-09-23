(function($) {
        
  var app = $.sammy('#content', function() {
    this.around(function(callback) {
      this.app.swap('');
      var cntxt = this;

      var autoTag = function(stamp) {
        unixmillies = parseInt(stamp)*1000; // we need milliseconds since epoch for Date
        article_year = (new Date(unixmillies)).getFullYear();
        current_year = (new Date).getFullYear();
        article = cntxt.articles[stamp];

        article.tags.push(""+article_year);
        if (article_year < current_year) article.tags.push("archive");
        return true;
      }

      var setIndex = function(filter_callback) {
        $.each(cntxt.articles_sorted, function(i, stamp) {
          attrs = cntxt.articles[stamp];
          unixmillies = parseInt(stamp)*1000; // we need milliseconds since epoch for Date
          date = new Date(unixmillies);
          autoTag(stamp);

          cntxt.$element().prepend(
            '<article id="'+stamp+'">'+
            '<a href="#/'+stamp+'"><h2>'+attrs.title+'</h2><span class="date">'+prettyDate(date)+
            '</span></a>'+'<div id="'+stamp+'_content"></div></article>');
        });
      }

      var createTagCloud = function() {
        tags = {};
        median = 0;
        total = 0;
        $.each(cntxt.articles, function(i, attrs) {
          $.each(attrs.tags, function(j, tag) {
            total++;
            if (tag in tags) tags[tag]++;
            else {
              median++;
              tags[tag] = 1;
            }
          });
        });
        median = total/median;

        $('#tags').text("");
        tags_sorted = Object.keys(tags).sort();
        $.each(tags_sorted, function(i, tag) {
          n = tags[tag];
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
          setIndex();
          createTagCloud();
        }).then(callback);
      } else {
        setIndex();
        callback();
      }
    });

    this.get('#/:id', function(context) {
      var a_id = this.params['id'];
      if (!this.articles[a_id]) { return this.notFound(); }

      this.load('/articles/'+a_id).then(function(article) {
        $('[id$=_content]').hide();
        rendered_article = convert(article);
        $('#'+a_id+'_content').html(rendered_article).slideDown();
        $('body').scrollTop($('#'+a_id).offset().top);
      });
    });

    this.get('#tag/:tag', function(context) {
      console.log(this.params['tag']);
    });

    this.get('#/', function(context) {

    });

  });

  $(function() { app.run('#/'); });

})(jQuery);

