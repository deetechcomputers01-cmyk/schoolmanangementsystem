import type { StitchTemplatePair } from "@/types/stitch";

export const stitchTemplates = {
  dashboard: {
    desktop: "/stitch/scholar-pro/desktop/admin-dashboard.html",
    mobile: "/stitch/scholar-pro/mobile/admin-dashboard.html"
  },
  students: {
    desktop: "/stitch/scholar-pro/desktop/student-management.html",
    mobile: "/stitch/scholar-pro/mobile/add-student.html"
  },
  addStudent: {
    desktop: "/stitch/scholar-pro/desktop/add-student-modal.html",
    mobile: "/stitch/scholar-pro/mobile/add-student.html"
  },
  staff: {
    desktop: "/stitch/scholar-pro/desktop/staff-management.html",
    mobile: "/stitch/scholar-pro/mobile/staff-management.html"
  },
  attendance: {
    desktop: "/stitch/scholar-pro/desktop/mark-attendance-modal.html",
    mobile: "/stitch/scholar-pro/mobile/attendance.html"
  },
  gradebook: {
    desktop: "/stitch/scholar-pro/desktop/gradebook.html",
    mobile: "/stitch/scholar-pro/mobile/gradebook.html"
  },
  gradeEntry: {
    desktop: "/stitch/scholar-pro/desktop/grade-entry.html",
    mobile: "/stitch/scholar-pro/mobile/gradebook.html"
  },
  fees: {
    desktop: "/stitch/scholar-pro/desktop/fees-payments.html",
    mobile: "/stitch/scholar-pro/mobile/admin-dashboard.html"
  },
  payment: {
    desktop: "/stitch/scholar-pro/desktop/record-payment.html",
    mobile: "/stitch/scholar-pro/mobile/admin-dashboard.html"
  },
  timetable: {
    desktop: "/stitch/scholar-pro/desktop/timetable.html",
    mobile: "/stitch/scholar-pro/mobile/timetable.html"
  },
  reports: {
    desktop: "/stitch/scholar-pro/desktop/reports.html",
    mobile: "/stitch/scholar-pro/mobile/reports.html"
  }
} satisfies Record<string, StitchTemplatePair>;
