




/**
 * Accepts a date, a mask, or a date and a mask.
 * Returns a formatted version of the given date.
 * The date defaults to the current date/time.
 * The mask defaults to dateFormat.masks.default.
 *
 * inspired by Date Format 1.2.3 (http://blog.stevenlevithan.com/archives/date-time-format)
 *
 */

var dateFormat = (function () {
   var   token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
      timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
      timezoneClip = /[^\-+\dA-Z]/g,
      pad = function (val, len) {
         val = String(val);
         len = len || 2;
         while (val.length < len) { val = "0" + val; }
         return val;
      };

   // Regexes and supporting functions are cached through closure
   return function (date, mask, utc) {
      var dF = dateFormat;

      // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
      if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !(/\d/).test(date)) {
         mask = date;
         date = undefined;
      }

      // Passing date through Date applies Date.parse, if necessary
      date = date ? Date.parseDBdate(date) : new Date();
      
      if (date === null) {
         throw new SyntaxError("invalid date");
      }

      mask = String(dF.masks[mask] || mask || dF.masks["default"]);

      // Allow setting the utc argument via the mask
      if (mask.slice(0, 4) == "UTC:") {
         mask = mask.slice(4);
         utc = true;
      }

      var   _ = utc ? "getUTC" : "get",
         d = date[_ + "Date"](),
         D = date[_ + "Day"](),
         m = date[_ + "Month"](),
         y = date[_ + "FullYear"](),
         H = date[_ + "Hours"](),
         M = date[_ + "Minutes"](),
         s = date[_ + "Seconds"](),
         L = date[_ + "Milliseconds"](),
         o = utc ? 0 : date.getTimezoneOffset(),
         flags = {
            d:    d,
            dd:   pad(d),
            ddd:  dF.i18n.dayNames[D],
            dddd: dF.i18n.dayNames[D + 7],
            m:    m + 1,
            mm:   pad(m + 1),
            mmm:  dF.i18n.monthNames[m],
            mmmm: dF.i18n.monthNames[m + 12],
            yy:   String(y).slice(2),
            yyyy: y,
            h:    H % 12 || 12,
            hh:   pad(H % 12 || 12),
            H:    H,
            HH:   pad(H),
            M:    M,
            MM:   pad(M),
            s:    s,
            ss:   pad(s),
            l:    pad(L, 3),
            L:    pad(L > 99 ? Math.round(L / 10) : L),
            t:    H < 12 ? "a"  : "p",
            tt:   H < 12 ? "am" : "pm",
            T:    H < 12 ? "A"  : "P",
            TT:   H < 12 ? "AM" : "PM",
            Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
            o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
            S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
         };

      return mask.replace(token, function ($0) {
         return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
      });
   };
}());


// For convenience...
Date.prototype.format = function (mask, utc) {
   return dateFormat(this, mask, utc);
};




/**
 * Date.parseDBdate
 * Parse a string like : "2007-02-13 09:30:00" (database DATETIME format)
 *                       "2010-05-16T22:00:00.000Z" (default format in JSON)
 * and return a new javascript Date object
 */

// Code inspired by Y.DataType.Date.parse and Y.Lang.isDate (yui 3.8.0)
Date.parseDBdate = function (data) {
   
   if (typeof data === "string") {
      
      data = new Date(data.replace(/-/g, '/').replace('T', ' ').substring(0,19));
      
      // With safari < 5.1 (webkit < 534 ?), if "new Date(str)" returns a valid date (where str is a
      // string), then subsenquent calls to new Date('') will also return that date (!) instead of an
      // invalid date. The problem can be fixed by first calling "new Date(str)" where the result is
      // an invalid date.
      //
      // That's what we do here, so that next call to parseDBdate with data='' will work.
      new Date('thisisnotadate'); // => Invalid Date
   }
   
   if (Object.prototype.toString.call(data) === '[object Date]' && data.toString() !== 'Invalid Date' && !isNaN(data)) {
      return data;
   }
   
   return null;
   
};

/**
 * Static methods that returns today's date
 */
Date.getToday = function() {
   var now = new Date();
   return now.getMidnight();
};

/**
 * Determines whether or not the supplied item is a valid date instance.
 */
Date.isValidDate = function(d) {
   if ( Object.prototype.toString.call(d) !== "[object Date]" ) {
     return false;
   } else {
      return !isNaN(d.getTime());
   }
};

