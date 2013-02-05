class Weblog
  articles: {}
  tags: {}
  options: {}
  events: {}
  articleFilter: ""
  content: 'content'
  spinner: 'spinner'
  articleTemplate: '''
    <article id="a{id}">
      <a href="#{id}" class="title">
        <span class="date">{date}</span>
        <h2>{title}</h2>
      </a>
      <div id="c{id}" class="content">
        <div class="info_block">
          <div class="pretty_date">{date}</div>
          <div class="author"><a href="http://about.me/nkoehring">nkoehring</a></div>
          <ul id="t{id}" class="tags">{tags}</ul>
        </div>
      </div>
    </article>
  '''
  articleTagTemplate: '<li><a href="#{tag}">{tag}</a></li>'
  tagCloudTagTemplate: '<li style="font-size:{size}"><a href="#{tag}">{tag}</a></li>'


  ## Event handling inspired by MicroEvent
  # See https://github.com/jeromeetienne/microevent.js
  bind: (event, func)->
    @events[event] = [] unless @events[event]
    @events[event].push(func)

  unbind: (event, func)->
    return false unless event of @events
    @events[event].splice(@events[event].indexOf(func), 1)

  trigger: (event)->
    return false unless event of @events
    e.apply(@, Array.prototype.slice.call(arguments, 1)) for e in @events[event]


  # filter for shown articles
  # uses @articleFilter as filter string
  #
  # filter string can be prefixed with "tag:" to directly filter for a tag
  filtered: (stamp)->
    filter = @articleFilter.toLowerCase()
    return false if filter.length == 0
    console.log "filtering", filter

    if filter.indexOf("tag:") == 0    # it's a tag filter
      filter = filter.slice(4)
      return (filter not in @articles[stamp].tags.map("toLowerCase"))
    else
      return (@articles[stamp].title.toLowerCase().indexOf(filter) < 0)


  clearContentArea: ->
    @content.clean()


  generateTagList: ->
    total = 0
    unique = 0
    median = 0
    @tags = []

    for stamp,article of @articles
      continue if @filtered(stamp)
      for tag in article.tags
        total++
        unless tag of @tags
          @tags[tag] = 0
          unique++
        @tags[tag]++

    median = total/unique

    $('tags').clean()
    for tag in Object.keys(@tags).sort()
      template = tpl @tagCloudTagTemplate,
        tag: tag
        size: (1+(@tags[tag]-median)/5)+"em"
      $('tags').append(template)


  filterForTag: (tag)->
    @articleFilter = "tag:#{tag}"
    @trigger "article-update"


  addArticle: (stamp, title, tags)->
    self = this
    templated_tags = []
    templated_tags.push(tpl(@articleTagTemplate, {tag:t})) for t in tags
    template = tpl @articleTemplate,
      id: stamp
      title: title
      date: prettyDate(new Date(parseInt(stamp)*1000)) # yes, millis since epoch
      tags: templated_tags

    @content.append(template)


  loadArticle: (id, force=false)->
    article = $("a#{id}")
    if force or not article.hasClass('loaded')
      self = this
      content = $("c#{id}")
      Xhr.load "articles/#{id}",
        onSuccess: (req)->
          content.append textile(req.responseText)
          article.addClass('loaded')
          self.trigger "article-loaded", id
          
        onFailure: (e, req)->
          console.log "failed to load article #{id}"
    else
      @trigger "article-loaded", id


  openArticle: (id)->
    article = $("a#{id}")
    content = $("c#{id}")

    article.addClass('open')
    content.show('slide')

    @scrollFx.start
      y: article.position().y


  update: ->
    for stamp in Object.keys(@articles).sort().reverse()
      @addArticle(stamp, @articles[stamp].title, @articles[stamp].tags) unless @filtered(stamp)


  reset: ->
    @articleFilter = ""
    @trigger 'article-update'


  closeArticles: ->
    $$('article.open').each (e,i)->
      e.removeClass "open"
      e.children(".content").each "hide"


  checkFragment: (e)->
    @closeArticles()
    if location.hash
      # check for article ids first, then for tags
      hash = location.hash.substring(1)
      @trigger 'article-open', hash if hash of @articles
      @trigger 'tags-list', hash if hash of @tags
    else
      @reset


  constructor: ->
    self = this
    @content = $(@content)
    @spinner = $(@spinner)
    @scrollFx = new Fx.Scroll(document.body)
    Xhr.Options.spinner = @spinner

    @bind 'article-update', @clearContentArea
    @bind 'article-update', @update
    @bind 'article-update', @generateTagList
    @bind 'article-open', @closeArticles
    @bind 'article-open', @loadArticle
    @bind 'article-loaded', @openArticle
    @bind 'tags-list', @filterForTag
    window.addEventListener "hashchange", @checkFragment.bind(@)

    Xhr.load 'articles.json',
      onSuccess: (req)->
        self.articles = req.responseJSON.articles
        self.options = req.responseJSON.options
        self.trigger 'article-update'
      onFailure: (e, req)->
        @content.update("<h1>Failed to load articles!</h1>")
        @content.append("<p>#{req.status} – #{req.statusText}</p>")


$(document).onReady ->
  window.weblog = new Weblog
 
