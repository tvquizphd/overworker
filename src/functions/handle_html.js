import { DOMParser } from 'xmldom'
import he from 'he'

export const parse_html = function(input) {
  const html = he.decode(input)
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, "text/html");
  return doc.documentElement;
}
