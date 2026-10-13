## 2026-03-29 - Cache `Intl.DateTimeFormat` for timezone-aware date parsing
**Learning:** Constructing `new Intl.DateTimeFormat(...)` in JavaScript/V8 inside tight loops (e.g. iterating over thousands of venue sessions) is ~30–50x slower than calling `.format()` or `.formatToParts()` on cached instances.
**Action:** Always cache `Intl.DateTimeFormat` instances in a `Map` keyed by timezone/options when parsing or formatting dates in loops or repeated function calls.
