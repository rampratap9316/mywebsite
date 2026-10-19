# Student Attendance & Engagement Dashboard

**Student:** Ram Pratap Maurya  
**Course:** BCA · Semester 5  
**Project title:** Student Attendance & Engagement Dashboard

## Project files

- `index.html` — page layout and forms
- `style.css` — responsive blue-and-white dashboard styling
- `script.js` — student, attendance, engagement, reporting, CSV and LocalStorage logic

## Run locally

1. Download and extract the ZIP file.
2. Open the `student_attendance_engagement_dashboard` folder.
3. Double-click `index.html` to open it in a modern browser (Chrome, Edge, or Firefox).
4. For the icons and Google Fonts, an internet connection may be used. The core dashboard logic and data storage run locally; icons/fonts may fall back if offline.
5. The first launch loads fictional demo students and seven days of sample attendance. Changes are stored in the same browser using LocalStorage.

No server, paid API, package installation, or login is required.

## Test checklist

1. **First launch:** check that students, summary cards, chart, and attendance records are populated.
2. **Add student:** Students → Add student. Enter a unique roll number and valid email. Confirm the new row appears.
3. **Duplicate roll number:** try adding a second student with an existing roll number. The app should show an error.
4. **Edit/delete:** use the pencil icon to edit. Use the trash icon and confirmation dialog to delete.
5. **Search/filter:** search by name, roll number or email; filter by class.
6. **Attendance:** choose today or a past date. Mark Present/Absent, then click Save attendance. Click a status again to update it. Check that the same student/date never appears twice in the history data.
7. **Attendance calculations:** use Reports to compare Present / Sessions × 100. A student with 3 Present marks in 4 sessions should show 75%.
8. **Engagement:** change participation/activity to values from 0–100, change assignment status, and click Save scores.
9. **LocalStorage:** refresh the page. Changes should remain in the same browser.
10. **CSV export:** Reports → Export CSV. Open the downloaded CSV with a spreadsheet app.
11. **Responsive layout:** resize the browser or use mobile view. On a phone, use the menu button to open navigation.
12. **Reset:** click the circular-arrow icon in the header and confirm to restore the original fictional sample data.

## Viva notes

- **HTML5:** structures the dashboard, forms, navigation, and tables.
- **CSS3:** styles the dashboard and uses media queries for mobile/tablet screens.
- **JavaScript:** handles CRUD actions, filtering, calculations, charts, validation, and CSV export.
- **LocalStorage:** saves the demo data as JSON in the browser. It is not a backend database and is not shared across browsers/devices.
- **Attendance percentage:** `(present records / all recorded attendance records for that student) × 100`.
- **Duplicate attendance prevention:** records are keyed by date + student ID; marking the same student on the same date updates the existing record.
- **Engagement average:** `(participation + activity + assignment score) / 3`, where completed assignment is 100 and pending is 0.
- **Low attendance warning:** appears when a student has attendance records and their percentage is below 75%.
- **Limitations:** demo data is fictional; there is no secure authentication, cloud sync, or server database.

## Screenshot guidance

Capture genuine screenshots after running the project:
1. Dashboard overview with summary cards and chart.
2. Student directory showing sample students.
3. Attendance screen with statuses marked.
4. Engagement tracker and metric bars.
5. Reports page with attendance warnings.
6. A real CSV file opened in a spreadsheet app.

Use your browser's screenshot tool or your operating system's screenshot shortcut. Do not use mock screenshots as proof of testing.
