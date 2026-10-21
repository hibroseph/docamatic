"""Writes the Chrome Web Store image pages (HTML) in this folder.

Each page is one store image, rendered at its exact size by a headless
browser (see README.md). They use the design system (store.css) and real
captures of the extension (raw/).
"""
from pathlib import Path

HERE = Path(__file__).parent
ICON = "../../../src/public/icons/docamatic-icon-48.png"
HEAD = '<!doctype html><html lang="en"><head><meta charset="utf-8"><link rel="stylesheet" href="store.css"></head><body>'
FOOT = "</body></html>"
BROWSER = (
    '<div class="browser__bar"><span class="browser__dots"><i></i><i></i><i></i></span>'
    '<div class="browser__tab">A beginner&#39;s sourdough, step by step</div></div>'
    '<div class="browser__toolbar"><div class="browser__url">slowbread.blog/sourdough-step-by-step</div>'
    f'<img class="browser__ext" src="{ICON}" alt=""></div>'
)
LIFT = "box-shadow: inset 0 0 0 1px var(--note-edge), var(--note-lift-hover)"


def page(name: str, width: int, height: int, body: str) -> None:
    html = f'{HEAD}<div class="canvas" style="width:{width}px;height:{height}px">{body}</div>{FOOT}'
    (HERE / f"{name}.html").write_text(html, encoding="utf-8")


page("shot-1-notes", 1280, 800, f"""
  <div class="block block--yellow" style="left:1010px;top:-60px;width:330px;height:250px"></div>
  <div class="block block--blue" style="left:-60px;top:520px;width:170px;height:330px"></div>
  <h1 class="headline" style="position:absolute;left:64px;top:52px;font-size:60px">Sticky notes on <span class="dm-swipe">any page</span></h1>
  <p class="sub" style="position:absolute;left:66px;top:132px;font-size:24px;max-width:860px">Jot it down right next to what you're reading. It's still there when you come back.</p>
  <div class="browser" style="left:64px;top:208px;width:1152px">{BROWSER}<img class="browser__page" src="raw/page.png" alt=""></div>
""")

page("shot-2-search", 1280, 800, """
  <div class="block block--blue" style="left:700px;top:60px;width:520px;height:680px"></div>
  <div class="block block--yellow" style="left:-50px;top:600px;width:420px;height:260px"></div>
  <h1 class="headline" style="position:absolute;left:72px;top:150px;font-size:68px;width:560px">Find <span class="dm-swipe">any note</span>, even with a typo</h1>
  <p class="sub" style="position:absolute;left:74px;top:400px;font-size:24px;width:520px">Search titles, text, tags and page names across everything you've written, on every site.</p>
  <div class="popup" style="left:770px;top:96px;width:400px"><img src="raw/popup-search.png" alt=""></div>
""")

page("shot-3-tags", 1280, 800, f"""
  <div class="block block--pink" style="left:660px;top:-40px;width:560px;height:430px"></div>
  <div class="block block--green" style="left:1040px;top:560px;width:300px;height:300px"></div>
  <h1 class="headline" style="position:absolute;left:72px;top:160px;font-size:68px;width:540px">Tag it. Find it from <span class="dm-swipe">anywhere</span>.</h1>
  <p class="sub" style="position:absolute;left:74px;top:400px;font-size:24px;width:500px">Group notes from different sites with tags like “baking” or “to try”. Rename or recolor a tag once and it changes everywhere.</p>
  <div class="popup" style="left:820px;top:80px;width:380px"><img src="raw/popup-tags.png" alt=""></div>
  <div class="note-mock" style="left:560px;top:560px;width:270px">
    <article class="dm-note dm-note--pink" style="{LIFT}">
      <div class="dm-note__head"><h3 class="dm-note__title">Next time</h3></div>
      <p class="dm-note__body">Try 75% water and a longer cold proof in the fridge.</p>
      <div class="dm-note__tags"><span class="dm-tag">baking</span><span class="dm-tag dm-tag--pink">to try</span></div>
    </article>
  </div>
""")

