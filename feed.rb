#!/usr/bin/ruby
# coding: utf-8

require "./lib/rubyrss"
require "json"

rss = RubyRSS.new "feed.rss"
rss.title = "koehrs webLog"
rss.link = "http://log.koehr.in"
rss.desc = "Mein WebLog, mal persönlich, mal philosophisch, mal technisch."
rss.date = Time.now.localtime

raw_json = File.read("articles.json")
json = JSON.load(raw_json)

json["articles"].each_pair do |key, article|
  article_text = File.read("articles/#{key}", 1024).force_encoding("UTF-8")
  description = article_text.split("\n\n", 2)[0]
  description = description[0...249] + '…' if description.length > 250
  rss.items << RubyRSS::Item.new(
    article["title"],
    "https://log.koehr.in/#/#{key}",
    description,
    Time.at(key.to_i)
  )
end
rss.items.reverse!

puts rss.generate
