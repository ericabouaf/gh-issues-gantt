# Github issues Gantt


![Gantt Diagram](screenshot.png?raw=true "GitHub Issues Gantt")


## Installation

Requires [Node.js](https://nodejs.org/en/)

In a shell, clone the git repository and install the dependencies:

````sh
git clone git://github.com/neyric/gh-issues-gantt.git
cd gh-issues-gantt
npm install
````

## Configuration

* copy config.example.js to config.js
* edit config.js to:
    * set the GitHub repository and credentials
    * add your Gantt configurations (colors, holidays, ...)


## Start the server

In a shell:

````sh
node server.js
````

Open http://localhost:3001

:warning: The issues and milestones are downloaded **only** the first time you access the page, click on the refresh button if you need to actualize them.

## In GitHub

* All milestones should have a due date configured
* All issues should belong to a milestone
* You can set the duration of each ticket by adding a label "1D" (1 day), "2D" (2 days), ...

## Custom colors per developer

Edit your config.js file to define a color for each github username:
````js
colorByDev: {
    "username1":     "ganttGreen",  // don't forget the comma
    "otherUserName": "ganttOrange", // use the proper case in usernames
    "unassigned":    "ganttRed"
}
````

Colors available by default are: ganttBlue, ganttGreen, ganttOrange, ganttRed.

You can add additional color definitions into public/stylesheets/style.css, e.g.:

````css
.fn-gantt .ganttPurple { background-color: #DCBFEE; } // The color of the issue
.fn-gantt .ganttPurple .fn-label { color: #4F1D6B; }  // The color of the text of the issue
````

## Credits

 * Jquery Gantt widget: http://taitems.github.com/jQuery.Gantt/