/**
 * Returns the same date at 00:00:00
 */
Date.prototype.getMidnight = function() {
   return new Date( this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
};

/**
 * Calculate the number of days between this date and cmpDate
 * BEWARE !! you must do getMidnight on the object cmpDate you pass
 * to DiffDays if you want the real difference of days between the two dates
 * TODO : improve this function and check in all the code how it is used
 */
Date.prototype.DiffDays = function(cmpDate) {
   var temp = this.getMidnight();
   // Use "round" instead of "floor" because of CET/CEST change
   return Math.round((temp-cmpDate)/86400000);
};


/**
 *  Add 'amount' days to this date and return a new date object
 */
Date.prototype.AddDays = function(amount) {
   var d = new Date(this.getTime());
   d.setDate(this.getDate() + amount);
   return d;
};

/**
 *  Add 'amount' weeks to this date and return a new date object
 */
Date.prototype.AddWeeks = function(amount) {
   return this.AddDays(7*amount);
};

Date.prototype.AddMonths = function(amount) {
   var d = new Date(this.getTime());
   var newMonth = d.getMonth() + amount;
   var years = 0;
   if (newMonth < 0) {
      while (newMonth < 0) {
         newMonth += 12;
         years -= 1;
      }
   } else if (newMonth > 11) {
      while (newMonth > 11) {
         newMonth -= 12;
         years += 1;
      }
   }
   d.setMonth(newMonth);
   d.setFullYear(d.getFullYear() + years);
   return d;
};

/**
 *  Add 'amount' minutes to this date and return a new date object
 */
Date.prototype.AddMinutes = function(amount) {
   var d = new Date();
   d.setTime(this.getTime()+amount*60000);
   return d;
};

/**
 *  Add 'amount' seconds to this date and return a new date object
 */
Date.prototype.AddSeconds = function(amount) {
   var d = new Date();
   d.setTime(this.getTime()+amount*1000);
   return d;
};


/**
 *  Return the previous monday
 */
Date.prototype.GetMonday = function()  {
   var diffdays = 1-this.getDay();
   if(diffdays == 1) { diffdays = -6; }
   var lundi = this.AddDays(diffdays);
   var ret = new Date(lundi.getFullYear(), lundi.getMonth(), lundi.getDate() );
   return ret;
};


/**
 * findMonthStart
 */
Date.prototype.findMonthStart = function() {
   var start = new Date(this.getFullYear(), this.getMonth(), 1);
   return start;
};

Date.prototype.findMonthEnd = function() {
   var start = this.findMonthStart();
   var nextMonth = start.AddMonths(1);
   var end = nextMonth.AddDays(-1);
   return end;
};


// 2007-03-14
Date.prototype.toDayString = function() {
   return this.format("isoDate");
};

// 2008-03-14 12:43:23
Date.prototype.toStringDate = function() {
   return this.format("dateTime");
};



// Internationalization strings
dateFormat.i18n = {
   dayNames: [
      "Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam",
      "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"
   ],
   monthNames: [
      "Jan", "Fév", "Mars", "Avril", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc",
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
   ]
};


// Some common format strings
dateFormat.masks = {
   "default":      "ddd mmm dd yyyy HH:MM:ss",
   shortDate:      "d/m/yy",
   shortDateLongYear: "dd/mm/yyyy",
   mediumDate:     "dd mmm yyyy",
   longDate:       "dd mmmm yyyy",
   fullDate:       "dddd d mmmm yyyy",
   shortTime:      "HH'h'MM",
   mediumTime:     "HH'h'MM'm'ss's'",
   longTime:       "HH'h'MM'm'ss's'", // TODO ?
   isoDate:        "yyyy-mm-dd",
   isoTime:        "HH:MM:ss",
   isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
   isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'",
   dateTime:       "yyyy-mm-dd HH:MM:ss",
   
   shortHour:      "H'h'",
   shortYearDay:   "ddd dd mmm",
   mediumYearDay:  "dddd dd mmm",
   longYearDay:    "dddd dd mmmm",
   longMonth:     "mmmm yyyy",
   longDateTime:  "dddd d mmmm yyyy 'à' HH'h'MM",
   shortDayDateTime:  "ddd d mmmm yyyy 'à' HH'h'MM",
   noDayDateTime:  "dd/mm/yyyy 'à' HH'h'MM"
};
