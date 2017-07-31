var express    = require('express'),
    bodyParser = require('body-parser'),
    app        = (function () {
                     var app = express();
                     app.use(express["static"](__dirname + '/public'));
                     app.use(bodyParser.json()); // parse application/json
                     return app;
                  }()),
    config     = require('./config.js'),
    github     = require('./github')(config.github);

// Configure the routes
app.get('/', function(req, res){
   res.sendfile(__dirname + '/public/index.html');
});

app.get('/overview', function(req, res){
   res.sendfile(__dirname + '/public/overview.html');
});

app.get('/config.js', function(req, res) {
   var _config = config.gantt;
   _config.repo = config.github.repo;

   // Strings dates like "2017-08-13" are converted int JS code like: new Date(2017, 7, 13)
   var _json_config = JSON.stringify(_config, null, 3).
                           replace(/"(\d{4})-(\d{2})-(\d{2})"/g, 'new Date($1, $2-1, $3)');

   res.set('Content-Type', 'application/javascript');
   res.send("var config = " + _json_config + ";");
});

app.get('/issues.js', function(req, res) {
   res.set('Content-Type', 'application/javascript');
   github.fetchIssues(function(err, issues, status) {
      res.send("var issues = " + JSON.stringify(issues, null, 3) + ";\n" +
               "var status = " + JSON.stringify(status) + ";");
   });
});

app.get('/milestones.js', function(req, res) {
   res.set('Content-Type', 'application/javascript');
   github.fetchMilestones(function(err, milestones, status) {
      res.send("var milestones = " + JSON.stringify(milestones, null, 3) + ";\n" +
               "var status = " + JSON.stringify(status) + ";");
   });
});

app.get('/trigger_refresh', function(req, res) {
   res.set('Content-Type', 'plain/text');
   github.refresh(function() {
      res.send("");
   });
});

app.post('/update_ms_due_on', function(req, res) {
   github.update_ms_due_on(req.body.milestoneId, req.body.due_on, function () {
      res.send("");
   });
});

// Launch the server
app.listen(config.server.port);
console.log('Listening on port '+ config.server.port);
