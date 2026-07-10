# BharatPDF Vercel Deployment Path

This repository is the canonical source for the BharatPDF MVP application.

## Branch policy

- `main` is the deployment branch for stable releases.
- `feat/*` branches remain preview-only branches for engineering work.
- The currently verified publish revision is `5273f52` or newer.

## Runtime configuration

Current application behavior only requires the keys below:

| Key | Required | Purpose |
| --- | --- | --- |
| `APP_BASE_URL` | yes | Base URL used for runtime links and local defaults. |
| `UPLOAD_MAX_MB` | no | Upload size ceiling. Defaults to `25`. |
| `RETENTION_HOURS` | no | Local retention window. Defaults to `24`. |

Notes:

- `.env.example` still includes `OPENAI_API_KEY` and `OPENAI_MODEL`, but the current summary workflow does not require them.
- Do not commit runtime secrets. Set production values in Vercel project settings.

## Verification path

Run the smallest checks on the exact revision you plan to deploy:

```bash
npm install
npm run lint
npm run build
```

Expected result on the current MVP:

- `/` prerenders successfully
- `/api/workflows/summary` builds as a dynamic route

## Vercel project wiring

The smallest working path is:

1. Create or reuse the Vercel project `bharatpdf-ai`.
2. Link the local repository checkout with `vercel link --yes --project bharatpdf-ai`.
3. Set `APP_BASE_URL`, `UPLOAD_MAX_MB`, and `RETENTION_HOURS` in the Vercel project.
4. Deploy previews from the checked-out repo with `vercel`.
5. Promote the stable branch with `vercel deploy --prod` from a `main` checkout after verification.

If GitHub auto-deploy is later enabled, keep `main` as the production branch and `feat/*` as preview branches.

## Rollback path

- Git rollback: redeploy the previous known-good `main` commit.
- Vercel rollback: promote the prior production deployment in the Vercel dashboard or redeploy the prior commit from `main`.
- Config rollback: revert only the changed Vercel environment variables and redeploy the last known-good commit.

## Operational risk still open

The repo publish and Vercel project linkage can be completed from this workspace, but GitHub-to-Vercel automatic deploy triggers still require either:

- a Vercel Git integration connected to `Polkaverse/BharatPDF-AI`, or
- a GitHub Actions deployment workflow with Vercel credentials stored as repository secrets.

Until one of those is configured, production promotion is manual but reviewable.
