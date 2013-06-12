/*********************************************************#
# @@ScriptName: app.js
# @@Author: Konstantinos Vaggelakos<kozze89@gmail.com>
# @@Create Date: 2013-06-10 12:29:34
# @@Modify Date: 2013-06-10 16:31:02
# @@Function:
#*********************************************************/

/* jshint laxcomma:true */

var program = require('commander')
    , logger = require('winston')
    , util = require('util')
    , nodeio = require('node.io')
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
  console.log(process.args);
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
      var jobs = $('p.row a.i');
      jobs.each(function(row) {
        getListingPage(baseurl + row.attribs.href);
        return;
      });

      logger.info('Processed ' + jobs.length + ' jobs');
    });
  });
}

function getListingPage(url) {
  nodeio.scrape(function() {
    this.getHtml(url, function(err, $) {
      var postingbody = $('#postingbody').rawtext;
      console.log(extractEmails(postingbody));
    });
  });
}

function extractEmails(text) {
  return text.match(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi);
}




