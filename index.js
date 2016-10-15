var request = require('request');
var ENDPOINT = 'https://www.tastekid.com/api/similar?k=244644-SocialBo-QYEURQG0&type=movies&q=';

function getMovieRecomendations (movieTitles, errCb, cb) {
  function joinTitles(titles) {
    if (titles.length === 0) return "";
    if (titles.length === 1) return titles[0];
    return titles[0] + "," + joinTitles(titles.slice(1));
  }

  function normalizeTitles(titles){
    var dict = {};
    for (var i = 0; i< titles.length; i++)
    {
      dict[titles[i]] = null;
    }
    return dict;
  }
  var normalTitles = normalizeTitles(movieTitles);
  var joinedTitles = joinTitles(Object.getOwnPropertyNames(normalTitles));

  return request(ENDPOINT + joinedTitles, function(error, resp, body) {
    if (error) {errCb (error); return;}
    if (resp.statusCode !== 200 ) {
      errCb ("Bad status: " + resp.statusCode + "(url: " + ENDPOINT + joinedTitles + ")");
      return;
    }

    var respobj = JSON.parse(body);
    if (!respobj) {errCb("No response"); return;}
    if (!respobj.Similar ||
      !respobj.Similar.Results ||
      typeof respobj.Similar.Results.map !== 'function' ||
      respobj.Similar.Results.some(function (e) {return typeof e.Name !== 'string';})) {
      errCb("Bad resp format: " + body);
      return;
    }
    cb(respobj.Similar.Results.map(function (m) {return m.Name;}));
  });
};


exports.handler = function (event, context, callback) {
    callback(null, JSON.stringify({event: event, context: context}));
};
