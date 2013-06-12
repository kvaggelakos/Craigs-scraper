/*********************************************************#
# @@ScriptName: emailer.js
# @@Author: Konstantinos Vaggelakos<kozze89@gmail.com>
# @@Create Date: 2013-05-06 20:42:13
# @@Modify Date: 2013-06-12 17:17:31
# @@Function:
#*********************************************************/

/* jshint laxcomma:true */

var email = require('emailjs')
    , logger = require('winston')
    , config = require('./config');

exports.send = function(to, from, msg, subject) {
  if (!to || !from || !msg || !subject) {
    logger.error('Not all values provided when trying to send email.');
    return false;
  }

  var server  = email.server.connect({
    user:     config.email.username,
    password: config.email.password,
    host:     config.email.host,
    ssl:      config.email.ssl
  });

  server.send({
    text:    msg,
    from:    from,
    to:      to,
    subject: subject
  }, function(err, message) {
    if (err) {
      logger.error(err);
      return false;
    }
    return true;
  });
}
