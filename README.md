# Reddit Direct Link Userscript

A Tampermonkey userscript that enhances Reddit browsing by making post titles link directly to external content instead of the Reddit comments page.

## Features

- Automatically redirects post title and post box clicks to external links instead of Reddit comment sections
- Preserves Reddit media content (images, videos, galleries) behavior
- Works with dynamically loaded content (infinite scrolling)
- Maintains original functionality for Reddit-hosted media
- Click anywhere on the post to go to the external link (except for interactive elements like buttons)

## Prerequisites

- A web browser (Chrome, Firefox, Safari, etc.)
- [Tampermonkey](https://www.tampermonkey.net/) browser extension installed

## Installation

1. Make sure you have Tampermonkey installed in your browser
2. Click [here](reddit-url-change.js) to view the raw script
3. Copy the entire script content
4. Open Tampermonkey in your browser and click "Create a new script"
5. Paste the copied script content
6. Click File > Save or press Ctrl+S (Cmd+S on Mac)

## How It Works

The script:

- Detects posts on Reddit that contain external links
- Modifies the behavior of post titles and containers to link directly to external content
- Preserves the original behavior for Reddit-hosted media (images, videos, galleries)
- Uses a MutationObserver to handle dynamically loaded content
- Includes error handling and detailed console logging for troubleshooting

## Supported Reddit Media Domains (Preserved Behavior)

The following Reddit media domains will maintain their original behavior:

- i.redd.it
- v.redd.it
- preview.redd.it
- i.reddit.com
- reddit.com/gallery

## Contributing

Feel free to submit issues and enhancement requests!

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Author

[narrowstacks](https://github.com/narrowstacks/new-reddit-direct-url)

## Version

1.0
