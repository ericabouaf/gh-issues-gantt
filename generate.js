var config     = require('./config.js'),
    github     = require('./github')(config.github);
const fs = require('fs');

function writeFile(filename, data) {
    fs.writeFile(filename, data, function(err) {
        if(err) {
            return console.log(err);
        }
        console.log("Saved "+filename);
    }); 
}

// Write config.js
var _config = config.gantt;
_config.repo = config.github.repo;
// Strings dates like "2017-08-13" are converted int JS code like: new Date(2017, 7, 13)
var _json_config = JSON.stringify(_config, null, 3).
                        replace(/"(\d{4})-(\d{2})-(\d{2})"/g, 'new Date($1, $2-1, $3)');
writeFile("./build/config.js", "var config = " + _json_config + ";")

// Write issues.js
github.fetchIssues(function(err, issues, status) {
    writeFile("./build/issues.js", "var issues = " + JSON.stringify(issues, null, 3) + ";\n" +
            "var status = " + JSON.stringify(status) + ";");
});

// Write milestones.js
github.fetchMilestones(function(err, milestones, status) {
    writeFile("./build/milestones.js", "var milestones = " + JSON.stringify(milestones, null, 3) + ";\n" +
            "var status = " + JSON.stringify(status) + ";");
});

