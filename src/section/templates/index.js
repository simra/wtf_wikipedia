const i18n = require('../../data/i18n');
const findRecursive = require('../../lib/recursive_match');
const parseInfobox = require('../../infobox/parse-infobox');
const parseCitation = require('./citation');
const Infobox = require('../../infobox/Infobox');
const infobox_reg = new RegExp('{{(' + i18n.infoboxes.join('|') + ')[: \n]', 'ig');

//create a list of templates we can understand, and will parse later
let keep = {};
const parsers = [
  require('../../sentence/templates/templates'),
  require('./parsers'),
];
parsers.forEach((o) => {
  Object.keys(o).forEach((k) => keep[k] = true);
});

//reduce the scary recursive situations
const findTemplates = function(r, wiki, options) {
  //remove {{template {{}} }} recursions
  let matches = findRecursive('{', '}', wiki).filter(s => s[0] && s[1] && s[0] === '{' && s[1] === '{');
  matches.forEach(function(tmpl) {

    if (tmpl.match(infobox_reg, 'ig')) {
      if (options.infoboxes !== false) {
        let infobox = parseInfobox(tmpl);
        infobox = new Infobox(infobox, tmpl);
        r.infoboxes = r.infoboxes || [];
        r.infoboxes.push(infobox);
      }
      wiki = wiki.replace(tmpl, '');
      return;
    }

    //keep these ones, we'll parse them later
    let name = tmpl.match(/^\{\{([^:|\n ]+)/);
    if (name !== null) {
      name = name[1].trim().toLowerCase();

      if (/^\{\{ ?citation needed/i.test(tmpl) === true) {
        name = 'citation needed';
      }
      //parse {{cite web ...}} (it appears every language)
      if (name === 'cite' || name === 'citation') {
        wiki = parseCitation(tmpl, wiki, r, options);
        return;
      }

      //sorta-keep nowrap template
      if (name === 'nowrap') {
        let inside = tmpl.match(/^\{\{nowrap *?\|(.*?)\}\}$/);
        if (inside) {
          wiki = wiki.replace(tmpl, inside[1]);
        }
      }
      if (keep.hasOwnProperty(name) === true) {
        return;
      }
    }
    //here: add custom parser support?

    //if it's not a known template, but it's recursive, remove it
    //(because it will be misread later-on)
    wiki = wiki.replace(tmpl, '');
  });
  // //ok, now that the scary recursion issues are gone, we can trust simple regex methods..
  // //kill the rest of templates
  wiki = wiki.replace(/\{\{ *?(^(main|wide)).*?\}\}/g, ''); //TODO:fix me
  return wiki;
};

module.exports = findTemplates;