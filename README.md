# After Shift

A shift and tip tracker with passwordless email login, weekly/monthly goals, monthly and yearly summaries, earnings charts, hours worked, and shift notes. Records are stored in Supabase and protected with row-level security so each user can access only their own data.

## Run locally

Serve this folder with any static web server, then open it in a browser. Authentication redirects must be added to the Supabase project's allowed redirect URLs.

## Privacy

The frontend uses a Supabase publishable key, which is safe to include in browser code. Database row-level security is the authorization boundary; no service-role key or SMTP credentials belong in this repository.

## Authentication setup

Set the Supabase Site URL to `https://xaxaxzaazax.github.io/after-shift/` and add the same address to the redirect URL allow list.

Email magic-link authentication is enabled through Supabase Auth. Configure custom SMTP before opening registration to the public; Supabase's built-in email sender is intended only for testing and project team addresses.

## Account deletion

The authenticated `delete-account` Supabase Edge Function validates the current session and deletes only that user. Foreign-key cascades remove their shifts and goals. The service-role key remains server-side and is never exposed to the browser.

## Tip report scanner

The scanner sends an authenticated, resized report image to the `scan-tip-report` Supabase Edge Function. The function calls OpenAI and returns structured shift fields that the user reviews before saving. API keys never belong in `app.js` or any browser-accessible file.

After rotating any exposed OpenAI key, configure and deploy the function:

```sh
supabase secrets set OPENAI_API_KEY=your_replacement_key
supabase db push
supabase functions deploy scan-tip-report
```

`OPENAI_VISION_MODEL` is optional and defaults to `gpt-4.1-mini`. Authenticated accounts are limited to 20 scans per day to control API spending.
