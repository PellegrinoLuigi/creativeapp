// ForceKIT Marketplace · fk.apex.org-limits 1.1.0
// Org limits: usage, maximum and percentage, most used first.
// Only limits above the chosen threshold are listed.
Integer threshold = Integer.valueOf('{{Min percent:0,50,80}}');
Map<String, System.OrgLimit> limits = OrgLimits.getMap();
List<String> rows = new List<String>();
for (String n : limits.keySet()) {
    System.OrgLimit l = limits.get(n);
    if (l.getLimit() == 0) continue;
    Decimal pct = (Decimal.valueOf(l.getValue()) * 100 / l.getLimit()).setScale(1);
    if (pct < threshold) continue;
    // zero-padded percentage first, so that sorting puts the most used on top
    rows.add(String.valueOf(10000 - (pct * 10).intValue()).leftPad(5, '0') + '|' + n + ': ' + l.getValue() + ' / ' + l.getLimit() + ' (' + pct + '%)');
}
rows.sort();
for (String r : rows) {
    System.debug(r.substringAfter('|'));
}
System.debug(rows.size() + ' limit(s) at or above ' + threshold + '%');
