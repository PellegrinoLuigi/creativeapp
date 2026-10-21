// ForceKIT Marketplace · fk.apex.sandbox-fix-emails 1.0.0
// After a sandbox refresh: removes ".invalid" from the email of active users,
// for one profile and/or a list of usernames (both empty = every user with
// ".invalid"). Reset passwords sends a reset link to the users of the profile
// or list whose email is already valid (run it again after restoring them).
// Mode Preview changes nothing; Apply saves. Only runs in a sandbox.
String profileName = '{{Profile?}}'.trim();
String usernamesRaw = '{{Usernames?}}'.trim();
Boolean resetPw = {{Reset passwords:checkbox}};
Boolean apply = '{{Mode:Preview,Apply}}' == 'Apply';
Organization org = [SELECT Name, IsSandbox FROM Organization];
if (!org.IsSandbox) {
    System.debug('This is not a sandbox: nothing changed. This script only runs in sandboxes.');
} else {
    Set<String> usernames = new Set<String>();
    for (String s : usernamesRaw.split('[,;\\s]+')) {
        if (String.isNotBlank(s)) usernames.add(s.trim());
    }
    String scope = (String.isBlank(profileName) ? '' : ' AND Profile.Name = :profileName') + (usernames.isEmpty() ? '' : ' AND Username IN :usernames');
    List<User> users = Database.query('SELECT Id, Name, Username, Email FROM User WHERE IsActive = true AND Email LIKE \'%.invalid\'' + scope + ' ORDER BY Name LIMIT 2000');
    for (User u : users) {
        String fixed = u.Email.removeEndIgnoreCase('.invalid');
        System.debug(u.Name + ' (' + u.Username + '): ' + u.Email + ' -> ' + fixed);
        u.Email = fixed;
    }
    if (!apply) {
        System.debug(users.size() + ' email(s) to restore. Preview: nothing changed, choose Apply to save.');
    } else if (!users.isEmpty()) {
        Integer ok = 0;
        List<Database.SaveResult> res = Database.update(users, false);
        for (Integer i = 0; i < res.size(); i++) {
            if (res[i].isSuccess()) ok++;
            else System.debug('Not saved ' + users[i].Username + ': ' + res[i].getErrors()[0].getMessage());
        }
        System.debug(ok + ' of ' + users.size() + ' email(s) restored.');
    } else {
        System.debug('No email to restore.');
    }
    if (resetPw) {
        if (String.isBlank(profileName) && usernames.isEmpty()) {
            System.debug('Reset passwords: choose a profile or usernames first (it never resets everybody).');
        } else {
            Id me = UserInfo.getUserId();
            List<User> targets = Database.query('SELECT Id, Name, Username, Email FROM User WHERE IsActive = true AND Id != :me AND (NOT Email LIKE \'%.invalid\')' + scope + ' ORDER BY Name LIMIT 50');
            for (User u : targets) {
                if (apply) System.resetPassword(u.Id, true);
                System.debug((apply ? 'Reset link sent: ' : 'Would reset: ') + u.Name + ' (' + u.Email + ')');
            }
            System.debug(targets.size() + ' password(s) ' + (apply ? 'reset' : 'to reset (Preview)') + ' · max 50 per run');
        }
    }
}
