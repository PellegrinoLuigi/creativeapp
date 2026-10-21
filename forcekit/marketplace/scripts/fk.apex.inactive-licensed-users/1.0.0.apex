// ForceKIT Marketplace · fk.apex.inactive-licensed-users 1.0.0
// Active (standard) users who haven't logged in for the chosen number of
// days, or never, with profile and license; then a count per license.
// Users created in the same period are left out. Read only.
Integer days = Integer.valueOf('{{Days without login:90,30,60,180}}');
Datetime since = Datetime.now().addDays(-days);
Map<String, Integer> perLicense = new Map<String, Integer>();
List<User> users = [
    SELECT Name, Username, LastLoginDate, Profile.Name, Profile.UserLicense.Name
    FROM User
    WHERE IsActive = true AND UserType = 'Standard' AND CreatedDate < :since AND (LastLoginDate < :since OR LastLoginDate = null)
    ORDER BY LastLoginDate ASC NULLS FIRST
    LIMIT 1000
];
for (User u : users) {
    String lic = u.Profile.UserLicense.Name;
    perLicense.put(lic, (perLicense.containsKey(lic) ? perLicense.get(lic) : 0) + 1);
    System.debug((u.LastLoginDate == null ? 'never     ' : u.LastLoginDate.format('yyyy-MM-dd')) + ' · ' + u.Name + ' (' + u.Username + ') · ' + u.Profile.Name + ' · ' + lic);
}
System.debug('--- ' + users.size() + ' active user(s) without a login in the last ' + days + ' days ---');
for (String lic : perLicense.keySet()) System.debug(lic + ': ' + perLicense.get(lic));
