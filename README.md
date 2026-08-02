# After Shift

A shift and tip tracker with Google login. Shift records are stored in Supabase and protected with row-level security so each user can access only their own data.

## Run locally

Serve this folder with any static web server, then open it in a browser. Authentication redirects must be added to the Supabase project's allowed redirect URLs.

## Privacy

The frontend uses a Supabase publishable key, which is safe to include in browser code. Database row-level security is the authorization boundary; no service-role key or OAuth client secret belongs in this repository.

## Authentication setup

Set the Supabase Site URL to `https://xaxaxzaazax.github.io/after-shift/` and add the same address to the redirect URL allow list.

Enable Google under Supabase Authentication providers. The provider client secret must be entered directly in the Supabase dashboard and must never be committed to Git. Apple login can be added later if an Apple Developer Program membership is available.
