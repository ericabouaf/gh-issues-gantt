var request = require('request');

module.exports = function(config) {

   var baseUrl = "https://api.github.com/repos/" + config.repo;

   // Factorize auth and headers setting
   var baseRequest = request.defaults({
      auth: {
         user: config.username,
         pass: config.password
      },
      // github's API requires that we use specify a userAgent
      // (see: http://developer.github.com/v3/#user-agent-required)
      headers: {
         'User-Agent': "gh-issues-gantt/0.0.1" // should match package.json
      }
   });

   var memo = {
      issues: {
         value: [],
         status: 'stale' // in ["fresh", "refreshing", "stale"]
      },
      milestones: {
         value: [],
         status: 'stale'
      }
   };

   function fetchIssues (cb, url, tmpIssues) {
      if (memo.issues.status === 'stale') {
         memo.issues.status = 'refreshing';
         refreshIssues.call(this, cb, url, tmpIssues);
      } else {
         cb(null, memo.issues.value, memo.issues.status);
      }
   }

   function fetchMilestones (cb) {
      if (memo.milestones.status === 'stale') {
         memo.milestones.status = 'refreshing';
         refreshMilestones.call(this, cb);
      } else {
         cb(null, memo.milestones.value, memo.milestones.status);
      }
   }

   function refreshIssues (cb, url, tmpIssues) {

      url = url || baseUrl + "/issues?per_page=100&status=open&direction=asc";

      console.log("GET " + url);

      baseRequest.get({
         url: url,
      }, function (error, response, body) {

         var issues = (tmpIssues ? tmpIssues : []).concat(JSON.parse(body));

         var links = {};
         //check if there is a link, stops a crash when number of issues <=100
         if (response.headers.link != null) {
            response.headers.link.split(', ').forEach(function(headLink){
               var s = headLink.split('; ');
               links[s[1]] = s[0].substr(1, s[0].length-2);
            });
         }

         if(links['rel="next"']) {
            refreshIssues(cb, links['rel="next"'], issues);
         }
         else {
            memo.issues.value  = issues;
            memo.issues.status = "fresh";
            cb(null, issues, memo.issues.status);
         }

      });

   }

   function refreshMilestones (cb) {

      var url = baseUrl + "/milestones?per_page=100&status=open";

      console.log("GET " + url);

      baseRequest.get({
         url: url,
      }, function (error, response, body) {
         memo.milestones.value  = JSON.parse(body);
         memo.milestones.status = "fresh";
         cb(null, memo.milestones.value, memo.issues.status);
      });

   }

   function refresh (cb) {
      for (var key in memo) {
         if (memo.hasOwnProperty(key)) {
            if (memo[key].status = "fresh") {
               memo[key].status = "stale";
            }
         }
      }
      cb();
   }

   return {
      fetchIssues: fetchIssues,
      fetchMilestones: fetchMilestones,
      refresh: refresh,

      update_ms_due_on: function(milestoneId, due_on, cb) {
         var url = baseUrl + "/milestones/" + milestoneId;

         console.log("PATCH " + url);

         baseRequest.patch({
            url: url,
            json: {
               "due_on": due_on
            }
         }, function (error, response, body) {
            console.log(body);
            cb(null, null);
         });
      }

   };

};

