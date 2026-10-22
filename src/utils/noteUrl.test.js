import { legacyNoteUrl, noteUrlFor, noteUrlsFor, redactUrl } from "./noteUrl";

describe("YouTube", () => {
    test("Each video is its own page", () => {
        expect(noteUrlFor("https://www.youtube.com/watch?v=abc")).not.toBe(noteUrlFor("https://www.youtube.com/watch?v=xyz"));
    })

    test("Timestamps, playlists and tracking don't change the page", () => {
        expect(noteUrlFor("https://www.youtube.com/watch?v=abc&t=42s&list=PL1&index=3&si=x&utm_source=y"))
            .toBe("https://www.youtube.com/watch?v=abc");
    })

    test("Other YouTube pages use the generic rules", () => {
        expect(noteUrlFor("https://www.youtube.com/results?search_query=cats&sp=x")).toBe("https://www.youtube.com/results");
    })
})

describe("Query parameters", () => {
    test("Identifying parameters are kept, everything else dropped", () => {
        expect(noteUrlFor("https://news.ycombinator.com/item?id=123&utm_source=x")).toBe("https://news.ycombinator.com/item?id=123");
        expect(noteUrlFor("https://forum.example.com/viewtopic.php?f=2&t=99&sid=abc123")).toBe("https://forum.example.com/viewtopic.php?f=2&t=99");
        expect(noteUrlFor("https://www.google.com/search?q=sticky+notes&ei=abc&ved=xyz")).toBe("https://www.google.com/search?q=sticky+notes");
    })

    test("Product pages ignore the tracking added to every link", () => {
        expect(noteUrlFor("https://www.amazon.com/dp/B0TEST/ref=sr_1_1?crid=X&keywords=y&qid=1&sr=8-1&th=1"))
            .toBe("https://www.amazon.com/dp/B0TEST/ref=sr_1_1");
    })

    test("Parameter order doesn't matter", () => {
        expect(noteUrlFor("https://a.com/x?t=1&f=2")).toBe(noteUrlFor("https://a.com/x?f=2&t=1"));
    })

    test("Empty identifying parameters are dropped", () => {
        expect(noteUrlFor("https://a.com/search?q=")).toBe("https://a.com/search");
    })
})

describe("Fragments", () => {
    test("Route fragments are kept, so each screen of a #-routed app is its own page", () => {
        expect(noteUrlFor("https://app.example.com/#/inbox")).toBe("https://app.example.com/#/inbox");
        expect(noteUrlFor("https://app.example.com/#!/settings")).toBe("https://app.example.com/#!/settings");
        expect(noteUrlFor("https://app.example.com/#/inbox")).not.toBe(noteUrlFor("https://app.example.com/#/settings"));
    })

    test("In-page anchors are dropped", () => {
        expect(noteUrlFor("https://en.wikipedia.org/wiki/Cat#Behavior")).toBe("https://en.wikipedia.org/wiki/Cat");
    })
})

describe("Everything else", () => {
    test("Normal pages get the same key as before, so their notes are unaffected", () => {
        for (const href of [
            "https://github.com/hibroseph/sticky-notes/issues/12",
            "https://x.com/home?ref=1#top",
            "https://en.wikipedia.org/wiki/Cat#Behavior",
            "https://example.com/",
        ]) {
            expect(noteUrlFor(href)).toBe(legacyNoteUrl(href));
            expect(noteUrlsFor(href)[0]).toBe(legacyNoteUrl(href));
        }
    })

    test("Repeated slashes in the path are collapsed", () => {
        expect(noteUrlFor("https://a.com//b///c")).toBe("https://a.com/b/c");
    })

    test("The host is case-insensitive, the path isn't", () => {
        expect(noteUrlFor("https://Example.COM/Page")).toBe("https://example.com/Page");
    })

    test("Non-web urls fall back to the old rules", () => {
        expect(noteUrlFor("about:blank")).toBe("about:blank");
        expect(noteUrlFor("not a url")).toBe("not a url");
    })
})

