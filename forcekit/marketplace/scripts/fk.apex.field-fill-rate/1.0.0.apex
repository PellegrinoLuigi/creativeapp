// ForceKIT Marketplace · fk.apex.field-fill-rate 1.0.0
// For every field of an object: how many records have it filled in
// (checkboxes: checked), least used first. Where (optional) narrows the
// records, e.g.  CreatedDate = LAST_N_DAYS:365. Read only.
// One COUNT() per field: about 95 fields per run; the rest are listed.
String objName = '{{Object}}'.trim();
String filter = '{{Where?}}'.trim();
Schema.SObjectType objType = Schema.getGlobalDescribe().get(objName);
if (objType == null) {
    System.debug('Object not found: ' + objName);
} else {
    Schema.DescribeSObjectResult od = objType.getDescribe();
    String obj = od.getName();
    Integer total = Database.countQuery('SELECT COUNT() FROM ' + obj + (String.isBlank(filter) ? '' : ' WHERE ' + filter));
    System.debug(obj + ': ' + total + ' record(s)' + (String.isBlank(filter) ? '' : ' where ' + filter));
    String base = 'SELECT COUNT() FROM ' + obj + ' WHERE ' + (String.isBlank(filter) ? '' : '(' + filter + ') AND ');
    List<String> rows = new List<String>();
    List<String> skipped = new List<String>();
    if (total > 0) {
        for (Schema.SObjectField sf : od.fields.getMap().values()) {
            Schema.DescribeFieldResult d = sf.getDescribe();
            if (!d.isAccessible() || d.getType() == Schema.DisplayType.ID) continue;
            if (!d.isFilterable() || Limits.getQueries() >= Limits.getLimitQueries() - 2) {
                skipped.add(d.getName());
                continue;
            }
            String cond = d.getType() == Schema.DisplayType.BOOLEAN ? d.getName() + ' = true' : d.getName() + ' != null';
            Integer n = Database.countQuery(base + cond);
            Decimal pct = (Decimal.valueOf(n) * 100 / total).setScale(1);
            // zero-padded percentage first, so that sorting puts the least used on top
            rows.add(String.valueOf((pct * 10).intValue()).leftPad(5, '0') + '|' + pct + '% · ' + n + ' · ' + d.getLabel() + ' (' + d.getName() + ')' + (d.isCustom() ? '' : ' · standard'));
        }
    }
    rows.sort();
    for (String row : rows) System.debug(row.substringAfter('|'));
    if (!skipped.isEmpty()) {
        skipped.sort();
        System.debug('Not counted (long text, address, or over the query limit): ' + String.join(skipped, ', '));
    }
}
