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

var AlexaSkill = require('./AlexaSkill');
var APP_ID = undefined;

function Recommender () {
  AlexaSkill.call(this, APP_ID);
}
Recommender.prototype = Object.create(AlexaSkill.prototype);
Recommender.prototype.constructor = Recommender;

Recommender.prototype.eventHandlers.onLaunch = function (launchRequest, session, response) {
  response.ask("Welcome to Tastekid alexa integration!",
               "Tell me a movie you like. I will recommend some for you");
};
Recommender.prototype.eventHandlers.onSessionStarted = function (sessionStartedRequest, session) {};
Recommender.prototype.eventHandlers.onSessionEnded = function (sessionEndedRequest, session) {};

Recommender.prototype.intentHandlers = {
  Alexakid: function (intent, session, response) {
    if (!session.attributes.movies) session.attributes.movies = [];

    var movie = intent.slots.Movie.value;
    console.log("Movie:", movie);
    session.attributes.movies.push(movie);
    console.log("Looking up movies:", session.attributes.movies);
    getMovieRecomendations(session.attributes.movies, function (err) {
      console.error("ERROR:", err);
      session.attributes.movies = [];
      response.ask("An error occured...", "Let's try from scratch!");
    }, function (recommendations) {
      console.log("Found recommendations:", recommendations);
      response.ask("I recomend " +
                   recommendations.reduce(function(a,b) {return a + ", " + b},
                                          recommendations[0] || ""), // XXX: Dont repeat the first one
                   "Hit me with more!");
    });
  }
};

exports.handler = function (event, context, callback) {
  var recommender = new Recommender();
  recommender.execute(event, context);
};
