var _       = require('lodash');
var request = require('request');
var program = require('commander');
var insta   = require('instagram-node').instagram();

var model   = require('./model');
var config  = require('./config');

var ACCESS_TOKEN  = config.instagram.ACCESS_TOKEN;
var CLIENT_ID     = congig.instagram.CLIENT_ID;
var CLIENT_SECRET = config.instagram.CLIENT_SECRET;

program
  .version('0.0.1')
  .option('-r, --recursive', 'fetch all photos')
  .parse(process.argv);

/**
 * initialize insta node
 */
insta.use({
  client_id     : CLIENT_ID,
  client_secret : CLIENT_SECRET
});

_.each(config.ID, function(member_id, member) {
  get(member, member_id, program.recursive);
});

function get(member, member_id, recursive) {
  var now = new Date();
  console.log('[' + now.toString() + ']: executed / ' +member+' / recursive: ' + !!recursive);

  var url = 'https://api.instagram.com/v1/users/' + member_id + '/media/recent?access_token=' + ACCESS_TOKEN;
  var index = 0;
  next(url);

  function next(url) {
    index++;

    request(url, function (err, response, body) {

      if (err) return console.log(err);

      if (response.statusCode == 200) {
        var data = JSON.parse(body);
        var next_url = data.pagination.next_url;
        _.each(data.data, function(d) {
          var image = (d.type === 'video') ? d.videos.standard_resolution: d.images.standard_resolution;
          var insert = {
            member : member,
            id     : d.id,
            type   : d.type,
            url    : image.url,
            width  : image.width,
            height : image.height,
            like   : d.likes.count,
            link   : d.link,
            created: d.created_time,
            comment: d.comments.count,
            text   : d.caption && d.caption.text,
            profile: d.user.profile_picture
          };

          model.insert('media', insert, function(err) {
            if (err) return console.log(err);
          });
        });

        if (recursive && next_url) {
          return next(next_url);
        }
      }
    });
   }
}
