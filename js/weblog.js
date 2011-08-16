(function($) {
        
  var app = $.sammy('#content', function() {
    this.around(function(callback) {
      this.app.swap('');
      var cntxt = this;

      var setIndex = function() {
        $.each(cntxt.articles, function(i, attrs) {
          cntxt.$element().append(
            '<article id="'+i+'">'+
            '<a href="#/'+i+'"><h2>'+attrs.title+'</h2></a>'+
            '<div id="'+i+'_content"></div></article>');
        });
      }

      if (!cntxt.articles) {
        cntxt.load('/articles.json').then(function(data) {
          cntxt.articles = data;
          setIndex();
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
        rendered_article = textile(article);
        $('#'+a_id+'_content').html(rendered_article).show();
        $('body').scrollTop($('#'+a_id).offset().top);
      });
    });

    this.get('#/', function(context) {
    });

  });

  $(function() { app.run('#/'); });

})(jQuery);

