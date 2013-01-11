var request = require('request');

module.exports = function(config) {

   var baseUrl = "https://api.github.com/repos/"+config.repo;

   var memo_issues = null;

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




   var memo_milestones = null;

   function fetchMilestones(cb) {

      if(memo_milestones) {
         cb(null, memo_milestones);
         return;
      }

      request.get({
         url: baseUrl+"/milestones?per_page=100&status=open",
         'auth': config.username+":"+config.password
      }, function (error, response, body) {
         memo_milestones = JSON.parse(body);
         cb(null, memo_milestones);
      });

   }

   return {
      fetchIssues: fetchIssues,
      fetchMilestones: fetchMilestones
   };

};
