// micro templating engine by Thomas Fuchs
// http://mir.aculo.us/2011/03/09/little-helpers-a-tweet-sized-javascript-templating-engine/
function tpl(s,d){
  for(var p in d) s=s.replace(new RegExp('{'+p+'}','g'), d[p])
  return s
}

