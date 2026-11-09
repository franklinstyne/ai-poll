# AI Pulse Poll

A reusable live poll for training sessions. Participants answer on their phones. You show the results page on your screen and it updates by itself.

## Pages

- `organiser.html`  Type a client code and a session title, copy the two links.
- `index.html?c=CODE&t=TITLE`  Participant page.
- `results.html?c=CODE&t=TITLE`  Your live results screen.

Each client code keeps its own separate votes. A new code always starts clean.

## Change the questions

Edit `public/questions.js` only. Then deploy again.

## Optional: reset button

The Reset votes button on the results page needs a PIN. In Netlify go to Site configuration, Environment variables, add `RESET_PIN` with any value you like, then deploy again. If you skip this, just use a new client code for a clean start.

## Notes

- Votes are anonymous. Nothing but the answers is stored.
- One browser counts as one person. Resubmitting replaces the earlier answers.
- Built for groups of up to a few hundred people.
- To remove everything later, delete the site in Netlify.
