#!/usr/bin/ruby
# coding: utf-8

require "json"
require "tempfile"


$template = "Please descripe the articles meta information.
The title can be any one liner and should not be too long. Tags are a space-
separated word list. Please do not remove the Markers TITLE: and TAGS:.

TITLE: No title set.
TAGS: untagged

===== ARTICLE BEGINS HERE =====
"


def save_article_info(key, obj)
  json = JSON.load(File.read("articles.json"))
  json["articles"][key] = obj
  File.open("articles.json", "w") {|fp| fp.write(JSON.pretty_generate(json))}
end

def save_article(key, article)
  File.open("articles/#{key}", "w") {|fp| fp.write(article)}
end

def new_article
  data = Tempfile.open('sws-log-article-') do |fp|
    fp.write($template)
    fp.flush
    system "#{ENV['EDITOR']} #{fp.path}"
    # TODO check for changes?
    fp.rewind
    fp.read
  end

  meta_raw, article = data.split('===== ARTICLE BEGINS HERE =====').collect(&:strip)
  meta = {}

  meta_raw.split("\n").each do |line|
    line.strip!
    meta["title"] = line.split(':', 2)[1].strip if line.start_with? "TITLE:"
    meta["tags"] = line.split(':', 2)[1].strip.split(' ') if line.start_with? "TAGS:"
  end

  key = Time.now.to_i.to_s
  save_article_info(key, meta)
  save_article(key, article)
  
  # update the rss feed
  `./feed.rb`
end

new_article