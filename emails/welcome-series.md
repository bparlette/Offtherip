# Welcome series: drafts for Kit (ConvertKit)

Five emails over ten days. **Draft copy for Clayton to rewrite in his own voice and approve before sending** (HQ rule 10). Facts come from facts.json. Replace `[DOMAIN]`; add `?src=email` to every site link so the tracking can tell email clicks from other sources. Every email needs the unsubscribe link and the mailing address in the footer (Kit adds these from account settings).

**Segments:** the signup form sends an `interests` field (`sports`, `pokemon`, `onepiece-dbs`, `graded`; any combination, or empty). In Kit add one condition per value and use that segment's block where marked. Empty = use the "everything" block.

## Segment blocks

| interests contains | Their lane | One-line hook | Link |
|---|---|---|---|
| sports | Sports cards | Basketball, football and baseball rips, rookies, parallels and numbered hits. | [DOMAIN]/shop/?src=email (Sports tiles) |
| pokemon | Pokémon | Fresh Pokémon pulls, from sealed boxes to singles and slabs. | [DOMAIN]/shop/?src=email |
| onepiece-dbs | One Piece / Dragon Ball | One Piece and Dragon Ball Super packs and singles. | [DOMAIN]/shop/?src=email |
| graded | Graded slabs | PSA / BGS / SGC slabs from the shop. | [DOMAIN]/shop/?src=email |
| (empty) | Everything | Sports, TCG and graded: all pulled on camera. | [DOMAIN]/shop/?src=email |

## Email 1: day 0, right after confirming

**Subject:** You're in. Here's where to start
**Preview:** The scoreboard, the shop, and one question.

Hi {{ subscriber.first_name | default: "there" }},

Welcome to the Hit List. Once a week you'll get the biggest pulls, the Daily Pack Verdict scoreboard and the newest listings.

Three places to start:
1. **The scoreboard:** one pack a day, profit or loss → [DOMAIN]/verdict/?src=email
2. **The shop:** [lane-specific hook] → link
3. **The Want List:** tell me the card you're hunting → [DOMAIN]/want-list/?src=email

Hit reply and tell me: what's the one card you'd love to pull?

Clayton

## Email 2: day 2

**Subject:** The streak (and why I keep ripping)
**Preview:** Day by day, profit or loss.

Hi {{ subscriber.first_name | default: "there" }},

Every day I open one pack on camera and call it: profit or loss. [Insert the current scoreboard line, e.g. "Right now it's {N} losses in a row."]

The idea is simple: **is ripping it actually worth it?** If you've ever wondered whether a box is worth the money, this is for you.

→ See every verdict: [DOMAIN]/verdict/?src=email

Clayton

## Email 3: day 4, your lane

**Subject:** For the [lane] collectors
**Preview:** What's new in the store.

[Segment hook.]
[Three recent listings from the store with links.]
Not seeing what you want? → [DOMAIN]/want-list/?src=email

## Email 4: day 7, trust

**Subject:** How I run the shop
**Preview:** Where everything gets sold, and what to expect.

[Clayton to fill: how cards are packed and shipped, how fast, how he handles problems. Only say what's true.]
Everything is sold on eBay, with eBay's buyer protection. [Use the current eBay feedback % and items-sold count, with the 'as of' date.]

## Email 5: day 10, the ask

**Subject:** Two quick favors
**Preview:** Takes 30 seconds.

1. If you haven't yet, subscribe on YouTube so you don't miss the next Verdict → [YouTube link]
2. Reply with a card you're hunting and I'll add it to the Want List.

Thanks for being here.
Clayton

---

## Recurring: the weekly Hit List (template)

**Subject:** [One specific pull] + this week's Verdict
1. Biggest pull of the week (video link)
2. Verdict scoreboard line + link
3. Three new listings (eBay links)
4. Giveaway reminder or Want List nudge
Keep it under 200 words.

## Triggered: streak breaks

**Subject:** THE STREAK IS OVER 🎉
Send manually the first time a profit ends a losing streak. One paragraph, one link to that day's video.
