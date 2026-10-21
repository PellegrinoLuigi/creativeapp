// ForceKIT Marketplace · fk.apex.transfer-ownership 1.0.0
// Moves the records of an object owned by one user to another user.
// Users: Id or username. Where (optional) narrows the records.
// Preview counts them; Apply transfers up to 9,000 per run (run it again for more).
String objName = '{{Object}}'.trim();
String fromWho = '{{From user}}'.trim();
String toWho = '{{To user}}'.trim();
String filter = '{{Where?}}'.trim();
Boolean apply = '{{Mode:Preview,Apply}}' == 'Apply';
String idRe = '[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?';
Id fromKey = Pattern.matches(idRe, fromWho) ? Id.valueOf(fromWho) : null;
Id toKey = Pattern.matches(idRe, toWho) ? Id.valueOf(toWho) : null;
List<User> fromUsers = [SELECT Id, Name FROM User WHERE Username = :fromWho OR Id = :fromKey LIMIT 1];
List<User> toUsers = [SELECT Id, Name, IsActive FROM User WHERE Username = :toWho OR Id = :toKey LIMIT 1];
Schema.SObjectType objType = Schema.getGlobalDescribe().get(objName);
if (objType == null) {
    System.debug('Object not found: ' + objName);
} else if (!objType.getDescribe().fields.getMap().containsKey('OwnerId')) {
    System.debug(objName + ' has no owner (it is controlled by its parent).');
} else if (fromUsers.isEmpty() || toUsers.isEmpty()) {
    System.debug('User not found: ' + (fromUsers.isEmpty() ? fromWho : toWho));
} else if (!toUsers[0].IsActive) {
    System.debug(toUsers[0].Name + ' is not active: records can only go to an active user.');
} else {
    String obj = objType.getDescribe().getName();
    Id fromId = fromUsers[0].Id;
    Id toId = toUsers[0].Id;
    String whereClause = ' WHERE OwnerId = :fromId' + (String.isBlank(filter) ? '' : ' AND (' + filter + ')');
    Integer total = Database.countQuery('SELECT COUNT() FROM ' + obj + whereClause);
    System.debug(total + ' ' + obj + ' record(s) owned by ' + fromUsers[0].Name + (String.isBlank(filter) ? '' : ' where ' + filter) + ' -> ' + toUsers[0].Name);
    if (!apply) {
        System.debug('Preview: nothing changed, choose Apply to transfer them.');
    } else {
        List<SObject> recs = Database.query('SELECT Id FROM ' + obj + whereClause + ' LIMIT 9000');
        for (SObject r : recs) r.put('OwnerId', toId);
        Integer ok = 0, shown = 0;
        List<Database.SaveResult> res = Database.update(recs, false);
        for (Integer i = 0; i < res.size(); i++) {
            if (res[i].isSuccess()) ok++;
            else if (shown++ < 10) System.debug('Not transferred ' + recs[i].Id + ': ' + res[i].getErrors()[0].getMessage());
        }
        System.debug(ok + ' of ' + recs.size() + ' record(s) transferred' + (total > recs.size() ? ' · run it again for the remaining ' + (total - recs.size()) : '') + '.');
    }
}
