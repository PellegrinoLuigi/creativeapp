// ForceKIT Marketplace · fk.apex.scheduled-jobs 1.0.0
// Scheduled jobs of the org: name, type, state, cron expression and next run.
List<CronTrigger> jobs = [
    SELECT CronJobDetail.Name, CronJobDetail.JobType, State, CronExpression, NextFireTime, PreviousFireTime, CreatedBy.Name
    FROM CronTrigger
    ORDER BY NextFireTime NULLS LAST
    LIMIT 200
];
for (CronTrigger ct : jobs) {
    System.debug(ct.CronJobDetail.Name + ' · type ' + ct.CronJobDetail.JobType + ' · ' + ct.State + ' · ' + ct.CronExpression
        + ' · next ' + ct.NextFireTime + ' · last ' + ct.PreviousFireTime + ' · by ' + ct.CreatedBy.Name);
}
System.debug(jobs.size() + ' scheduled job(s)');
