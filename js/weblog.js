(function($) {
        
  var app = $.sammy('#content', function() {
    this.around(function(callback) {
      this.app.swap('');
      var cntxt = this;

      var setIndex = function() {
        $.each(cntxt.articles, function(i, attrs) {
          cntxt.$element().prepend(
            '<article id="'+i+'">'+
            '<a href="#/'+i+'"><h2>'+attrs.title+'</h2></a>'+
            '<div id="'+i+'_content"></div></article>');
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
        $.each(tags, function(tag, n) {
          elem = $('<li><a href="#tag/'+tag+'">'+tag+'</a></li>');
          elem.css("font-size", (1+((n-median)/5))+"em");
          $('#tags').append(elem);
        });
      }

      if (!cntxt.articles) {
        cntxt.load('/articles.json').then(function(data) {
          cntxt.articles = data;
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
        article = article.replace("\n", " ");
        rendered_article = textile(article);
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
