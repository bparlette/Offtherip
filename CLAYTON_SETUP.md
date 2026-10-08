# Off The Rip — Clayton's Setup Guide

**Total cost: ~$12/year** (just the domain — everything else is free)

---

## Step 1: Create a GitHub account (free)

1. Go to **github.com**
2. Click **Sign up**
3. Enter your email, create a password, pick a username
4. Verify your email (check your inbox)
5. Done. **Cost: $0**

> Tell Cherie your GitHub username so she can add you to the repo.

---

## Step 2: Buy the domain (~$12/year)

**Domain to buy:** `offtheripcollectables.com`

**Cheapest option — Cloudflare Registrar** (sells at cost, no markup):

1. Go to **dash.cloudflare.com** and create a free account
2. Click **Domain Registration** → **Register Domains**
3. Search for `offtheripcollectables.com`
4. Add to cart and check out
5. **Cost: ~$10–13/year** (Cloudflare charges wholesale, renews at same price)

**Alternative — Namecheap** (if you prefer):
1. Go to **namecheap.com**
2. Search for `offtheripcollectables.com`
3. Add to cart, check out
4. **Cost: ~$13–15/year** (first year sometimes cheaper, renewals higher)

> ⚠️ Do NOT buy `offtheripollectables.com` (missing the "c") — that's only the eBay store URL, not the website domain.

---

## Step 3: Host on Cloudflare Pages (free)

1. In your Cloudflare dashboard, go to **Workers & Pages**
2. Click **Create** → **Pages** → **Upload assets**
3. Name the project `offtherip`
4. Drag in the website files (Cherie or Arlo will give you the zip)
5. Click **Deploy**
6. **Cost: $0** — Cloudflare Pages is free for static sites

### Connect your domain:

1. In the Pages project, go to **Custom domains**
2. Click **Set up a custom domain**
3. Enter `offtheripcollectables.com`
4. Cloudflare auto-configures the DNS (since you bought the domain there)
5. Also add `www.offtheripcollectables.com` — set it to redirect to the main domain
6. Wait 5–10 minutes. Done.

> If you bought the domain at Namecheap: change the nameservers to Cloudflare's (Cloudflare will show you the two nameservers to use). Then follow the same steps above.

---

## Step 4: Google Analytics (free)

1. Go to **analytics.google.com**
2. Sign in with a Google account (create one if needed)
3. Click **Start measuring** → **Create account**
4. Account name: `Off The Rip Collectables`
5. Property name: `offtheripcollectables.com`
6. Select **Web** platform, enter `https://offtheripcollectables.com`
7. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`)
8. **Cost: $0**

> Send the Measurement ID to Cherie/Arlo — it gets added to the site code and starts tracking visitors immediately.

---

## Step 5: Buttondown newsletter (free)

This powers the "Hit List" email signup on the website — visitors enter their email and you can send them updates about new drops, giveaways, etc.

1. Go to **buttondown.com**
2. Click **Sign up** — create an account
3. Go to **Settings** → **API**
4. Copy your **API key** (long string of letters/numbers)
5. **Cost: $0** — free up to 1,000 subscribers

> Send the API key to Cherie/Muse — it gets added to the site and the signup form starts collecting emails immediately. **Keep the API key private** — don't share it publicly.

---

## Cost Summary

| Item | Cost |
|------|------|
| GitHub account | $0 |
| Domain (offtheripcollectables.com) | ~$12/year |
| Cloudflare Pages hosting | $0 |
| Google Analytics | $0 |
| Buttondown newsletter | $0 |
| **Total** | **~$12/year** |

---

## What happens after setup

- The site moves from `bparlette.github.io/Offtherip/` → `offtheripcollectables.com`
- GitHub stays as the code backup
- Cloudflare handles hosting, SSL (https), and speed — all free
- Google Analytics shows you visitor stats

**Questions?** Ask Cherie — she has Arlo (AI assistant) who can walk through any step.
