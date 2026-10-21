# CampusPulse Profile Photos Upgrade

## Included
- Professional responsive sidebar and dashboard
- Admin avatar/name can be changed in Settings
- Sample avatars for demo students
- Add/edit students and upload each student's own photo
- Attendance page with Present / Absent / Unmarked statuses
- Search and class filters
- Engagement cards, summary reports, CSV export, dark mode
- Sample data is saved in browser localStorage

## Run locally
Open `index.html` in a browser. An internet connection is used for Google Fonts and sample avatar images.

## Publish to GitHub Pages from Android
1. Extract the ZIP on your phone.
2. Open your GitHub repository.
3. For each of `index.html`, `style.css`, and `script.js`, open the existing file and use Edit (pencil) to replace its contents, or upload the new file and confirm replacement if prompted.
4. Commit the changes. Keep `index.html` at the repository root.
5. Wait for GitHub Pages to deploy, then refresh your live website.

## Change photos later
- Admin: open Settings -> Upload photo -> Save profile.
- Student: open Students -> click Edit / Photo -> Choose photo -> Save student.
- This frontend demo stores photos as data URLs in localStorage. Use small images (under 900 KB). The photos and edits are only stored in that browser/device; they are not uploaded to a server or shared across devices.

## Notes
- Sample student names and profile images are fictional/demo content.
- Do not upload real student photos or sensitive records to a public repository.
- This project does not yet provide authentication or a server database.
