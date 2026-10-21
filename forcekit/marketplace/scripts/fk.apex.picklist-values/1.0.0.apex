// ForceKIT Marketplace · fk.apex.picklist-values 1.0.0
// Values of a picklist field: API name, label, active and default.
String objName = '{{Object}}'.trim();
String fieldName = '{{Field}}'.trim();
Schema.SObjectType t = Schema.getGlobalDescribe().get(objName);
Schema.SObjectField f = t == null ? null : t.getDescribe().fields.getMap().get(fieldName);
if (f == null) {
    System.debug('Field not found: ' + objName + '.' + fieldName);
} else {
    Schema.DescribeFieldResult d = f.getDescribe();
    System.debug(d.getLabel() + ' (' + d.getType() + ')');
    for (Schema.PicklistEntry e : d.getPicklistValues()) {
        System.debug(e.getValue() + ' · ' + e.getLabel() + (e.isActive() ? '' : ' · inactive') + (e.isDefaultValue() ? ' · default' : ''));
    }
}
