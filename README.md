# AI Pulse Poll

A reusable live poll for training sessions. Participants answer on their phones, or scan a QR code. You show the results page on your screen and it updates by itself.

## Pages

- `organiser.html`  Type a client code and a session title. Copy the links, or download the QR code as a PNG.
- `index.html?c=CODE&t=TITLE`  Participant page.
- `results.html?c=CODE&t=TITLE`  Your live results screen.

Each client code keeps its own separate votes. A new code always starts clean.

## Results screen

- Opens on a Join slide with a large QR code. Use the list on the left to move between slides, or the arrow keys.
- Click any bar or word to filter every other chart to the people who chose it. The dots on the left show who they are. Press Escape or Clear filter to go back.
- Focus shows one question large. All charts shows every question on one page.
- Sort by votes reorders the bars. Full screen is best for presenting.

## Change the questions

Edit `public/questions.js` only. Then upload it to GitHub again.

## Optional: reset button

The Reset votes button needs a PIN. In Netlify go to Site configuration, Environment variables, add `RESET_PIN` with any value you like, then deploy again (Deploys, Trigger deploy, Clear cache and deploy site). If you skip this, just use a new client code for a clean start.

## Notes

- Votes are anonymous. Nothing but the answers is stored.
- One browser counts as one person. Resubmitting replaces the earlier answers.
- Built for groups of up to a few hundred people.
- The font (Bricolage Grotesque) is licensed under the SIL Open Font License 1.1. The QR code library (qrcode-generator by Kazuhiko Arase) is MIT licensed.
- To remove everything later, delete the site in Netlify.
