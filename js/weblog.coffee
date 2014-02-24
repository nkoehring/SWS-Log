class Weblog
  articles: {}
  tags: {}
  options: {}
  events: {}
  articleFilter: ""
  contentElement: 'content'
  spinnerElement: 'spinner'
  filterElement: 'filter'
  filterResetElement: 'filter-reset'
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
      <div class="spinner">&nbsp;</div>
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

  trigger: (event, args...)->
    return false unless event of @events
    e.apply(@, args) for e in @events[event]


  # filter for shown articles
  # uses @articleFilter as filter string
  #
  # filter string can be prefixed with "tag:" to directly filter for a tag
  filtered: (stamp)->
    filter = @articleFilter.toLowerCase()
    return false if filter.length == 0

    if filter.indexOf("tag:") == 0    # it's a tag filter
      filter = filter.slice(4)
      return (filter not in @articles[stamp].tags.map("toLowerCase"))
    else
      return (@articles[stamp].title.toLowerCase().indexOf(filter) < 0)


  updateFilter: (new_filter, tag=false)->
    new_filter = new_filter.trim()

    if new_filter.length > 0
      if tag
        @filterElement.addClass "tag"
        @filterElement.addClass "tag"
      else
        @filterElement.removeClass "tag"

      @filterElement.update(new_filter)
      @filterElement.show()
      @filterResetElement.setStyle
        display: "inline-block"

      new_filter = "tag:#{new_filter}" if tag
    else
      @filterElement.update("")
      @filterElement.hide()
      @filterResetElement.setStyle
        display: "none"

    @articleFilter = new_filter


  clearContentArea: ->
    @contentElement.clean()


  generateTagList: ->
    total = 0
    unique = 0
    median = 0
    @tags = []

    for stamp,article of @articles
      continue if @filtered(stamp)  #TODO: do we really want that?
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
    @trigger "filter-update", tag, true
    @trigger "article-update"


  addArticle: (stamp, title, tags)->
    articleElement = $("a#{stamp}")
    if articleElement?
      @trigger "article-load", stamp if @options.autoload
      articleElement.show()
    else
      article_tags = ""
      article_tags += tpl(@articleTagTemplate, {tag:t}) for t in tags
      template = tpl @articleTemplate,
        id: stamp
        title: title
        date: prettyDate(new Date(parseInt(stamp)*1000)) # yes, millis since epoch
        tags: article_tags
      @contentElement.append(template)
      $$("#a#{stamp} .spinner").show if @options.autoload



  loadArticle: (id)->
    if @articles[id].content?
      @trigger "article-loaded", id
    else
      articleElement = $("a#{id}")
      contentElement = $("c#{id}")
      Xhr.load "articles/#{id}",
        onSuccess: (req)=>
          @articles[id].content = textile(req.responseText, {breaks: false})
          contentElement.append @articles[id].content
          articleElement.removeClass('failure')
          articleElement.addClass('success')
          @trigger "article-loaded", id
          
        onFailure: (e, req)->
          console.log "failed to load article #{id}"
          articleElement.removeClass('success')
          articleElement.addClass('failure')
          contentElement.append '<p class="error">Wasn\'t able to load this article :(</p>'


  openArticle: (id)->
    @trigger "article-load", id unless @options.autoload
    
    articleElement = $("a#{id}")
    contentElement = $("c#{id}")

    articleElement.addClass('open')
    contentElement.show('slide')

    @scrollFx.start
      y: articleElement.position().y


  update: ->
    for stamp in Object.keys(@articles).sort().reverse()
      @addArticle(stamp, @articles[stamp].title, @articles[stamp].tags)
      $("a#{stamp}").hide() if @filtered(stamp)


  reset: ->
    @trigger 'filter-update', ""
    @trigger 'article-update'
    @closeArticles()


  closeArticles: ->
    $$('article.open').each (e,i)->
      e.removeClass "open"
      e.children(".content").each "hide"


  checkFragment: (e)->
    @reset()
    hash = location.hash.replace(" ", "")
    if hash.length > 0
      # check for article ids first, then for tags
      hash = hash.substring(1)
      if hash of @articles
        @trigger 'article-open', hash
      else if hash of @tags
        @trigger 'tags-list', hash
      else
        @trigger 'filter-update', hash


  constructor: ->
    @contentElement = $(@contentElement)
    @spinnerElement = $(@spinnerElement)
    @filterElement = $(@filterElement)
    @filterResetElement = $(@filterResetElement)
    @scrollFx = new Fx.Scroll(document.body)
    Xhr.Options.spinner = @spinnerElement

    @clearContentArea()
    @bind 'article-update', @update
    @bind 'article-update', @generateTagList
    @bind 'article-load',   @loadArticle
    @bind 'article-open',   @closeArticles
    @bind 'article-open',   @openArticle
    @bind 'tags-list',      @filterForTag
    @bind 'filter-update',  @updateFilter
    window.addEventListener "hashchange", @checkFragment.bind(@)

    Xhr.load 'articles.json?1393238683',
      onSuccess: (req)=>
        req.responseJSON = JSON.parse(req.responseText) unless req.responseJSON
        @articles = req.responseJSON.articles
        @options = req.responseJSON.options
        @trigger 'article-update'
        @checkFragment()
      onFailure: (e, req)=>
        @contentElement.update("<h1>Failed to load articles!</h1>")
        @contentElement.append("<p>#{req.status} – #{req.statusText}</p>")


$(document).onReady ->
  body = $$('body').first()
  ## theme selection via cookie
  body.addClass('dark') if document.cookie == "theme=dark"
  
  $$('.theme-selector').each "onClick", ->
    body.toggleClass('dark')
    if body.hasClass "dark"
      expiration = new Date()
      future = expiration.getTime() + 60*60*24*365*1000   # expires next year 
      expiration.setTime(future)
      cookie = "theme=dark; expires=#{expiration.toGMTString()}"
    else
      cookie = "theme=; expires=#{new Date().toGMTString()}"

    document.cookie = cookie
    console.log cookie

  window.weblog = new Weblog
 
