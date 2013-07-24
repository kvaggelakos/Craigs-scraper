/*********************************************************#
# @@ScriptName: emailer.js
# @@Author: Konstantinos Vaggelakos<kozze89@gmail.com>
# @@Create Date: 2013-05-06 20:42:13
# @@Modify Date: 2013-07-24 12:30:16
# @@Function:
#*********************************************************/

/* jshint laxcomma:true */

var logger = require('winston')
    , config = require('./config')
    , nodemailer = require('nodemailer');

var smtpTransport = nodemailer.createTransport("SMTP", {
  service: "Gmail",
  auth: {
    user: config.email.username,
    pass: config.email.password
  }
});

exports.send = function(to, from, msg, subject) {
  if (!to || !from || !msg || !subject) {
    logger.error('Not all values provided when trying to send email.');
    return false;
  }

  var mailOptions = {
      from: '<' + from + '>',
      to: to,
      subject: subject,
      generateTextFromHTML: true,
      html: msg
  };

  // send mail with defined transport object
  smtpTransport.sendMail(mailOptions, function(error, response){
    if (error) {
      logger.error(error);
    } else {
      logger.info('Sent email to: ' + to);
    }
  });
};

exports.done = function() {
  smtpTransport.close();
};