describe("Looking up notes for a page", () => {
    test("Includes the old key when it differs, so existing notes still show", () => {
        expect(noteUrlsFor("https://www.youtube.com/watch?v=abc")).toEqual([
            "https://www.youtube.com/watch?v=abc",
            "https://www.youtube.com/watch",
            "https://www.youtube.com/watch/?v=abc",
            "https://www.youtube.com/watch/",
        ]);
    })

    test("A page's notes show with or without a slash at the end of its path", () => {
        expect(noteUrlsFor("https://a.com/blog/post")).toEqual(["https://a.com/blog/post", "https://a.com/blog/post/"]);
        expect(noteUrlsFor("https://a.com/blog/post/")).toEqual(["https://a.com/blog/post/", "https://a.com/blog/post"]);
        expect(noteUrlsFor("https://a.com/item?id=4")).toContain("https://a.com/item/?id=4");
        expect(noteUrlsFor("https://mail.a.com/app#/inbox")).toContain("https://mail.a.com/app/#/inbox");
        // New notes are still saved under the address as it is
        expect(noteUrlsFor("https://a.com/blog/post/")[0]).toBe(noteUrlFor("https://a.com/blog/post/"));
    })

    test("The site root and non-web addresses get no slash twin", () => {
        expect(noteUrlsFor("https://a.com/")).toEqual(["https://a.com/"]);
        expect(noteUrlsFor("about:blank")).toEqual(["about:blank"]);
    })

    test("Nothing for a missing url", () => {
        expect(noteUrlsFor(undefined)).toEqual([]);
    })
})

describe("The address a note was created on (redactUrl)", () => {
    test("Keeps everything that isn't a credential, including tracking and anchors", () => {
        expect(redactUrl("https://www.youtube.com/watch?v=abc&t=42s&utm_source=feed#comments"))
            .toBe("https://www.youtube.com/watch?v=abc&t=42s&utm_source=feed#comments");
    })

    test("Keeps the exact original encoding when nothing is removed", () => {
        expect(redactUrl("https://a.com/search?q=hello%20world&sort=new")).toBe("https://a.com/search?q=hello%20world&sort=new");
    })

    test("Removes password reset and verification tokens", () => {
        expect(redactUrl("https://app.com/reset?email=a@b.com&token=SECRET123")).toBe("https://app.com/reset?email=a%40b.com");
        expect(redactUrl("https://app.com/verify?verification_token=SECRET")).toBe("https://app.com/verify");
    })

    test("Removes OAuth codes and tokens, in the query or the fragment", () => {
        expect(redactUrl("https://app.com/callback?code=SECRET&state=SECRET2&next=/home")).toBe("https://app.com/callback?next=%2Fhome");
        expect(redactUrl("https://app.com/cb#access_token=SECRET&token_type=bearer&expires_in=3600")).toBe("https://app.com/cb#expires_in=3600");
        expect(redactUrl("https://app.com/#/callback?code=SECRET&tab=1")).toBe("https://app.com/#/callback?tab=1");
    })

    test("Removes signatures, keys and sessions", () => {
        const signed = redactUrl("https://bucket.s3.amazonaws.com/file.pdf?X-Amz-Signature=SECRET&X-Amz-Credential=SECRET&X-Amz-Expires=300");
        expect(signed).toBe("https://bucket.s3.amazonaws.com/file.pdf?X-Amz-Expires=300");
        expect(redactUrl("https://api.example.com/?api_key=SECRET&page=2")).toBe("https://api.example.com/?page=2");
        expect(redactUrl("https://old.example.com/page.php?PHPSESSID=SECRET&id=4")).toBe("https://old.example.com/page.php?id=4");
    })

    test("Removes a user name and password in the address", () => {
        expect(redactUrl("https://user:hunter2@intranet.example.com/wiki")).toBe("https://intranet.example.com/wiki");
    })

    test("Never contains anything that looked like a secret", () => {
        const result = redactUrl("https://a.com/x?token=S1&auth=S2&password=S3&secret=S4&sid=S5&key=S6#id_token=S7");
        expect(result).not.toMatch(/S[1-7]/);
    })

    test("Nothing for addresses that aren't web pages", () => {
        expect(redactUrl("about:blank")).toBeUndefined();
        expect(redactUrl("not a url")).toBeUndefined();
    })
})
