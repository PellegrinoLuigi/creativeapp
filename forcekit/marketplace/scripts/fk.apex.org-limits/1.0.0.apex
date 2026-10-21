// ForceKIT Marketplace · fk.apex.org-limits 1.0.0
// Org limits: current usage and maximum of every limit.
Map<String, System.OrgLimit> limits = OrgLimits.getMap();
List<String> names = new List<String>(limits.keySet());
names.sort();
for (String n : names) {
    System.OrgLimit l = limits.get(n);
    System.debug(n + ': ' + l.getValue() + ' / ' + l.getLimit());
}
