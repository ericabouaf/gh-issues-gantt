/*global $,milestones,issues,window,config*/



/**
 * Issue
 */
var Issue = function(ghAttributes) {
   this._ghAttributes = ghAttributes;

   //this.developper = null;

   this.title = ghAttributes.title;
   this.number = ghAttributes.number;

   this.milestone = Milestone.byId[ghAttributes.milestone.id];
   this.milestone.issues.push(this);
};
Issue.byId = {}; // issues index by id
Issue.prototype = {


   getDuration: function () {

      var numericLabels = this._ghAttributes.labels.filter(function(l){ return l.name.match(/^\d+D$/); }),
          name,
          duration = config.defaultDuration;

      if(numericLabels.length > 0) {
         name = numericLabels[0].name;
         duration = parseInt( name.substr(0, name.length-1), 10);
      }

      this.calculatedDuration = duration;

      return duration;
   },

   getDevName: function() {
      return this._ghAttributes.assignee ? this._ghAttributes.assignee.login : 'unassigned';
   },

   ganttItem: function() {

      var dev = this.getDevName();

      return {
         from: "/Date("+this.planning.start.getTime()+")/",
         to: "/Date("+this.planning.end.getTime()+")/",
         label: this.title,
         desc: '#'+this.number + ': ' + this.title,
         customClass: config.colorByDev[dev] || "ganttRed",
         dataObj: {
            issue: this.number
         }
      };

   },

   plan: function() {

      // Developpeur et sa date de dispo
      var devName = this.getDevName();

      if(!Developper.byName[devName]) {
         new Developper(devName);
      }

      Developper.byName[devName].plan(this);
   }

};



/**
 * Milestone
 */
