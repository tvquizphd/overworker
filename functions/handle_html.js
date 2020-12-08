export const unescape_html = function(input) {
  var doc = new DOMParser().parseFromString(input, "text/html");
  return doc.documentElement.textContent;
}

export const parse_html = function(html_string) {
  var div = document.createElement('div');
  div.innerHTML = html_string.replace(/<\!--.*?-->/g, '').trim();

  return div.firstChild; 
}
