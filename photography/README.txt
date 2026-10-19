PHOTOGRAPHY FOLDER WORKFLOW

1. Create a category folder inside this folder, e.g. photography/architecture/
2. Put your images inside it. Supported: .jpg, .jpeg, .png, .webp, .gif, .avif
3. The filename becomes the photo title. Example: dashashwamedh-ghat-at-dusk.jpg -> Dashashwamedh Ghat At Dusk
4. Run: python scripts/build_photography.py
5. Deploy/push the updated site. If using the included GitHub Pages workflow, pushing to main or master rebuilds the gallery automatically.

Folder names become category filters. Use lowercase folder names and hyphens for multiword categories, e.g. street-life.
The browser cannot scan repository folders by itself; the manifest must be regenerated during the build/deploy step.
