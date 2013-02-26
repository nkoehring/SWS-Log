#!/usr/bin/ruby
# coding: utf-8

require "json"
require "tempfile"


$template = "Please descripe the articles meta information.
The title can be any one liner and should not be too long. Tags are a space-
separated word list. Please do not remove the Markers TITLE: and TAGS:.

TITLE: %title%
TAGS: %tags%

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

def new_article(title="No title set.", tags=["untagged"])
  # "foo bar" => "FooBar" 'cause we don't want spaces
  tags = tags.collect do |tag|
    tagwords = tag.split
    if tagwords.length > 1
      tagwords.map(&:capitalize).join
    else
      tag.downcase
    end
  end.uniq.join(' ')
  template = $template.gsub("%title%", title).gsub("%tags%", tags)

  data = Tempfile.open('sws-log-article-') do |fp|
    fp.write(template)
    fp.flush
    system "#{ENV['EDITOR']} #{fp.path}"
    fp.rewind
    fp.read
  end

  if data == template   # no changes made, cancel
    puts "Empty article: canceled."
    return
  end

  meta_raw, article = data.split('===== ARTICLE BEGINS HERE =====').collect(&:strip)
  meta = {}

  meta_raw.split("\n").each do |line|
    line.strip!
    meta["title"] = line.split(':', 2)[1].strip if line.start_with? "TITLE:"
    meta["tags"] = line.split(':', 2)[1].strip.split(' ') if line.start_with? "TAGS:"
  end

  key = Time.now.to_i.to_s
  print "Article key is #{key}: "
  save_article_info(key, meta) and print "Updated meta data… "
  save_article(key, article) and print "Saved file… "
  
  # update the rss feed
  `./feed.rb` and puts "Updated RSS feed."
end

if ARGV.length > 1
  new_article ARGV.shift, ARGV
else
  new_article
end
