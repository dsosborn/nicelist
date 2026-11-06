# Nicelist — Chrome Web Store Listing

## Short description

Add the product you are viewing to your Nicelist wishlist without spoiling surprises.

## Detailed description

Nicelist is a place to keep a Christmas wishlist and share one link with family and friends without learning who bought what.

When you click the Nicelist extension button on a product page:

- It reads only the active tab you opened it on (`activeTab`).
- It reads the product title, the full page address in your address bar (including variant parameters), the price on the page, and the selected size, color, or variant when one is chosen on the page.
- It puts the selected size, color, or variant into the gift note so you can edit it before saving. If it cannot tell which option is selected, it leaves the note blank.
- It never substitutes a canonical or parent-product URL, never uploads or stores a product image, and never adds an affiliate or partner tag when you save a gift.
- It signs in with the same Nicelist account as `https://nicelist.co` (email/password or Google) and shows the owner view only, so it cannot reveal who reserved or purchased a gift on your wishlist.

## Permissions justification

- `activeTab` and `scripting`: Read the product title, exact URL, price, and selected variant from the page you are currently viewing only when you click the extension action.
- `storage`: Keep your signed-in Nicelist session inside the extension.
- `identity`: Complete Google sign-in with your Nicelist account via `chrome.identity.launchWebAuthFlow`.
- Host permissions (`*.amazonaws.com`, `*.amazoncognito.com`): Authenticate with Amazon Cognito and call the Nicelist AppSync GraphQL API.
