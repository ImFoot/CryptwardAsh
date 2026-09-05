# Publish Cryptward with GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. It automatically builds the game and deploys it whenever you push to `main`.

1. Create a GitHub repository named `CryptwardAsh` and push this folder to its `main` branch.
2. In the repository’s **Settings → Pages**, set **Source** to **GitHub Actions**.
3. Push a commit or run **Deploy Cryptward to GitHub Pages** from the Actions tab.

The game will be available at `https://YOUR-GITHUB-USERNAME.github.io/CryptwardAsh/` after the Pages workflow completes. The address is different only if you use a custom domain or rename the repository.

The deployment build uses the correct `/CryptwardAsh/` asset path. Normal local play is unchanged: use `Play Cryptward.cmd` or open `http://127.0.0.1:4173/`.
