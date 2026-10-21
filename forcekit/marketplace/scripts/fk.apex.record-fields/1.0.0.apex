// ForceKIT Marketplace · fk.apex.record-fields 1.0.0
// Every field of a record you can read, with label, API name and value,
// also the ones that aren't on the page layout. Read only.
Id recId = Id.valueOf('{{Record Id}}'.trim());
Boolean showEmpty = {{Show empty fields:checkbox}};
Schema.DescribeSObjectResult od = recId.getSObjectType().getDescribe();
Map<String, Schema.SObjectField> fm = od.fields.getMap();
List<String> names = new List<String>();
for (Schema.SObjectField sf : fm.values()) {
    Schema.DescribeFieldResult d = sf.getDescribe();
    if (d.isAccessible() && d.getType() != Schema.DisplayType.BASE64) names.add(d.getName());
}
names.sort();
SObject rec = Database.query('SELECT ' + String.join(names, ', ') + ' FROM ' + od.getName() + ' WHERE Id = :recId');
System.debug(od.getLabel() + ' (' + od.getName() + ') · ' + recId);
Integer shown = 0;
for (String n : names) {
    Object v = rec.get(n);
    if (v == null && !showEmpty) continue;
    System.debug(fm.get(n).getDescribe().getLabel() + ' (' + n + '): ' + v);
    shown++;
}
System.debug(shown + ' of ' + names.size() + ' field(s)' + (showEmpty ? '' : ' (empty ones hidden)'));
