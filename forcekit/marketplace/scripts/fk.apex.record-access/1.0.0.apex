// ForceKIT Marketplace · fk.apex.record-access 1.0.0
// What a user can do on a record (read, edit, delete, transfer, all),
// as Salesforce computes it. Without a user: the current user.
Id recordId = '{{RecordId}}'.trim();
String u = '{{UserId?}}'.trim();
Id userId = String.isBlank(u) ? UserInfo.getUserId() : (Id) u;
UserRecordAccess a = [
    SELECT RecordId, MaxAccessLevel, HasReadAccess, HasEditAccess, HasDeleteAccess, HasTransferAccess, HasAllAccess
    FROM UserRecordAccess
    WHERE UserId = :userId AND RecordId = :recordId
];
User usr = [SELECT Name, Profile.Name FROM User WHERE Id = :userId];
System.debug('User: ' + usr.Name + ' (' + usr.Profile.Name + ')');
System.debug('Record: ' + recordId + ' (' + recordId.getSobjectType() + ')');
System.debug('Max access: ' + a.MaxAccessLevel);
System.debug('Read: ' + a.HasReadAccess + ' · Edit: ' + a.HasEditAccess + ' · Delete: ' + a.HasDeleteAccess + ' · Transfer: ' + a.HasTransferAccess + ' · All: ' + a.HasAllAccess);
