/*********************************************************#
# @@ScriptName: config.js
# @@Author: Konstantinos Vaggelakos<kozze89@gmail.com>
# @@Create Date: 2013-06-10 13:42:05
# @@Modify Date: 2013-07-09 18:05:02
# @@Function:
#*********************************************************/


var config = {};

config.url = {};
config.url.base = 'http://sfbay.craigslist.org';
config.url.searchPath = '/search/sof?zoomToPosting=&srchType=A&s=0&query=%s';

config.email = {};
config.email.subject = 'Newly graduated student from Sweden applying for job'; // subject
config.email.username = 'username@gmail.com'; // Username 
config.email.password = 'password'; // Password
config.email.host = 'smtp.gmail.com'; // SMTP host
config.email.ssl = true; // SMTP host uses ssl?

module.exports = config;
