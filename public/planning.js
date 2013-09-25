/*global $,milestones,issues,window,config*/

/**
 * TODO: 
 *    - Bug when tickets overlap holidays
 *    - Doc for duration labels
 */

var Planning = {

   milestonesById: {},

   developpers: {},

   init: function() {

      // Render the refresh button
      this.initRefreshButton();
      
      // Sort milestones by due date
      this.sorted_milestones = milestones.sort( function (a,b){
         return a.due_on > b.due_on ? 1 : -1; 
      });

      // Index milestones by id & add milestone issues
      milestones.forEach(function(milestone) {
         milestone.issues = [];
         this.milestonesById[milestone.id] = milestone;
      }, this);

      // Run the plannification algorithm
      this.planner();

   },

   display: function() {

      var source = this.getPlanningByMilestone();
      console.log(source);

     // Render the Gantt charts
      $(".gantt-milestone").gantt({
         source: source,
         navigate: "scroll",
         scale: "days",
         maxScale: "months",
         minScale: "days",
         itemsPerPage: 100,
         onItemClick: function(data) {
            Planning.onItemClick(data);
         }
      });

      $(".gantt-dev").gantt({
         source: this.getPlanningForDevs(),
         navigate: "scroll",
         scale: "days",
         maxScale: "months",
         minScale: "days",
         itemsPerPage: 100,
         onItemClick: function(data) {
            Planning.onItemClick(data);
         }
      });

   },

   initRefreshButton: function () {
      $("#refresh-button").on("click", function () {
         $.ajax('/trigger_refresh', {
            success: function () { window.location.reload(); }
         });
      });
   },
   
   
   onItemClick: function(data) {
      var baseUrl = 'https://github.com/'+config.repo, url;

      if(data.issue) { url = baseUrl + '/issues/'+data.issue; }
      if(data.milestone) { url = baseUrl + '/issues?milestone='+data.milestone; }
      if(data.milestone_release) { url = baseUrl + '/issues/milestones/'+data.milestone_release+'/edit'; }

      if(url) { window.open(url,"_blank"); }
   },

   planner: function () {

      // Dispatch issues in milestones
      issues.forEach(function(issue){
         if(!issue.milestone) {
            $('#msg').append("<p><a href='https://github.com/"+config.repo+"/issues/"+issue.number+"' target='new'>issue #"+issue.number+"</a> has no milestone !</p>");
            return;
         }
         this.milestonesById[issue.milestone.id].issues.push(issue);
      }, this);


      this.sorted_milestones.forEach(function(milestone) {

         // assign tickets to each developper
         milestone.issues.forEach(function(issue) {

            // Developpeur et sa date de dispo
            var dev = this.devNameFromIssue(issue);
            if(!this.developpers[dev]) {
               this.developpers[dev] = {
                  next: Date.getToday(),
                  issues: []
               };
            }

            // Planification
            this.planIssueForDev(dev, issue);
         }, this);

      }, this);

   },

   devNameFromIssue: function(issue) {
      return issue.assignee ? issue.assignee.login : 'unassigned';
   },

   getDurationForIssue: function (issue) {

      var numericLabels = issue.labels.filter(function(l){ return l.name.match(/^\d+D$/); }),
          name,
          duration = config.defaultDuration;

      if(numericLabels.length > 0) {
         name = numericLabels[0].name;
         duration = parseInt( name.substr(0, name.length-1), 10);
      }

      issue.calculatedDuration = duration;

      return duration;
   },


   planIssueForDev: function (dev, issue) {

      // Planification
      var durationInDays = this.getDurationForIssue(issue);

      var start = this.developpers[dev].next;


      // handle holidays
      var devHolidays = config.holidays[dev];
      if(devHolidays) {

         devHolidays.forEach(function(holiday){
            if(start >= holiday.start && start <= holiday.end) {
               start = holiday.end.AddDays(1);
            }
         }, this);

      }


      // Skip start on week-end
      while( config.weekDaysOff.indexOf(start.getDay()) != -1 ) {
         start = start.AddDays(1);
      }

      var end = start.AddDays(durationInDays);

      // if [start,end] overlap week-ends, count the numbers of days to add
      if ( start.weekNumber() != end.weekNumber() ) {
         var diffDays = (end.weekNumber()-start.weekNumber())*2;
         end = end.AddDays(diffDays);
      }


      issue.planning = {
         start: start,
         end: end.AddDays(-1)
      };

      this.developpers[dev].next = end;

      this.developpers[dev].issues.push(issue);

   },



   genItemFromIssue: function (issue) {
      
      var dev = this.devNameFromIssue(issue);

      return {
         from: "/Date("+issue.planning.start.getTime()+")/",
         to: "/Date("+issue.planning.end.getTime()+")/",
         label: issue.title,
         desc: '#'+issue.number + ': ' + issue.title,
         customClass: config.colorByDev[dev] || "ganttRed",
         dataObj: {
            issue: issue.number
         }
      };
   },


   /**
    * Generate the planning for devs :
    */
   getPlanningForDevs: function () {

      var planning = [];

      for(var dev in this.developpers) {

         // Regroupe les tickets par milestone
         var hisMilestones = {};
         for(var i = 0 ; i < this.developpers[dev].issues.length ; i++) {
            var issue = this.developpers[dev].issues[i];

            if(!hisMilestones[issue.milestone.title]) {
               hisMilestones[issue.milestone.title] = [];
            }

            hisMilestones[issue.milestone.title].push( this.genItemFromIssue(issue));
         }

         // Génère le planning
         var mIndex = 0;
         for(var m in hisMilestones) {

            if(config.excludedMilestones.indexOf(m) != -1) {
               break;
            }

            planning.push({
               name: mIndex === 0 ? dev : " ",
               desc: m,
               values: hisMilestones[m]
            });
            mIndex++;
         }

         if(config.holidays[dev]) {
            var values = config.holidays[dev].map(function(holiday) {
               return {
                  from: "/Date("+holiday.start.getTime()+")/",
                  to: "/Date("+holiday.end.getTime()+")/",
                  label: holiday.title || 'holiday',
                  desc: holiday.title || 'holiday',
                  customClass: config.colorByDev[dev] || "ganttRed"
               };
            }, this);

            planning.push({
               name: " ",
               desc: "holidays",
               values: values
            });

         }

      }

      return planning;
   },


   getPlanningByMilestone: function () {

      // for each milestone get issues assigned dates and group by assignee
      var planning = [], milestone_obj;

      for(var m = 0 ; m < this.sorted_milestones.length ; m++) {
         var milestone = this.sorted_milestones[m];

console.log(milestone.title);
         if(config.excludedMilestones.indexOf(milestone.title) != -1) {
//            break;
         }
else {
console.log(milestone.title);

         var itsDevs = {};
         var min = (new Date(2018, 0, 1)).getTime(), max = (new Date()).getTime();

         milestone.issues.forEach(function(issue){
            var dev = issue.assignee ? issue.assignee.login : 'unassigned';
            if(!itsDevs[dev]) { itsDevs[dev] = []; }
            itsDevs[dev].push( this.genItemFromIssue(issue));

            if(issue.planning.start.getTime() < min)
               min = issue.planning.start.getTime();

            if(issue.planning.end.getTime() > max)
               max = issue.planning.end.getTime();
            
         }, this);

         // null if no due date
         var releaseDate = !!milestone.due_on ? (new Date(milestone.due_on)).getMidnight().getTime() : null;

         milestone_obj = {
            name: milestone.title,
            number: milestone.number,
            desc: " ",
            values: [
               {
                  from: "/Date("+min+")/",
                  to: "/Date("+max+")/",
                  label: milestone.title,
                  desc: milestone.title,
                  customClass: "ganttOrange",
                  dataObj: {
                     milestone: milestone.number
                  }
               }
            ]
         };
         
         // add a yellow star to show release date (if set)
         if (releaseDate) {
            milestone_obj.values.push({
               from: "/Date("+releaseDate+")/",
               to: "/Date("+releaseDate+")/",
               label: "★",
               desc: "Due date for : "+milestone.title,
               customClass: "ganttYellow",
               dataObj: {
                  milestone_release: milestone.number
               }
            });
         }
         
         planning.push(milestone_obj);

         // Génère le planning
         for(var d in itsDevs) {
            planning.push({
               name: " ",
               desc: d,
               values: itsDevs[d]
            });
         }

}
      }

      return planning;
   }

};

