var request = require('request');
var ENDPOINT = 'https://www.tastekid.com/api/similar?k=244644-SocialBo-QYEURQG0&type=movies&q=';
var MAX_RESULTS = 6;

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

function ssml(str) {
  return {
    type: "SSML",
    speech: "<speak>" + str + "</speak>"
  };
}

function respond (session, response) {
  if (session.attributes.movies.length === 0){
    response.ask(ssml("You should tell me at least one example movie..."),
                 "Give me something to work with");
    return;
  }

  session.attributes.max_results = session.attributes.max_results || 6;
  getMovieRecomendations(session.attributes.movies, function (err) {
    console.error("ERROR:", err);
    session.attributes.movies = [];
    response.ask("An error occured...", "Let's try from scratch!");
  }, function (recommendations) {
    recommendations = recommendations.slice(0, session.attributes.max_results);
    console.log("Found recommendations:", recommendations);
    var resp = ssml("I recomend <break strength=\"x-weak\"/>" +
                        movieListToString(recommendations.slice(0, MAX_RESULTS),
                                          ",or,"));
    response.ask(resp, "Hit me with more!");
  });
}

function movieListToString (movies, connectingWord) {
  if (movies.length === 0) return "no movies";
  if (movies.length === 1) return movies[0];
  connectingWord = " " + (connectingWord || "or") + " ";
  if (movies.length === 2) return movies[0] + connectingWord + movies[1];
  var last2 = movies.slice(-2),
      final = last2[0] + connectingWord + last2[1];
  return movies.slice(0,-2).reverse().reduce(
    function (ret, x) {return x + ', ' + ret;}, final);
}

function forgetMovie (movie, session, response) {
  if (!session.attributes.movies) session.attributes.movies = [];
  session.attributes.movies =
    session.attributes.movies.filter(function (m) {
      return movie != m;
    });
  report (session, response);
}

function putMovie (movie, session, response) {
  if (!session.attributes.movies) session.attributes.movies = [];
  session.attributes.lastMovie = movie;
  session.attributes.movies.push(movie);
}

function report (session, response) {
  var result = ssml("So far you said you like <break strength=\"x-weak\"/>" +
                    movieListToString(session.attributes.movies, ",and,"));
  response.ask(result, "What now?");
}

function loggedIntents(dict) {
  var ret = {};
  Object.getOwnPropertyNames(dict).forEach(function (n) {
    ret[n] = function (i,s,r) {
      console.log("Intent:", n);
      return dict[n].call(this,i,s,r);
    };
  });
  return ret;
}

Recommender.prototype.intentHandlers = loggedIntents({
  AddReferenceMovie: function (intent, session, response) {
    putMovie(intent.slots.Movie.value, session, response);
    respond(session, response);
  },
  GetReferences: function (intent, session, response) {
    report(session, response);
  },
  RemoveReferenceMovie: function (intent, session, response) {
    forgetMovie(intent.slots.Movie.value, session, response);
    respond(session, response);
  },
  ResetReferenceMovies: function (intent, session, response) {
    session.attributes.movies = [];
    response.ask("Done!", "Let's start again");
  },
  RemoveLastReference: function (intent, session, response) {
    forgetMovie(session.attributes.lastMovie, session, response);
    respond(session, response);
  },
  RepeatSuggestions: function (intent, session, response) {
    console.log("Repeat suggestions");
    respond(session, response);
  },
  EndSession: function (intent, session, response) {
    console.log("Ending session.");
    response.tell("See you later");
  },

  // AMAZON INTENTS
  "AMAZON.StopIntent": function (intent, session, response) {
    response.tell("Come again!");
  }
});

exports.handler = function (event, context, callback) {
  var recommender = new Recommender();
  recommender.execute(event, context);
};
