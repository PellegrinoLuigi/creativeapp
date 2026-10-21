// ForceKIT Marketplace · fk.apex.failed-async-jobs 1.0.0
// Batch, Queueable, Future and scheduled Apex jobs that failed or ended
// with errors in the last days, newest first.
Integer days = Integer.valueOf('{{Days:1,7,30}}');
Datetime since = Datetime.now().addDays(-days);
List<AsyncApexJob> jobs = [
    SELECT ApexClass.Name, JobType, Status, NumberOfErrors, JobItemsProcessed, TotalJobItems, ExtendedStatus, CreatedDate, CreatedBy.Name
    FROM AsyncApexJob
    WHERE CreatedDate >= :since AND (Status = 'Failed' OR NumberOfErrors > 0)
    ORDER BY CreatedDate DESC
    LIMIT 200
];
for (AsyncApexJob j : jobs) {
    System.debug(j.CreatedDate + ' · ' + j.JobType + ' · ' + j.ApexClass.Name + ' · ' + j.Status + ' · errors ' + j.NumberOfErrors
        + ' (' + j.JobItemsProcessed + '/' + j.TotalJobItems + ') · by ' + j.CreatedBy.Name + (String.isBlank(j.ExtendedStatus) ? '' : ' · ' + j.ExtendedStatus));
}
System.debug(jobs.size() + ' job(s) with errors in the last ' + days + ' day(s)');