# The selection in raw/page-plain.png ends at (330, 365) in the page; in
# this frame (scaled 0.96, below 83px of browser bars) that's about (384, 644)
page("shot-4-rightclick", 1280, 800, f"""
  <div class="block block--green" style="left:1060px;top:-40px;width:280px;height:200px"></div>
  <h1 class="headline" style="position:absolute;left:64px;top:52px;font-size:60px">Right-click to <span class="dm-swipe dm-swipe--green">add a note</span></h1>
  <p class="sub" style="position:absolute;left:66px;top:132px;font-size:24px;max-width:1000px">Select text, right-click, “Add a note here”. It lands where you clicked, with your text in it.</p>
  <div class="browser" style="left:64px;top:208px;width:1152px">{BROWSER}<img class="browser__page" src="raw/page-plain.png" alt=""></div>
  <div class="ctx" style="left:392px;top:600px">
    <div>Copy</div><div>Search Google for “Feed your starter…”</div><hr>
    <div class="on"><img src="{ICON}" alt="">Add a note here</div><hr>
    <div class="muted">Inspect</div>
  </div>
""")

page("shot-5-yours", 1280, 800, """
  <div class="block block--yellow" style="left:600px;top:40px;width:640px;height:720px"></div>
  <h1 class="headline" style="position:absolute;left:72px;top:170px;font-size:68px;width:520px">Yours, and <span class="dm-swipe">only yours</span></h1>
  <p class="sub" style="position:absolute;left:74px;top:350px;font-size:24px;width:480px">No account. Your notes stay in your browser, with automatic backups you can download any time.</p>
  <p class="sub" style="position:absolute;left:74px;top:500px;font-size:24px;width:480px;color:var(--ink);font-weight:600">Light or dark, your choice.</p>
  <div class="popup" style="left:640px;top:96px;width:330px"><img src="raw/popup-thispage.png" alt=""></div>
  <div class="popup" style="left:900px;top:180px;width:330px"><img src="raw/popup-all-dark.png" alt=""></div>
""")

page("marquee", 1400, 560, f"""
  <div class="block block--yellow" style="left:690px;top:-80px;width:250px;height:720px"></div>
  <div class="block block--pink" style="left:1220px;top:380px;width:240px;height:240px"></div>
  <div class="wordmark" style="position:absolute;left:72px;top:64px;font-size:30px">Docamatic</div>
  <h1 class="headline" style="position:absolute;left:70px;top:132px;font-size:74px;width:620px">Sticky notes for <span class="dm-swipe">the web</span></h1>
  <p class="sub" style="position:absolute;left:73px;top:322px;font-size:24px;width:560px">Notes on any page, right where you left them. Search, tags and favorites built in.</p>
  <div style="position:absolute;left:73px;top:430px;display:flex;gap:12px">
    <span class="chip" style="background:var(--hl-yellow)">Free</span><span class="chip">No account</span><span class="chip">Private</span>
  </div>
  <div class="browser" style="left:730px;top:78px;width:640px">{BROWSER}<img class="browser__page" src="raw/page.png" alt=""></div>
""")

page("tile-small", 440, 280, f"""
  <div class="block block--yellow" style="left:300px;top:-30px;width:180px;height:340px"></div>
  <div class="wordmark" style="position:absolute;left:28px;top:24px;font-size:20px">Docamatic</div>
  <h1 class="headline" style="position:absolute;left:26px;top:66px;font-size:40px;width:270px">Sticky notes for <span class="dm-swipe dm-swipe--blue">the web</span></h1>
  <div class="note-mock" style="left:262px;top:118px;width:150px">
    <article class="dm-note dm-note--pink" style="padding:10px;gap:4px;transform:rotate(-4deg);{LIFT}">
      <div class="dm-note__head"><h3 class="dm-note__title" style="font-size:14px">Don't forget</h3></div>
      <p class="dm-note__body" style="font-size:12px;line-height:16px">Back right where you left it.</p>
    </article>
  </div>
  <p class="sub" style="position:absolute;left:28px;top:216px;font-size:15px;width:230px">Any page. Found again in seconds.</p>
""")
print("wrote", len(list(HERE.glob("*.html"))), "pages")
