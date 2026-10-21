// ForceKIT Marketplace · fk.apex.abort-scheduled-jobs 1.0.0
// Stops the scheduled jobs whose name contains the text ("*" = all of them),
// e.g. before deploying classes they use. Preview lists them; Apply stops
// them (they must be scheduled again afterwards).
String text = '{{Name contains}}'.trim();
Boolean apply = '{{Mode:Preview,Apply}}' == 'Apply';
String likeText = text == '*' ? '%' : '%' + text + '%';
Map<String, String> jobTypes = new Map<String, String>{
    '1' => 'Data export', '3' => 'Dashboard refresh', '4' => 'Reporting snapshot', '6' => 'Scheduled flow',
    '7' => 'Scheduled Apex', '8' => 'Report run', '9' => 'Batch job', 'A' => 'Reporting notification'
};
List<CronTrigger> jobs = [
    SELECT Id, CronJobDetail.Name, CronJobDetail.JobType, State, NextFireTime
    FROM CronTrigger
    WHERE CronJobDetail.Name LIKE :likeText AND State NOT IN ('DELETED', 'COMPLETE')
    ORDER BY CronJobDetail.Name
    LIMIT 500
];
Integer stopped = 0;
for (CronTrigger ct : jobs) {
    String kind = jobTypes.containsKey(ct.CronJobDetail.JobType) ? jobTypes.get(ct.CronJobDetail.JobType) : 'type ' + ct.CronJobDetail.JobType;
    String line = ct.CronJobDetail.Name + ' · ' + kind + ' · ' + ct.State + ' · next ' + ct.NextFireTime;
    if (apply) {
        try {
            System.abortJob(ct.Id);
            stopped++;
            System.debug('Stopped: ' + line);
        } catch (Exception ex) {
            System.debug('Not stopped: ' + line + ' · ' + ex.getMessage());
        }
    } else {
        System.debug(line);
    }
}
System.debug(apply ? stopped + ' of ' + jobs.size() + ' job(s) stopped.' : jobs.size() + ' job(s) found. Preview: nothing changed, choose Apply to stop them.');
