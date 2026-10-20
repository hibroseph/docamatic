# ListRow

One page (or one note) in a list: favicon, page title, where and when, and how many notes it has.

## Use

- Show the page **title** and **domain**, never a raw URL. Store the title and favicon when a note is created.
- `dm-row__icon` holds the site's favicon as an `<img>`, or the first letter of the domain when there isn't one.
- `dm-row__meta`: domain · relative date ("2 days ago", then the date after a week).
- `dm-row__count`: the number of notes on that page.
- Rows are separated by `hairline` dividers.

## The consumer provides

A link or button per row, inside a `dm-list`.
