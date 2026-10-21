// ForceKIT Marketplace · fk.apex.count-records 1.0.0
// Counts the records of an object, with an optional WHERE condition
// (e.g.  CreatedDate = LAST_N_DAYS:7  or  StageName = 'Closed Won').
String obj = String.escapeSingleQuotes('{{Object}}'.trim());
String filter = '{{Where?}}'.trim();
String soql = 'SELECT COUNT() FROM ' + obj + (String.isBlank(filter) ? '' : ' WHERE ' + filter);
System.debug(soql);
System.debug(obj + ': ' + Database.countQuery(soql) + ' record(s)');
