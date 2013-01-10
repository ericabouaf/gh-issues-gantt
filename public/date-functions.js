/**
 *  Add 'amount' days to this date and return a new date object
 */
Date.prototype.AddDays = function(amount) {
   var d = new Date(this.getTime());
   d.setDate(this.getDate() + amount);
   return d;
};


Date.prototype.weekNumber = function() {
   var MaDate = this;
   var mm = MaDate.getMonth(), jj = MaDate.getDate();

   var annee = MaDate.getFullYear();
   var NumSemaine = 0,
   ListeMois = new Array(31,28,31,30,31,30,31,31,30,31,30,31);

   if (annee %4 == 0 && annee %100 !=0 || annee %400 == 0) {ListeMois[1]=29};
   var TotalJour=0;
   for(cpt=0; cpt<mm; cpt++){TotalJour+=ListeMois[cpt];}
   TotalJour+=jj;
   DebutAn = new Date(annee,0,1);
   var JourDebutAn;
   JourDebutAn=DebutAn.getDay();
   if(JourDebutAn==0){JourDebutAn=7};

   TotalJour-=8-JourDebutAn;
   NumSemaine = 1;
   NumSemaine+=Math.floor(TotalJour/7);
   if(TotalJour%7!=0){NumSemaine+=1};

   return(NumSemaine);
}

Date.getToday = function() {
   var now = new Date();
   return now.getMidnight();
};

Date.prototype.getMidnight = function() {
   return new Date( this.getFullYear(), this.getMonth(), this.getDate(), 0, 0, 0);
};