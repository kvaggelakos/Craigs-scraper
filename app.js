/*********************************************************#
# @@ScriptName: app.js
# @@Author: Konstantinos Vaggelakos<kozze89@gmail.com>
# @@Create Date: 2013-06-10 12:29:34
# @@Modify Date: 2013-07-24 12:54:43
# @@Function:
#*********************************************************/

/* jshint laxcomma:true */

var program = require('commander')
    , logger = require('winston')
    , util = require('util')
    , nodeio = require('node.io')
    , fs = require('fs')
    , emailer = require('./emailer')
    , config = require('./config')
    , _ = require('underscore');


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
  .option('-d, --dry-run', 'Use this to show a dry run (not actually emailing or saving results')
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
    program.search = encodeURIComponent('iOS');
  } else {
    logger.info('Searching for jobs on craigslist with the search term: ' + program.search);
    program.search = encodeURIComponent(program.search);
  }

  if (typeof program.dryRun === 'undefined') {
    logger.info('Running for real!');
  } else {
    logger.info('This is only a dry run, which means that no sending or saving of emails');
  }

  // Read in the results.txt, to not resend to the same people
  program.emailsUsed = [];
  readEmails();
  logger.info('Skipping ' + program.emailsUsed.length + ' emails, from the ' + config.results.file + ' file');

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
      if (err) {return logger.error('Something went wrong! Try again later?\nerror: ' + err);}

      // For each job look for a link or email
      var jobs = $('p.row span.pl a');
      jobs.each(function(row) {
        // Quick and dirty way of getting the links
        var link = row.attribs['href'];
        var name = row.fulltext;

        if (link.indexOf('http://') > 0) {
          getListingPage(name, link); // Full link path
        } else {
          getListingPage(name, baseurl + link); // just the last part
        }
      });

      logger.info('Processing ' + jobs.length + ' jobs');
    });
  });
}

function getListingPage(name, url) {
  logger.debug('Processing job: ' + name + ' at url: ' + url);
  nodeio.scrape(function() {
    this.getHtml(url, function(err, $) {
      var replyEmail = $('section.dateReplyBar a').first().text;
      if (replyEmail && replyEmail != '?') {
        logger.info('Found email: ' + replyEmail);
        saveResults(name, replyEmail, function(err, email) {
          if (err) {
            logger.error(err.message);
          } else {
            if (!program.dryRyn) {
              emailer.send(email, program.respondTo, program.text, config.email.subject);
            }
          }
        });
      }
    });
  });
}

function saveResults(name, email, callback) {
  if (!_.contains(program.emailsUsed, email)) {
    logger.info('Did not have email in list');
    if (!program.dryRun) {
      fs.appendFile(config.results.file, name + ': ' + email + '\n', function(err) {
        if(err) {
          return callback(err);
        }
        return callback(null, email);
      });
    }
  } else {
    return callback(new Error('Already contacted ' + email + ' before'));
  }
}

function readEmails() {
  if (fs.existsSync(config.results.file)) {
    fs.readFileSync(config.results.file, 'utf8').split('\n').forEach(function (entry) {
      program.emailsUsed.push(entry.split(': ')[1]);
    });
  } else {
    // File probably doesn't exist
    logger.info('results.txt doesnt exist, continuing without history...');
  }
}
