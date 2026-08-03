# ScholarSphere Pro Stitch Route Map

Source project: `ScholarSphere Pro` / `projects/563549845822194990`

Downloaded templates live in:

- `.stitch/scholar-pro/desktop`
- `.stitch/scholar-pro/mobile`
- `public/stitch/scholar-pro/desktop`
- `public/stitch/scholar-pro/mobile`

## Route Mapping

| App route | Desktop Stitch template | Mobile Stitch template | Notes |
| --- | --- | --- | --- |
| `/dashboard` | `desktop/admin-dashboard.html` | `mobile/admin-dashboard.html` | Primary admin overview |
| `/students` | `desktop/student-management.html` | `mobile/add-student.html` | No dedicated mobile student list was provided; closest student mobile template is add student |
| `/students/new` | `desktop/add-student-modal.html` | `mobile/add-student.html` | Desktop design is modal-style |
| `/students/[id]` | `desktop/student-management.html` | `mobile/add-student.html` | No student detail template provided |
| `/staff` | `desktop/staff-management.html` | `mobile/staff-management.html` | Direct match |
| `/staff/[id]` | `desktop/staff-management.html` | `mobile/staff-management.html` | No staff detail template provided |
| `/attendance` | `desktop/mark-attendance-modal.html` | `mobile/attendance.html` | Desktop design is modal-style |
| `/attendance/reports` | `desktop/reports.html` | `mobile/reports.html` | Report template |
| `/gradebook` | `desktop/gradebook.html` | `mobile/gradebook.html` | Direct match |
| `/gradebook/reports` | `desktop/grade-entry.html` | `mobile/gradebook.html` | Grade entry/report views share gradebook mobile |
| `/fees` | `desktop/fees-payments.html` | `mobile/admin-dashboard.html` | No fees mobile template provided |
| `/fees/invoices` | `desktop/fees-payments.html` | `mobile/admin-dashboard.html` | No invoice-specific template provided |
| `/fees/payments` | `desktop/record-payment.html` | `mobile/admin-dashboard.html` | Desktop record payment direct match |
| `/timetable` | `desktop/timetable.html` | `mobile/timetable.html` | Direct match |
| `/timetable/manage` | `desktop/timetable.html` | `mobile/timetable.html` | No separate manage template provided |
| `/reports` | `desktop/reports.html` | `mobile/reports.html` | Added to expose the provided report templates |

## Extra Stitch States

- `desktop/admin-dashboard-interactive-states.html`
- `desktop/export-report-options.html`

These are interaction/state templates, not primary app routes.
