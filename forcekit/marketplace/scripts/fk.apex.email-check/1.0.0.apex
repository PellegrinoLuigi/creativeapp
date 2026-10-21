// ForceKIT Marketplace · fk.apex.email-check 1.0.0
// Can Apex send email in this org? Deliverability, today's single and mass
// email usage and, if you want, a test email to yourself.
Boolean sendTest = {{Send me a test email:checkbox}};
Boolean canSend = true;
try {
    Messaging.reserveSingleEmailCapacity(1);
    System.debug('OK: Apex can send email in this org.');
} catch (Exception ex) {
    canSend = false;
    System.debug('Blocked: ' + ex.getMessage());
    System.debug('Check Setup > Deliverability > Access level (new sandboxes start with "System email only").');
}
Map<String, System.OrgLimit> lims = OrgLimits.getMap();
for (String k : new List<String>{ 'SingleEmail', 'MassEmail' }) {
    if (lims.containsKey(k)) System.debug(k + ' today: ' + lims.get(k).getValue() + ' / ' + lims.get(k).getLimit());
}
if (sendTest && canSend) {
    Messaging.SingleEmailMessage m = new Messaging.SingleEmailMessage();
    m.setTargetObjectId(UserInfo.getUserId());
    m.setSaveAsActivity(false);
    m.setSubject('ForceKIT · test email');
    m.setPlainTextBody('Test email sent by the ForceKIT Marketplace script "Can this org send email?" from ' + UserInfo.getOrganizationName() + ' (' + UserInfo.getOrganizationId() + ').');
    List<Messaging.SendEmailResult> res = Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ m }, false);
    System.debug(res[0].isSuccess() ? 'Test email sent to ' + UserInfo.getUserEmail() : 'Not sent: ' + res[0].getErrors()[0].getMessage());
}
