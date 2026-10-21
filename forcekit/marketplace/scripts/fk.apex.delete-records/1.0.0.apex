// ForceKIT Marketplace · fk.apex.delete-records 1.0.0
// Deletes the records of an object that match Where (required), e.g.
//   Name LIKE 'TEST%'   or   CreatedDate = TODAY AND CreatedById = '005...'
// Preview counts them and shows the first 20; Apply deletes up to 9,000 per run
// (4,900 when emptying the recycle bin too). Only in sandboxes and Developer Edition orgs.
String objName = '{{Object}}'.trim();
String filter = '{{Where}}'.trim();
Boolean purge = {{Empty from recycle bin:checkbox}};
Boolean apply = '{{Mode:Preview,Apply}}' == 'Apply';
Organization org = [SELECT IsSandbox, OrganizationType FROM Organization];
Schema.SObjectType objType = Schema.getGlobalDescribe().get(objName);
if (!org.IsSandbox && org.OrganizationType != 'Developer Edition') {
    System.debug('This is a production org: nothing deleted. This script only runs in sandboxes and Developer Edition orgs.');
} else if (objType == null) {
    System.debug('Object not found: ' + objName);
} else if (String.isBlank(filter)) {
    System.debug('Where is required: it never deletes every record of an object.');
} else {
    String obj = objType.getDescribe().getName();
    Boolean hasName = objType.getDescribe().fields.getMap().containsKey('Name');
    Integer total = Database.countQuery('SELECT COUNT() FROM ' + obj + ' WHERE ' + filter);
    System.debug(total + ' ' + obj + ' record(s) where ' + filter);
    if (!apply) {
        for (SObject r : Database.query('SELECT Id' + (hasName ? ', Name' : '') + ' FROM ' + obj + ' WHERE ' + filter + ' LIMIT 20')) {
            System.debug(r.Id + (hasName ? ' · ' + r.get('Name') : ''));
        }
        System.debug('Preview: nothing deleted, choose Apply to delete them.');
    } else {
        Integer cap = purge ? 4900 : 9000;
        List<SObject> recs = Database.query('SELECT Id FROM ' + obj + ' WHERE ' + filter + ' LIMIT ' + cap);
        List<Id> deleted = new List<Id>();
        Integer shown = 0;
        List<Database.DeleteResult> res = Database.delete(recs, false);
        for (Integer i = 0; i < res.size(); i++) {
            if (res[i].isSuccess()) deleted.add(recs[i].Id);
            else if (shown++ < 10) System.debug('Not deleted ' + recs[i].Id + ': ' + res[i].getErrors()[0].getMessage());
        }
        if (purge && !deleted.isEmpty()) Database.emptyRecycleBin(deleted);
        System.debug(deleted.size() + ' of ' + recs.size() + ' record(s) deleted' + (purge ? ' and emptied from the recycle bin' : '')
            + (total > recs.size() ? ' · run it again for the remaining ' + (total - recs.size()) : '') + '.');
    }
}