var Milestone = function(ghAttributes) {
   this._ghAttributes = ghAttributes;
   this.issues = [];

   this.id = ghAttributes.id;
   this.due_on = ghAttributes.due_on;
   this.title = ghAttributes.title;

   Milestone.byId[ghAttributes.id] = this;
   Milestone.all.push(this);
};
Milestone.all = [];
Milestone.byId = {}; // issues index by id
Milestone.prototype = {

   // assign tickets to each developper
   plan: function() {
      this.issues.forEach(function(issue) {
         issue.plan();
      });
   },

   getGanttPlanning: function() {

      var items = [];

      var itsDevs = {};
      var min = (new Date(2018, 0, 1)).getTime(), max = (new Date()).getTime();

      this.issues.forEach(function(issue){
         var dev = issue.getDevName();
         if(!itsDevs[dev]) { itsDevs[dev] = []; }
         itsDevs[dev].push( issue.ganttItem() );

         if(issue.planning.start.getTime() < min)
            min = issue.planning.start.getTime();

         if(issue.planning.end.getTime() > max)
            max = issue.planning.end.getTime();
         
      }, this);

      // null if no due date
      var releaseDate = !!this.due_on ? (new Date(this.due_on)).getMidnight().getTime() : null;

      milestone_obj = {
         name: this.title,
         number: this.number,
         desc: " ",
         values: [
            {
               from: "/Date("+min+")/",
               to: "/Date("+max+")/",
               label: this.title,
               desc: this.title,
               customClass: "ganttOrange",
               dataObj: {
                  milestone: this.number
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
            desc: "Due date for : "+this.title,
            customClass: "ganttYellow",
            dataObj: {
               milestone_release: this.number
            }
         });
      }
      
      items.push(milestone_obj);

      // Génère le planning
      for(var d in itsDevs) {
         items.push({
            name: " ",
            desc: d,
            values: itsDevs[d]
         });
      }

      return items;
   }

};

Milestone.getGanttPlanning = function() {
   var planning = [];
   Milestone.all.forEach(function(milestone) {
      planning = planning.concat(milestone.getGanttPlanning());
   });
   return planning;
};




/**
 * Developper
 */
var Developper = function(name) {

   this.name = name;
   Developper.byName[name] = this;


   this.next = Date.getToday();


   this.issues = [];
};
Developper.byName = {}; // developper by name
Developper.prototype = {

   plan: function(issue) {

      // Planification
      var durationInDays = issue.getDuration();

      var start = this.next;

      // handle holidays
      var devHolidays = config.holidays[this.name];
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

      this.next = end;

      this.issues.push(issue);
   },


   /**
    * Build the internale milestones index (regroup issues by milestones)
    */
   sortByMilestone: function() {
      this.milestones = {};
      this.issues.forEach(function(issue) {
         if(!this.milestones[issue.milestone.title]) {
            this.milestones[issue.milestone.title] = [];
         }
         this.milestones[issue.milestone.title].push(issue);
      }, this);
   },


   getGanttPlanning: function() {

      var items = [];


      // For each milestones :
      var mIndex = 0;
      for(var m in this.milestones) {
         items.push({
            name: mIndex === 0 ? this.name : " ",
            desc: m,
            values: this.milestones[m].map(function(i) { return i.ganttItem(); }, this)
         });
         mIndex++;
      }

      // For each holidays
      if(config.holidays[this.name]) {
         var values = config.holidays[this.name].map(function(holiday) {
            return {
               from: "/Date("+holiday.start.getTime()+")/",
               to: "/Date("+holiday.end.getTime()+")/",
               label: holiday.title || 'holiday',
               desc: holiday.title || 'holiday',
               customClass: config.colorByDev[this.name] || "ganttRed"
            };
         });

         items.push({
            name: " ",
            desc: "holidays",
            values: values
         });

      }

      return items;

   }


};

Developper.getGanttPlanning = function() {
   var planning = [];
   for(var devName in Developper.byName) {
      planning = planning.concat( Developper.byName[devName].getGanttPlanning() );
   }
   return planning;
};





/**
 * Planning is responsible for the calculation of the planning
 *
 *
 * TODO: 
 *    - Bug when tickets overlap holidays
 *    - Doc for duration labels
 */

var Planning = {


   init: function () {

      // Index milestones by id & add milestone issues
      milestones.forEach(function(ghAttributes) {
         if(config.excludedMilestones.indexOf(ghAttributes.title) == -1) {
            new Milestone(ghAttributes);
         }
      });
      Milestone.all = Milestone.all.sort( function (a,b){
         return a.due_on > b.due_on ? 1 : -1; 
      });


      // Dispatch issues in milestones
      issues.forEach(function(ghAttributes) {
         if(!ghAttributes.milestone) {
            $('#msg').append("<p><a href='https://github.com/"+config.repo+"/issues/"+ghAttributes.number+"' target='new'>issue #"+ghAttributes.number+"</a> has no milestone !</p>");
            return;
         }
         if(!!Milestone.byId[ghAttributes.milestone.id]) {
            new Issue(ghAttributes);
         }
      }, this);


      // Plan all tickets in milestone order
      Milestone.all.forEach(function(milestone) {
         milestone.plan();
      }, this);

      // Sort developper's internal issues by milestone
      for(var devName in Developper.byName) {
         Developper.byName[devName].sortByMilestone();
      }


      // Display Gantt
      var milestonePlanning = Milestone.getGanttPlanning();
      $(".gantt-milestone").gantt({
         source: milestonePlanning,
         navigate: "scroll",
         scale: "days",
         maxScale: "months",
         minScale: "days",
         itemsPerPage: 100,
         onItemClick: function(data) {
            Planning.onItemClick(data);
         }
      });


      // Display Gantt
      var devPlanning = Developper.getGanttPlanning();
      $(".gantt-dev").gantt({
         source: devPlanning,
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


   onItemClick: function(data) {
      var baseUrl = 'https://github.com/'+config.repo, url;

      if(data.issue) { url = baseUrl + '/issues/'+data.issue; }
      if(data.milestone) { url = baseUrl + '/issues?milestone='+data.milestone; }
      if(data.milestone_release) { url = baseUrl + '/issues/milestones/'+data.milestone_release+'/edit'; }

      if(url) { window.open(url,"_blank"); }
   }


};

