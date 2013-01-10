
var config = {

   repo: 'user/repo',

   weekDaysOff: [0,6],

   colorByDev: {
      "neyric": "ganttBlue",
      "unassigned": "ganttRed"
   },

   holidays: {
      "neyric": [
         { start: new Date(2013, 0, 11), end: new Date(2013, 0, 11), title: 'Déménagement'}
      ]
   },


   excludedMilestones: [
      "Feature Paradize"
   ],

   defaultDuration: 1 // in days

};