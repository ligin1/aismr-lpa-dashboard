# AISMR LPA Explorer

A static public dashboard for exploring All India Summer Monsoon Rainfall departures from a user-selected Long Period Average. It needs no Python server after deployment and is suitable for GitHub Pages.

## Run locally

From this directory:

```bash
python -m http.server 8000
```

Open <http://localhost:8000>.

## Publish with GitHub Pages

1. Create an empty GitHub repository.
2. Make this dashboard directory the repository root and push it to the `main` branch.
3. In **Settings → Pages**, set **Source** to **GitHub Actions**.
4. The included `.github/workflows/pages.yml` workflow deploys the site automatically.
5. GitHub displays the public URL after the workflow completes.

The workflow assumes that this directory—not the larger `Kerala_Floods` directory—is the root of the GitHub repository.

## Data and calculation

- 1951–2023: IMD daily gridded rainfall, JJAS totals, cosine-latitude area-weighted spatial mean.
- 2024: 934.8 mm.
- 2025: 937.2 mm.
- 2026: 759.4 mm.
- The selected LPA is the arithmetic mean of annual AISMR values between the chosen years, inclusive.
