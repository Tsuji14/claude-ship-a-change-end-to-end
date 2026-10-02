# Notes: `PUT /users/:id`

## The plan
I started Claude Code in plan mode and had it read the routes, the store and the grading tests before proposing anything. The plan I approved:
- add an `updateUser(id, { name, email })` helper to `db/store.js`
- add a `PUT /users/:id` route that validates the body (400), returns 404 for an unknown id and otherwise returns the updated user (200)
- add extra edge-case tests in a separate file, so the graded `tests/update-user.test.js` stays untouched
- write this file last

I approved the plan without edits. It already covered the 404 and 400 cases the tests expect, and it touched only the route and the store.

Design choices in the plan:
- **Validation is stricter than POST.** `name` and `email` must be non-empty strings, so `123`, `{}` and whitespace-only values are rejected. Values are stored exactly as sent; nothing is trimmed or coerced.
- **Validation runs before the lookup.** A bad body gets a 400 even when the id doesn't exist.
- **Only `name` and `email` are written.** An `id` or any other field in the body is ignored, so a client can't change a user's id.
- **Ids are parsed with `Number(req.params.id)`, as in GET.** A non-numeric id like `abc` returns 404.

## Model
I used Claude Opus 5.5, the model this session ran on.

## Commits
There are three commits, one logical change each:
1. `Add updateUser helper to the in-memory store`: the data-access layer on its own.
2. `Add PUT /users/:id with validation and not-found handling`: the route plus its edge-case tests. These are one commit because the tests describe that route's behavior.
3. `Add NOTES.md ...`: this write-up.

The order means each commit builds on the one before it, and you can read any one of them without the later ones.

## Review
Before committing I reviewed the diff and probed the edge cases directly:
- **Confirmed fine:** non-JSON bodies, JSON arrays and empty bodies return 400 without crashing. Unknown and non-numeric ids return 404. An `id` in the body can't overwrite the stored id. `npm test` and `npm run lint` pass.
- **Known limitations, left as they are:**
  - There's no email-format check, to stay consistent with `POST /users`.
  - Malformed JSON returns Express's default 400, which logs a stack trace and sends HTML instead of `{ error }` JSON. This affects every route, so a JSON error handler in `server.js` would be a separate change.
  - `npm ci` reports audit warnings for existing dependencies. I didn't upgrade any dependencies as part of this change.

A second review pass, asked for explicitly after the commits, found no bugs in the not-found path or the validation. It flagged these follow-ups, which I chose not to address in this PR:
- **Loose id parsing.** `Number()` accepts `0x1`, `1e0`, `1.0` and `" 1"`, so `PUT /users/0x1` updates user 1. `GET /users/:id` already behaves the same way, so the fix is a digits-only id parser shared by both routes.
- **Untested ordering.** No test pins down the validate-first ordering, where a bad body sent to an unknown id returns 400.
- **POST is looser than PUT.** `POST /users` still accepts non-string or whitespace-only `name` and `email` values that PUT rejects.
- **Small cleanups.** `updateUser` could reuse `getUserById`, and the `isNonEmptyString` helper could move to module level.
