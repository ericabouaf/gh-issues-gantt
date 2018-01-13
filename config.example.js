module.exports = {
   server: {
      port: 3001
   },

   github: {
      repo: 'user/repo',
      username: 'gh-username',
      password: 'gh-password'
   },

   gantt: {
      // Don't plan anything on saturdays (6) and sundays (0)
      weekDaysOff: [0,6],

      // Associate each github user to a specifc color on the Gantt chart (default
      // colors available: ganttBlue, ganttRed, ganttGreen, ganttOrange)
      //
      // You can add your additional color definitions into public/stylesheets/style.css
      //
      // Beware that the github usernames are case sensitive.
      colorByDev: {
         "gh-username": "ganttBlue",
         "unassigned": "ganttRed"
      },

      // Configure off periods
      holidays: {
         "gh-username": [
            { start: "2017-08-08", end: "2017-08-13", title: "Summer holidays"}
         ]
      },

      // Exclude milestones listed below from the Gantt Chart
      excludedMilestones: [
         "Milestone Name"
      ],

      // Default duration (in days) for an issue which is not labelled
      defaultDuration: 1
   }
};
