var express = require('express'),
    request = require('request');

var app = express(),
    config = require('./config.js'),
    baseUrl = "https://api.github.com/repos/"+config.repo;

app.use(express["static"](__dirname + '/public'));

app.get('/', function(req, res){
   res.sendfile(__dirname + '/public/index.html');
});


var memo_issues = null,
    memo_milestones = null;

app.get('/issues.js', function(req, res) {

   res.set('Content-Type', 'application/javascript');

   var all_issues = [];

   function fetchIssues (cb, url, tmpIssues) {

      if(memo_issues) {
         cb(null, memo_issues);
         return;
      }

      var theUrl = url || baseUrl+"/issues?per_page=100&status=open";
      console.log(theUrl);
      request.get({
         url: theUrl,
         'auth': config.username+":"+config.password
      }, function (error, response, body) {

         var issues = (tmpIssues ? tmpIssues : []).concat(JSON.parse(body));

         var links = {};
         response.headers.link.split(', ').forEach(function(headLink){
            var s = headLink.split('; ');
            links[s[1]] = s[0].substr(1, s[0].length-2);
         });

         if(links['rel="next"']) {
            fetchIssues(cb, links['rel="next"'], issues);
         }
         else {
            memo_issues = issues;
            cb(null, issues);
         }

      });

   }

   fetchIssues(function(err, issues) {
      res.send("var issues = "+JSON.stringify(issues)+";");
   });

});

app.get('/milestones.js', function(req, res) {

   res.set('Content-Type', 'application/javascript');

   if(memo_milestones) {
      res.send("var milestones = "+memo_milestones+";");
      return;
   }

   request.get({
      url: baseUrl+"/milestones?per_page=100&status=open",
      'auth': config.username+":"+config.password
   }, function (error, response, body) {
      memo_milestones = body;
      res.send("var milestones = "+body+";");
   });

});

app.listen(3000);
console.log('Listening on port 3000');
