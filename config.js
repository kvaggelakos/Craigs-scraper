/*********************************************************#
# @@ScriptName: config.js
# @@Author: Konstantinos Vaggelakos<kozze89@gmail.com>
# @@Create Date: 2013-06-10 13:42:05
# @@Modify Date: 2013-06-12 17:15:26
# @@Function:
#*********************************************************/


var config = {};

config.url = {};
config.url.base = 'http://sfbay.craigslist.org';
config.url.searchPath = '/search/sof?zoomToPosting=&srchType=A&s=0&query=%s';

config.email = {};
config.email.from = 'jobhunter';
config.email.username = 'username';
config.email.password = 'password';
config.email.host = 'smtp.gmail.com';
config.email.ssl = true;

module.exports = config;
