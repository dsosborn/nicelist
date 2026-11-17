# Safari web extension

The Chrome and Safari extensions share this folder. `src/content/readProduct.ts` and `src/popup/PopupApp.tsx` are the product reader and the popup. `manifest.json` is Manifest V3.

Build the extension, then wrap it for Xcode:

```sh
npm run build --workspace apps/extension
xcrun safari-web-extension-converter apps/extension/dist --macos-only false
```

This environment cannot submit the App Store wrapper. The iPhone share action is the wrapped extension plus the site share target at `/add`.
