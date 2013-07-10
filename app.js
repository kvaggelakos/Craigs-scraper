/*********************************************************#
# @@ScriptName: app.js
# @@Author: Konstantinos Vaggelakos<kozze89@gmail.com>
# @@Create Date: 2013-06-10 12:29:34
# @@Modify Date: 2013-07-09 18:03:39
# @@Function:
#*********************************************************/

/* jshint laxcomma:true */

var program = require('commander')
    , logger = require('winston')
    , util = require('util')
    , nodeio = require('node.io')
    , fs = require('fs')
    , emailer = require('./emailer')
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
  .option('-r, --respond-to [value]', 'This is the from field in the emails sent')
  .option('-t, --text [file]', 'The msg to send in the email, from a file')
  .parse(process.argv);

init();

function init() {
  // Check respond to 
  if (typeof program.respondTo === 'undefined') {
    help(true, 'You did not specify where the receiver should respond to.');
  }

  // Check that message file is specified
  if (typeof program.text === 'undefined') {
    help(true, 'You have to specify the file containing your message.');
  } else {
    // Read the file with the message
    program.text = fs.readFileSync(program.text, 'utf8');
  }

  // Check the search term that the user specified
  if (typeof program.search ===  'undefined') {
    help(false, 'You did not specify any search term, using iOS as default.');
    program.search = 'iOS';
  } else {
    logger.info('Searching for jobs on craigslist with the search term: ' + program.search);
  }

  // Start the search
  getListings(config.url.base, config.url.searchPath, program.search);
}

function help(stop, msg) {
  logger.info(msg + ' Re-run with --help for options');
  if (stop) {
    process.exit();
  }
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
        emailer.send(replyEmail, program.respondTo, program.text, config.email.subject);
      }
    });
  });
}

function saveResults(name, info) {
  fs.appendFile('results.txt', name + ': ' + info + '\n', function(err) {
    if(err) { logger.error(err); return; }
  });
}



