# Github issues Gantt


![Gantt Diagram](/neyric/gh-issues-gantt/raw/master/screenshot.png "GitHub Issues Gantt")


## Installation

Requires Node.js

* Clone the git repository, and install dependencies

````sh
$ git clone git://github.com/neyric/gh-issues-gantt.git
$ cd gh-issues-gantt
$ npm install
````

## Configuration

* copy config.example.js to config.js, and set the repo GitHub credentials

* copy public/config.example.js to public/config.js, and edit the options


## Start the server

    node server.js

Open http://localhost:3001

/!\ The issues are downloaded ONLY the first time you access the page.

## In GitHub

* You can set the duration of each ticket by adding a label "1D" (1 day), "2D" (2 days), ...


## TODO

* fix bug: when tickets overlap holidays

* Add a refresh button



## Credits

 * Jquery Gantt widget: http://taitems.github.com/jQuery.Gantt/
