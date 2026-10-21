// ForceKIT Marketplace · fk.apex.permission-explainer 1.0.0
// Why can (or can't) a user read, create, edit or delete an object, and read
// or edit one of its fields? Lists the profile, permission sets and permission
// set groups that give each permission. User: Id or username, empty = you.
// Read only. Sharing (which records) is separate: see "Record access".
String who = '{{User?}}'.trim();
String objName = '{{Object}}'.trim();
String fieldName = '{{Field?}}'.trim();
Id userId = Pattern.matches('[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?', who) ? Id.valueOf(who) : null;
List<User> users = String.isBlank(who)
    ? [SELECT Id, Name, Username, Profile.Name FROM User WHERE Id = :UserInfo.getUserId()]
    : [SELECT Id, Name, Username, Profile.Name FROM User WHERE Username = :who OR Id = :userId LIMIT 1];
Schema.SObjectType objType = Schema.getGlobalDescribe().get(objName);
if (users.isEmpty()) {
    System.debug('User not found: ' + who);
} else if (objType == null) {
    System.debug('Object not found: ' + objName);
} else {
    User u = users[0];
    String obj = objType.getDescribe().getName();
    Map<Id, String> sourceOf = new Map<Id, String>();
    for (PermissionSetAssignment a : [
        SELECT PermissionSetId, PermissionSet.Label, PermissionSet.IsOwnedByProfile, PermissionSet.Profile.Name, PermissionSetGroupId, PermissionSetGroup.MasterLabel
        FROM PermissionSetAssignment
        WHERE AssigneeId = :u.Id
    ]) {
        String src = a.PermissionSet.IsOwnedByProfile
            ? 'Profile "' + a.PermissionSet.Profile.Name + '"'
            : a.PermissionSetGroupId != null
                ? 'Permission set group "' + a.PermissionSetGroup.MasterLabel + '"'
                : 'Permission set "' + a.PermissionSet.Label + '"';
        sourceOf.put(a.PermissionSetId, src);
    }
    Set<Id> psIds = sourceOf.keySet();
    System.debug('User: ' + u.Name + ' (' + u.Username + ') · profile ' + u.Profile.Name + ' · ' + psIds.size() + ' permission source(s)');
    for (PermissionSet ps : [
        SELECT Id, PermissionsViewAllData, PermissionsModifyAllData
        FROM PermissionSet
        WHERE Id IN :psIds AND (PermissionsViewAllData = true OR PermissionsModifyAllData = true)
    ]) {
        System.debug('! ' + sourceOf.get(ps.Id) + ' gives ' + (ps.PermissionsModifyAllData ? 'Modify All Data' : 'View All Data') + ': access to every object');
    }
    Boolean r = false, c = false, e = false, d = false, va = false, ma = false;
    System.debug('--- Object ' + obj + ' ---');
    for (ObjectPermissions op : [
        SELECT ParentId, PermissionsRead, PermissionsCreate, PermissionsEdit, PermissionsDelete, PermissionsViewAllRecords, PermissionsModifyAllRecords
        FROM ObjectPermissions
        WHERE SobjectType = :obj AND ParentId IN :psIds
    ]) {
        List<String> p = new List<String>();
        if (op.PermissionsRead) p.add('Read');
        if (op.PermissionsCreate) p.add('Create');
        if (op.PermissionsEdit) p.add('Edit');
        if (op.PermissionsDelete) p.add('Delete');
        if (op.PermissionsViewAllRecords) p.add('View All');
        if (op.PermissionsModifyAllRecords) p.add('Modify All');
        r = r || op.PermissionsRead;
        c = c || op.PermissionsCreate;
        e = e || op.PermissionsEdit;
        d = d || op.PermissionsDelete;
        va = va || op.PermissionsViewAllRecords;
        ma = ma || op.PermissionsModifyAllRecords;
        if (!p.isEmpty()) System.debug('+ ' + sourceOf.get(op.ParentId) + ': ' + String.join(p, ', '));
    }
    System.debug('= ' + obj + ': Read ' + r + ' · Create ' + c + ' · Edit ' + e + ' · Delete ' + d + ' · View All ' + va + ' · Modify All ' + ma);
    if (String.isNotBlank(fieldName)) {
        String fieldPath = obj + '.' + fieldName;
        Boolean fr = false, fe = false;
        Integer rows = 0;
        System.debug('--- Field ' + fieldPath + ' ---');
        for (FieldPermissions fp : [
            SELECT ParentId, PermissionsRead, PermissionsEdit
            FROM FieldPermissions
            WHERE SobjectType = :obj AND Field = :fieldPath AND ParentId IN :psIds
        ]) {
            rows++;
            if (fp.PermissionsRead || fp.PermissionsEdit) System.debug('+ ' + sourceOf.get(fp.ParentId) + ': ' + (fp.PermissionsEdit ? 'Read, Edit' : 'Read'));
            fr = fr || fp.PermissionsRead;
            fe = fe || fp.PermissionsEdit;
        }
        System.debug('= ' + fieldPath + ': Read ' + fr + ' · Edit ' + fe
            + (rows == 0 ? ' (no field permissions: check the field name; some fields, like Id and Name, are always visible)' : ''));
    }
}
