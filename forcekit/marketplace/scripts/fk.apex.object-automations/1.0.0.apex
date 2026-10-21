// ForceKIT Marketplace · fk.apex.object-automations 1.0.0
// What runs on an object: Apex triggers (and on which events), record-triggered
// flows and processes, approval processes, duplicate rules, assignment rules.
// Read only. Validation and workflow rules are only listed in Setup.
String objName = '{{Object}}'.trim();
Schema.SObjectType objType = Schema.getGlobalDescribe().get(objName);
if (objType == null) {
    System.debug('Object not found: ' + objName);
} else {
    String obj = objType.getDescribe().getName();
    // custom objects are referenced by their Id (EntityDefinition.DurableId)
    Set<String> keys = new Set<String>{ obj };
    try {
        for (SObject ed : Database.query('SELECT DurableId FROM EntityDefinition WHERE QualifiedApiName = :obj')) keys.add((String) ed.get('DurableId'));
    } catch (Exception ex) {
        System.debug('(EntityDefinition not available: ' + ex.getMessage() + ')');
    }
    Integer total = 0;
    System.debug('--- Apex triggers ---');
    for (ApexTrigger t : [
        SELECT Name, NamespacePrefix, Status, UsageBeforeInsert, UsageAfterInsert, UsageBeforeUpdate, UsageAfterUpdate, UsageBeforeDelete, UsageAfterDelete, UsageAfterUndelete
        FROM ApexTrigger
        WHERE TableEnumOrId IN :keys
        ORDER BY Name
    ]) {
        List<String> ev = new List<String>();
        if (t.UsageBeforeInsert) ev.add('before insert');
        if (t.UsageAfterInsert) ev.add('after insert');
        if (t.UsageBeforeUpdate) ev.add('before update');
        if (t.UsageAfterUpdate) ev.add('after update');
        if (t.UsageBeforeDelete) ev.add('before delete');
        if (t.UsageAfterDelete) ev.add('after delete');
        if (t.UsageAfterUndelete) ev.add('after undelete');
        System.debug((t.Status == 'Active' ? '[on]  ' : '[off] ') + (String.isBlank(t.NamespacePrefix) ? '' : t.NamespacePrefix + '__') + t.Name + ' · ' + String.join(ev, ', '));
        total++;
    }
    System.debug('--- Flows and processes started by the record ---');
    try {
        for (SObject f : Database.query('SELECT ApiName, Label, IsActive, ProcessType, TriggerType, RecordTriggerType FROM FlowDefinitionView WHERE TriggerObjectOrEventId IN :keys ORDER BY Label')) {
            System.debug((f.get('IsActive') == true ? '[on]  ' : '[off] ') + f.get('Label') + ' (' + f.get('ApiName') + ') · ' + f.get('ProcessType') + ' · ' + f.get('TriggerType')
                + (f.get('RecordTriggerType') == null ? '' : ' · ' + f.get('RecordTriggerType')));
            total++;
        }
    } catch (Exception ex) {
        System.debug('(flows not available here: ' + ex.getMessage() + ')');
    }
    System.debug('--- Approval processes ---');
    try {
        for (SObject p : Database.query('SELECT Name, DeveloperName, State FROM ProcessDefinition WHERE TableEnumOrId IN :keys ORDER BY Name')) {
            System.debug((p.get('State') == 'Active' ? '[on]  ' : '[off] ') + p.get('Name') + ' (' + p.get('DeveloperName') + ')');
            total++;
        }
    } catch (Exception ex) {
        System.debug('(approval processes not available here: ' + ex.getMessage() + ')');
    }
    System.debug('--- Duplicate rules ---');
    try {
        for (SObject dr : Database.query('SELECT MasterLabel, DeveloperName, IsActive FROM DuplicateRule WHERE SobjectType = :obj ORDER BY MasterLabel')) {
            System.debug((dr.get('IsActive') == true ? '[on]  ' : '[off] ') + dr.get('MasterLabel') + ' (' + dr.get('DeveloperName') + ')');
            total++;
        }
    } catch (Exception ex) {
        System.debug('(duplicate rules not available here: ' + ex.getMessage() + ')');
    }
    if (obj == 'Lead' || obj == 'Case') {
        System.debug('--- Assignment rules ---');
        for (AssignmentRule ar : [SELECT Name, Active FROM AssignmentRule WHERE SobjectType = :obj ORDER BY Name]) {
            System.debug((ar.Active ? '[on]  ' : '[off] ') + ar.Name);
            total++;
        }
    }
    System.debug(total + ' automation(s) on ' + obj + ' · validation and workflow rules: Setup > Object Manager > ' + obj);
}
