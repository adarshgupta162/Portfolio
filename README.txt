ADARSH GUPTA — MULTI-PAGE PORTFOLIO

Pages
- index.html: portfolio homepage
- photography.html: visual diary with automatically generated category filters, carousel, photo grid and lightbox
- leetcode.html: LeetCode dashboard with username input and public community API stats

Photography folders
- photography/travel/
- photography/nature/
- photography/streetlife/

Add photos and automatic updates
1. Put images into a category folder. Supported formats: JPG, JPEG, PNG, WEBP, GIF, AVIF.
2. The filename becomes the title. Example: varanasi-ghat.jpg -> Varanasi Ghat.
3. Create any new folder inside photography/ to add a category. Folder names become category filters.
4. For a local preview, run `python scripts/build_photography.py` before opening the page.
5. The included GitHub Actions workflow regenerates the manifest and deploys the site whenever you push to main/master. Enable GitHub Pages with the source set to GitHub Actions in repository Settings > Pages.

The browser cannot list repository folders on its own, so the build script creates js/photography-manifest.js from the folder structure. The page uses sample remote photos until you add your own local photographs.

LeetCode API
The page calls https://alfa-leetcode-api.onrender.com/{username} and an optional calendar endpoint. This is a third-party community-maintained API, not an official LeetCode API. The provider may be unavailable, change response formats or apply rate limits.

Before publishing
- Add your own photographs to the photography folders.
- Add your resume PDF if needed.
- Verify portfolio links and project descriptions.
