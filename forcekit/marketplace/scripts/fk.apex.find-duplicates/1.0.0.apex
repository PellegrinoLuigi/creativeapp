// ForceKIT Marketplace · fk.apex.find-duplicates 1.0.0
// Values of a field found on more than one record, most repeated first
// (top 200). Where (optional) narrows the records. Read only.
// Up to 50,000 records per run: narrow them with Where if there are more.
String objName = '{{Object}}'.trim();
String fieldName = '{{Field}}'.trim();
String filter = '{{Where?}}'.trim();
Schema.SObjectType objType = Schema.getGlobalDescribe().get(objName);
Schema.SObjectField sf = objType == null ? null : objType.getDescribe().fields.getMap().get(fieldName);
if (sf == null) {
    System.debug('Field not found: ' + objName + '.' + fieldName);
} else if (!sf.getDescribe().isGroupable()) {
    System.debug(fieldName + ' cannot be grouped (long text, formula, encrypted...): choose another field.');
} else {
    String obj = objType.getDescribe().getName();
    String f = sf.getDescribe().getName();
    String whereClause = ' WHERE ' + f + ' != null' + (String.isBlank(filter) ? '' : ' AND (' + filter + ')');
    Integer total = Database.countQuery('SELECT COUNT() FROM ' + obj + whereClause);
    if (total > 49000) {
        System.debug(total + ' records to check: too many for one run (50,000). Narrow them with Where, e.g. CreatedDate = LAST_N_DAYS:365');
    } else {
        Integer groups = 0, extra = 0;
        for (AggregateResult ar : Database.query('SELECT ' + f + ' v, COUNT(Id) n FROM ' + obj + whereClause + ' GROUP BY ' + f + ' HAVING COUNT(Id) > 1 ORDER BY COUNT(Id) DESC LIMIT 200')) {
            Integer n = (Integer) ar.get('n');
            groups++;
            extra += n - 1;
            System.debug(n + ' x ' + ar.get('v'));
        }
        System.debug(groups + ' repeated value(s) · ' + extra + ' record(s) beyond the first · ' + total + ' record(s) checked');
    }
}
