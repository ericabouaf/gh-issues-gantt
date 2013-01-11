var express = require('express');

var app = express(),
    config = require('./config.js');

var github = require('./github')(config);

app.use(express["static"](__dirname + '/public'));

app.get('/', function(req, res){
   res.sendfile(__dirname + '/public/index.html');
});

app.get('/issues.js', function(req, res) {
   res.set('Content-Type', 'application/javascript');
   github.fetchIssues(function(err, issues) {
      res.send("var issues = "+JSON.stringify(issues)+";");
   });
});

app.get('/milestones.js', function(req, res) {
   res.set('Content-Type', 'application/javascript');
   github.fetchMilestones(function(err, milestones) {
      res.send("var milestones = "+JSON.stringify(milestones)+";");
   });
});

app.listen(3001);
console.log('Listening on port 3001');
