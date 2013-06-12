/*********************************************************#
# @@ScriptName: app.js
# @@Author: Konstantinos Vaggelakos<kozze89@gmail.com>
# @@Create Date: 2013-06-10 12:29:34
# @@Modify Date: 2013-06-12 17:01:44
# @@Function:
#*********************************************************/

/* jshint laxcomma:true */

var program = require('commander')
    , logger = require('winston')
    , util = require('util')
    , nodeio = require('node.io')
    , fs = require('fs')
    , config = require('./config');


// Set up the logger
logger.remove(logger.transports.Console);
logger.add(logger.transports.Console, {
  json: false,
  colorize: true,
  handleExceptions: true,
  level: 'debug'
});

// Initialize program
program
  .version('0.0.1')
  .option('-s, --search [value]', 'Search for a specific term')
  .parse(process.argv);

init();

function init() {
  // Print what is going to happen
  if (typeof process.args ===  'undefined') {
    logger.info('User did not specify any search term, using iOS as default. Re-run with --help for options');
    program.search = 'iOS';
  } else {
    logger.info('Searching for jobs on craigslist with the search term: ' + program.search);
  }
  // Start the search
  getListings(config.url.base, config.url.searchPath, program.search);
}

function getListings(baseurl, searchPath, searchString) {

  var url = baseurl + util.format(searchPath, searchString);
  logger.info('Fetching jobs from url: ' + url);

  nodeio.scrape(function() {
    this.getHtml(url, function(err, $) {
      if (err) {logger.error('Something went wrong! Try again later?\nerror: ' + err); return;}

      // For each job look for a link or email
      var jobs = $('p.row span.pl a');
      jobs.each(function(row) {
        // Quick and dirty way of getting the links
        var link = row.attribs['href'];
        var name = row.fulltext;
        //console.log(name + ' (' + link + ')');
        getListingPage(name, baseurl + link);
      });

      logger.info('Processing ' + jobs.length + ' jobs');
    });
  });
}

function getListingPage(name, url) {
  nodeio.scrape(function() {
    this.getHtml(url, function(err, $) {
      var replyEmail = $('section.dateReplyBar a').first().text;
      if (replyEmail && replyEmail != '?') {
        logger.info('Found email: ' + replyEmail);
        saveResults(name, replyEmail);
      }
    });
  });
}

function saveResults(name, info) {
  fs.appendFile('results.txt', name + ': ' + info + '\n', function(err) {
    if(err) { logger.error(err); return; }
  });
}



