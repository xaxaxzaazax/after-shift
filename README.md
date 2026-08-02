# After Shift

A shift and tip tracker with passwordless email login. Shift records are stored in Supabase and protected with row-level security so each user can access only their own data.

## Run locally

Serve this folder with any static web server, then open it in a browser. Authentication redirects must be added to the Supabase project's allowed redirect URLs.

## Privacy

The frontend uses a Supabase publishable key, which is safe to include in browser code. Database row-level security is the authorization boundary; no service-role key or SMTP credentials belong in this repository.

## Authentication setup

Set the Supabase Site URL to `https://xaxaxzaazax.github.io/after-shift/` and add the same address to the redirect URL allow list.

Email magic-link authentication is enabled through Supabase Auth. Configure custom SMTP before opening registration to the public; Supabase's built-in email sender is intended only for testing and project team addresses.
