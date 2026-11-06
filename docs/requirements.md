# Nicelist requirements

Nicelist is a place for people to keep Christmas wishlists and shop for each other without spoiling surprises. This list covers what the site already does, what has to be true for the Christmas 2026 soft launch, and what waits until after that trial.

The soft launch is one season and one list per person is enough. Each list is public, friends-only, or private. People become friends by accepting a request. There is no directory of every list on the site.

## 1. What the site is

The Christmas trial in section 2 is the product. A signed-in person lands on their wishlist at `/list`. A share link is `/list?t=`. The shopping list is `/shopping`, friends are `/friends`, and the privacy note is `/privacy`.

Accounts are Cognito email/password with SRP, plus Google. The browser is a static Next.js export talking to AppSync. Owner, shopper, and guest responses are different shapes. The guest read is the only API-key field. Lists, gifts, claims, pokes, profiles, relationships, the shopping list, and ratings are on-demand DynamoDB tables. Gift ideas go through one Lambda to Bedrock. Ordinary reads and writes stay in AppSync JavaScript resolvers. A Chrome extension in this monorepo adds the product on the page the owner is already viewing when Nicelist is closed.

## 2. Soft launch

A person can sign up, write a wishlist, send one link, and let those people shop it without learning who got what. Everything in this section is in scope for the Christmas trial.

### Lists

- A person has wishlists they own. One list is enough for the trial, and creating more than one stays allowed.
- After sign-in, the owner lands on their list. A dashboard is not the home. If they have more than one list, they can switch lists from that page.
- A list has a name the owner can set and later edit. The list page shows that name.
- New lists default to **public**, so the link they text to the family works. The owner can change visibility later. The control is three sentences: “Anyone with the link can shop this,” “Only friends can open this,” and “Only me.”
- On the adult’s own list, the page always shows the promise: people can mark gifts as taken, and they will not see that until they reveal the list.
- A list shows its items in the order they were added. Reordering can wait.
- The owner can delete a list. That delete also removes every item, reservation, and poke on it, and the mutation returns the deleted list.
- An empty list offers a product link, a custom gift, an experience, or a membership.

### Items

- A gift is a product, a custom wish, an experience, or a membership. The completed checkbox goes away.
- The primary add action is pasting a product URL. Title, price, notes, and quantity sit under more details. Quantity defaults to 1 and stays hidden until the owner changes it.
- A product with no title still saves. The list shows the link until the owner adds a name.
- A custom gift is a title with no store link, plus optional notes and price. It is claimed the same way as a product. There is no buy button and no way to send money in the trial. One is a wish with no counter, such as “a trip to Thailand.” Another is a thing to buy in person, such as “the navy sweater at the shop on Oak.” The note tells the shopper how to find it: which shop, which sweater, and the size. Nicelist does not store an address, hours, or whether it is still on the shelf.
- An experience is a thing to do, such as theater tickets or a White Sox game. It is claimed the same way as a custom gift. Nicelist does not take a showtime, a seat, or a payment.
- A membership is a pass or a package, such as a zoo or museum membership, a Blackhawks 5-game package, or a MasterClass membership. It is claimed the same way as an experience. Nicelist does not start the membership, pick the games, or create the account.
- Notes are shopping instructions (“size 10, the blue one”). Shoppers see them. A note hidden from shoppers waits until after the trial.
- A pasted product URL is stored and opened exactly, including the query string. Nicelist does not replace it with the page’s canonical URL. Size and color stay in the note for the trial. The app does not guess a variant by fetching the page.
- Any shop’s link is a product. Nicelist does not require Amazon, a partner, or a host it already knows. A page on a local clothing shop’s site and an Amazon product page are the same kind of gift. **Buy** opens whichever page was pasted. The list does not label a store as small, local, or national, and it does not sort one above another. The partner tag is added only when that link is already an Amazon product link. The API still enforces the link’s length limit. It does not reject a link because of its host.
- The owner can edit a gift and delete it. Deleting it also removes its reservation, and the mutation returns the deleted gift.
- Title, link, notes, and price have server-side length limits. The API rejects an empty custom title, a product with no link, and a quantity below 1. A product is the gift that has a link. A title with no link is a custom gift, including the sweater at a shop counter. An experience or a membership needs a title. It does not need a link, a price, or a date.

An experience stores a timing phrase and nothing finer. The phrases are **Anytime**, **This season**, **Next season**, and **We’ll pick a date later**. The White Sox in winter are **Next season**. Tickets to a play, with no night chosen, are **We’ll pick a date later**. The phrase is the whole schedule. There is no calendar, no performance, and no seat map.

One experience is one gift. “Two tickets” stays in the title or the note, so a pair is not split into two claims. A link is optional. If the owner pastes one, it is stored exactly, and it is a general page such as the team’s tickets site, not a performance Nicelist has checked. **Buy** opens that page when a link exists. With no link, the shopper gets the same “Did you buy it?” question and no store tab. Marking it purchased means the shopper has taken care of it, including buying a gift card now or buying tickets when they go on sale. The claim does not expire on a holiday or an opening day. Reveal does not wait for the event.

A private planned gift on a shopping list can be an experience with the same phrases. A gift idea can be an experience: a title, a price inside the band, and a timing phrase. It still has no store link until someone adds one.

A membership stores one phrase: **Annual**, **Season package**, or **Digital**. A zoo or museum membership is **Annual**. A Blackhawks 5-game package is **Season package**, and it is one gift. The five games stay in the package the team sells. MasterClass is **Digital**. A single game, with no package, stays an experience.

There is no start date, no renewal, and no list of games or visits. “Family” or “individual” stays in the title or the note, so a family pass is not split into a claim per person. A link is optional and is stored exactly. It is the page that sells the membership, not an account Nicelist has opened. A partner tag is added only when that link is already an Amazon product link. **Buy** opens the page when a link exists. With no link, the shopper gets **Did you buy it?** and no store tab. Marking it purchased means the shopper bought the membership or package. The claim does not expire because the membership starts later. Reveal does not wait for the first visit or the first game.

Nicelist does not send the recipient’s email to the membership site, and it does not store a membership number, a redemption code, or a login. A gift checkout on that site can email the recipient and spoil the surprise. The shopper keeps the confirmation.

A private planned gift or a gift idea can be a membership, with one of those phrases and no store link until someone adds one.

### Family

One login is the adult’s master account. That adult has their own lists, and they can add children. A child is a name on the adult’s account, not a second login. The trial does not collect a child’s email, password, or birthdate.

The adult and the child are different people to everyone else. Friends, and anyone with a link, see the child listed with the adult and can open the child’s list. Children are not in a public directory of people.

| List | Who must not see claims | Who sees claims and can edit |
| --- | --- | --- |
| The adult’s own list | That adult, until they reveal it | Shoppers only |
| A child’s list | The child | The managing adults, and shoppers |

- Adding a child creates a list for them. The adult can add, edit, and delete gifts on it.
- The adult’s normal view of a child’s list shows what is reserved and purchased, and who claimed it. That is how two parents and the grandparents avoid buying the same gift. The adult can also claim a gift on the child’s list.
- The adult can switch that list to the view the child would see, with claims hidden, for when the child is looking at the screen. That view is local. It does not change what the API returns to a shopper, and it is not the view the adult lands on.
- Another adult can be invited as a co-manager of a child. A co-manager can edit that child’s list and see claims. They are not the recipient. Removing a co-manager takes that access away.
- A child’s friends-only list uses the managing adults’ accepted friends, because the child has no friend list of their own.
- Removing a child removes that child’s lists, gifts, reservations, and pokes.

### Friends

- A signed-in person can send a friend request to another account by email.
- The recipient sees incoming requests and can accept or decline. The sender sees pending requests and can cancel one.
- Friendship is mutual and starts only when the request is accepted. A person is not their own friend. A second request to someone who is already a friend, or who already has a pending request either way, is rejected.
- Either friend can remove the friendship. Removal takes effect on the next visit: friends-only lists on both sides disappear for the other person, and open pokes between them are removed.
- Friends are listed with their display names. Requests wait in the app. Email when a request arrives waits until after the trial.
- Declining, canceling, and removing do not notify the other person with a reason.

### Who can see a list

The owner can always see and edit their own list. A shopper is anyone else allowed to view it. The share control copies a link and states who that link will let in. The link carries a rotatable share token, separate from the list id. Replacing the token invalidates links already sent. Making the list private stops the current token from opening it.

| Visibility | Who can view | Who can reserve |
| --- | --- | --- |
| Private | The owner | Nobody else |
| Friends-only | The owner and accepted friends, after sign-in | Those friends |
| Public | Anyone with the link, including someone who is signed out | Any signed-in person |

- A public link shows the gifts before an account exists: title or link, price, notes, and whether each quantity is open, reserved, or purchased. That guest view has no shopper names. Sign-in starts when they tap **I’ll get this**, and Google or email sign-in returns them to that gift.
- A signed-out visitor who opens a friends-only or private link is sent to sign in and then back. If they still are not allowed, the response is the same not-found as a missing list.
- A signed-in shopper sees who reserved or purchased each gift, the shopping notes, and the price. They cannot rename the list, change its visibility, edit gifts, or delete gifts.
- A friend sees a friend’s friends-only and public lists, separate from lists they own. They do not see that friend’s private lists.
- Changing a list from friends-only or public to private hides it from everyone except the owner. Existing reservations stay stored. Those shoppers can release a reservation again only if the list becomes visible to them.

### Reservations, purchases, and reveal

While a list is open, the owner sees the wishlist they wrote: title, link, notes, price, and quantity. The owner API omits reserved, purchased, shopper name, shopper notes, open-counts, and click activity. Hiding those fields in the browser is not enough. The owner API does include open pokes on that list: the friend’s display name and the band. A poke is not a claim.

Signed-in shoppers see:

| State | What they see | What they do |
| --- | --- | --- |
| Open | Available | **I’ll get this** |
| Reserved | Taken, and who is getting it | That person can buy it, or release it |
| Purchased | Bought, and who got it | That person can undo it before reveal |

What stops a second purchase is the taken state, not the name. **I’ll get this** marks that quantity reserved before anyone leaves for the store, and other shoppers see it as taken. The name tells them who claimed it. A shopper who never marks it purchased still holds it as reserved, so it does not look available.

- The screen uses those words. It does not ask anyone to manage a reservation.
- **I’ll get this** on a product then offers **Buy**. **Buy** opens the store in a new tab. The Nicelist tab stays where it is and opens a dialog: **Did you buy it?** The dialog stays until they answer. Yes marks it purchased. Not yet leaves it reserved. A custom gift, and an experience or membership with no link, have the same question and no store tab. An experience or membership with a link opens that page and asks the same question.
- Buying it in person uses those same marks. **I’ll get this** reserves the sweater before the shopper leaves, so it does not stay available while they walk. With no link, **Did you buy it?** is the whole step. **Not yet**, or dismissing the dialog, keeps it reserved for the walk and while they are in the shop. **Yes** marks it purchased, including paying at the counter. They can answer from the phone in the shop, or later. Until they do, it stays reserved. If the owner pasted a page, **Buy** opens it, and the shopper can still answer **Yes** without using **Buy**. Opening the page is not the purchase, and an online checkout is not required.
- If they dismiss the dialog, the gift stays reserved and the question remains on that gift until they answer it.
- The dialog can take one line for other shoppers, such as “getting the blue one.” The owner never receives that line.
- Only the person who claimed a quantity can mark it purchased, undo that, or release it.
- A shopper page leads with how many gifts are still open, and lists those first. The owner never sees that count. When quantity is more than 1, shoppers see how many of that gift are still open.
- Two people cannot reserve the last available quantity. The second attempt fails with a clear “already taken” message, enforced by a condition on the write.
- Each quantity is its own claim. Reserving updates that claim only while its status is still open. The same shopper repeating the action gets the claim they already hold. Before reveal, the resolver for the adult’s own list does not read claims.
- Status is written in words, not conveyed by color alone. The list is one column on a phone.
- Buying through an approved channel can also mark that reservation purchased. A click is not a purchase. The mark happens after the channel reports a qualifying purchase for that reservation’s click id. A reported return clears the purchased mark only when the channel set it and the shopper has not confirmed it by hand.
- The first season must work with the manual mark alone. Automatic marks turn on per channel once that channel’s report or postback can name the click. Amazon Associates has no checkout webhook. Its reports are delayed, subtag-level reporting is not guaranteed, and a reported order can later be reversed.
- Reservations and purchase marks are stored. They survive refresh and a second device.
- The owner can still edit or delete a gift while the list is open. Blocking that edit would tell them someone had claimed it. Deleting a gift removes its reservations.
- The owner can reveal a list when they want the surprise over. Reveal is a deliberate action, not a date at midnight. The first screen is a summary such as “7 of 11 were purchased,” with no names. After that, the owner sees each quantity as purchased or still open, still without the shopper’s name. New reservations stop. Shoppers can still see who purchased what.
- Showing the buyer’s name to the owner, for thank-you notes, waits until after the trial.

### Shopping list

People call this a shopping list. For this season the familiar name is a Christmas shopping list. The trial uses those words. It is the shopper’s own plan of what they are buying for everybody, not a second wishlist, and not a name draw.

One shopping list is enough. It is created with the name **Christmas 2026**, and the shopper can rename it. The signed-in header includes **Shopping list**. A second occasion waits until after the trial.

- The shopper adds people they are buying for. A person can be a friend, a child they manage, or a name with no account, such as “Grandpa.” A name with no account is its own row, so a later year can bring back the same person.
- Each person has a private standing note, such as a size, a color to avoid, or where to ship. The note belongs to the shopper and that person. It is not tied to one Christmas, and it is not a gift note.
- For someone whose lists they can already open, the shopping list shows those gifts and uses the same **I’ll get this**, purchased, and release actions as the list page. A private list stays hidden, including whether it exists.
- The shopper can add a planned gift for someone that is not on that person’s wishlist: a title, an optional link, notes, and price. That gift is private to this shopper. It never appears on the recipient’s wishlist, to other shoppers, or in a guest view. After reveal, a purchased one can show up when the recipient rates what they received. That view has no giver’s name.
- Gifts this shopper has reserved or purchased on a person’s list show under that person. Another shopper’s claims do not.
- A gift already reserved or purchased on someone’s wishlist uses those words under that person’s name. A private planned gift is still to buy until the shopper marks it purchased. Marking a linked gift purchased marks that claim. Marking a private planned gift purchased stays on the shopping list.
- On a gift this shopper bought, they can mark **again next year**. That mark is private to the shopper. It is not stored on the wishlist gift or the claim.
- Prices the shopper can see add up to a total for the list. There is no budget to set.
- The recipient never sees this page. Hiding it in the browser is not enough. Their API responses do not include it.
- Removing a person drops the private planned gifts for them. Claims on their wishlist stay as they are.
- Deleting the shopping list removes the people and the private planned gifts. It does not release claims, and it does not delete anyone’s wishlist.

### Gift ideas

A list can be thin in one price band. The bands are under $25, $25 to $75, and over $75. A band is thin when fewer than three gifts have a price in it. Gifts with no price do not fill a band. When the under-$25 band is thin, the editor sees a prompt that a few cheaper ideas are available. The model is not called just to show that prompt. It runs when the person asks for ideas, for that band or for one of the others.

The request goes through AppSync to a Lambda function, which calls a small on-demand Bedrock model in `us-east-1`. The function has no VPC. Each ask is one short request and returns a few ideas, and each account has a small daily cap. Each idea is a title, a price inside the band, and one line on why it fits. Ideas do not include a store link or a partner tag. A failed request or a reached cap leaves the list unchanged.

What the model receives is only what that person is already allowed to use for this purpose: gift titles, notes, and prices, plus the band. For a person on a shopping list it may also receive that person’s display name and the shopper’s standing note. It does not receive email addresses, claims, shopper names, shopper notes, or click ids. Idea text is not written to logs. The trial does not ask a quiz or keep a taste profile.

Nothing is saved until the person accepts an idea.

- On a list they edit, including a child’s list, accepting an idea adds it. A thing to own is a custom gift with that title and price. An experience keeps its timing phrase. A membership keeps **Annual**, **Season package**, or **Digital**. The child-safe view does not offer ideas or show pokes.
- On a shopping list, accepting an idea adds a private planned gift for that person. It is not written onto their wishlist.
- A guest cannot ask for ideas. A shopper on someone else’s list cannot ask for ideas there.

A friend looking at that list can poke them to add more gifts in one price band. The bands are the same three. The poke is offered when that band is thin: fewer than three gifts have a price in it. That covers a list with too few ideas, and a list with nothing in the range they want to spend. Gifts with no price do not fill a band. The friend chooses the band. The button reads **Poke for more ideas under $25**, **Poke for more ideas from $25 to $75**, or **Poke for more ideas over $75**. A band that already has three priced gifts has no poke.

The sender is a signed-in accepted friend of the adult who owns the list. On a child’s list, that is an accepted friend of a managing adult. A person who edits the list does not poke it. Someone who can open a public list and is not a friend does not get the button. A guest does not. A private list is not visible, so it cannot be poked. A name with no account cannot be poked.

One open poke per friend, per list, per band. Poking again returns that poke. The poke does not call the model, does not add a gift, and does not reserve one.

The people who edit the list see each open poke on that list. The line is **Sam poked you for more ideas under $25**, using the friend’s display name and the band they chose. It sits with the idea prompt for that band. They can ask for ideas in that band, add a gift themselves, or dismiss that poke. **Dismiss** clears it. Dismissing does not tell the sender why, and it does not use an alert dialog. On a child’s list every managing adult sees the same pokes, and a dismiss clears that poke for all of them. The child-safe view hides pokes. That hide is local, the same way claim details are hidden there.

The sender sees only their own poke, as **You poked Sam for more ideas under $25**, until it is dismissed or the band is no longer thin. They do not see anyone else’s poke, and they do not learn whether the editors asked for ideas. When the band has three priced gifts, open pokes for that band are finished. The sender is not notified. The new gifts are on the list the next time they open it. A later gap needs a new poke.

A poke is not a claim. Editors learn that this friend wants more gifts in that band. They do not learn what is reserved or purchased. Other shoppers do not see it. The guest response omits pokes. The shopper response includes only that caller’s own open pokes on the list. The editor response includes every open poke, and those fields are not claim fields. The pre-reveal filter does not strip them. Ending the friendship removes the open pokes between those people. Deleting the list or the child removes the pokes on those lists.

The same action is on the shopping list, under each list the shopper can already open for that person. It is the same poke, not a second one. The poke waits in the app. Nicelist does not email it.

A recipient rates a gift after they have it, from 1 to 5 stars. The stars are how that gift was. They are not a vote on a suggestion before anyone buys it.

They can rate only after their list is revealed, and only a gift Nicelist recorded as purchased for them. That includes one that started on their list, and a Nicelist suggestion that did not, such as Blackhawks tickets someone bought for them. The stars can wait until they have used it. Next season is fine. Nothing asks them to rate before reveal.

The first reveal screen stays the summary of the list they wrote. A gift that was not on that list is not in that summary. When they choose to rate what they received, a purchased suggestion shows as the gift alone, with no giver’s name. The giver does not see the stars from their recipient.

One rating per received gift, and they can change it. The server keeps whose gift it was so someone else cannot rate it. That record is not part of what other people receive, and it is not written to logs. Until many people who received that kind of gift have rated it, a later suggestion shows no score. After that, other people may see an anonymous line such as “People who received this rated it 5 stars.” The line has no names and no count small enough to point to one person or one household. The trial does not ask age or gender, and it does not describe a group of people. The child-safe view does not rate. A rating on a child’s list is not filed under an adult’s demographics.

### Partner links

A shopper’s product link can carry a partner tag so a purchase on that merchant credits Nicelist. The fee is separate from the purchased mark. The claim id is the click id a later report matches. The owner’s own link stays a normal product URL. Buying through one’s own partner link breaks the usual program rules, and the owner should not generate click activity on their list.

- For the trial, Amazon product links that shoppers open carry the Associates tag, once an Associates account exists. The list discloses that Nicelist may earn a commission.
- A link that is not an Amazon product page is still a product link. A local shop is included. It is not rejected, and it is not placed below Amazon. Nicelist earns nothing on it in the trial. The trial does not look up the merchant or decide that the shop is small or nearby.
- Amazon product links are product detail pages. Amazon pays commission on a direct purchase of the linked product. The stored URL stays clean, including its variant parameters. Shopper and guest responses append the Associates tag, and the claim id as `ascsubtag`, when they build the Buy link. The owner response never includes the tag.
- The fee stays with Nicelist. Amazon’s Associates rules forbid offering money, rebates, points, donations, or any other reward for using those links, including a rewards or loyalty program.

### Interface

Composite controls use Radix primitives. Visual design stays in StyleX. Radix Themes is not used. The `radix-ui` package is the dependency, and a screen imports only the primitives it renders. Primitives run in the browser, so the static export does not need a server for them.

A button, a link, or a text field stays a native element. Radix is for a control that manages focus, a layer, or a set of choices:

- **Did you buy it?** is a dialog. It takes focus when it opens, keeps focus inside while it is open, and returns focus when it closes. Escape or a tap outside dismisses it: the gift stays reserved, and the question remains on that gift.
- Delete list, delete gift, reveal, delete shopping list, and ending a friendship or a co-management each confirm in an alert dialog. The dialog names the action and what it removes. Focus starts on the action that keeps the thing.
- Visibility, an experience’s timing phrase, and a membership’s phrase are a radio group. Every option shows its sentence. Selection is a word, and color may repeat it.
- More than one list uses a menu to switch. **More details** on a new gift is a disclosure. Both open, close, and move by keyboard the same way they do by tap.
- A layer that covers the page traps focus and leaves the page underneath inert. On a phone the layer fits the viewport, and scrolling happens inside the layer.

The same pages work with a pointer, a touchscreen, a keyboard, and a screen reader, on a phone and on a desktop. The bar is WCAG 2.2 Level AA.

- The list is one column on a phone. What the person needs is on that column, with no horizontal scroll.
- Status is written in words. Color may repeat the word.
- Every control has a visible name, or a name a screen reader reads. An error is text tied to its field.
- Focus is visible, and tab order follows the page.
- At 200% zoom the list still reads in one column.
- A control is at least 24 by 24 CSS pixels. A primary action is large enough to tap without hitting its neighbor.
- Motion follows the system reduced-motion setting. Light and dark follow the system color scheme, and both meet the contrast bar.
- The page is English and declares that language.

Contrast, names, zoom, and the one-column layout are part of the styles and the copy. A primitive is the behavior underneath those.

### Accounts for the trial

- Email/password sign-up, email confirmation, sign-in, Google sign-in, forgot password, and sign-out keep working on `https://nicelist.co`.
- Cognito callback and logout URLs include `https://nicelist.co/login` as well as `http://localhost:3000/login`.
- The pool uses the Cognito Lite feature plan. Plus stays off. Google stays the built-in Google provider.
- Verification and password-reset mail goes through SES before anyone in the trial group is invited. The from-address is a verified identity on `nicelist.co` in `us-east-1`, and SES production access is requested before those invites. The message names Nicelist. A custom sender Lambda can wait.
- The confirm screen can resend a verification code.
- Email lookup is case-insensitive. The display-name attribute, and the app client’s permission to read and write it, are added before real people sign up.
- Each account has a display name, taken from Google’s name when present and editable afterward. The name is stored on a profile row. Shopper views read that row. Shoppers are shown by that name, not by a user id.
- A person who signs in from a list link, including with Google, returns to that list. Sign-in does not drop them on a dashboard.
- Password sign-in uses Amplify’s SRP flow. The app client leaves `USER_PASSWORD_AUTH` off.

### Hosting and release

The trial stays on the current serverless stack: a static Next.js export, Cognito, AppSync, and on-demand DynamoDB in `us-east-1`. Amplify stays a browser client. Ordinary reads and writes stay in AppSync JavaScript resolvers.

- The static export is served from a private S3 bucket through CloudFront, over HTTPS, at `https://nicelist.co`. ACM provides the certificate for that name. Route 53 hosts the `nicelist.co` zone. A CloudFront Function rewrites extensionless paths such as `/login` to the exported file. Share links use that origin.
- Direct loads work for `/`, `/login`, `/signup`, `/confirm`, `/forgot-password`, and the list page, including a public list opened while signed out.
- Share links work as a token on a page that exists in the export, so S3 does not 404 unknown dynamic paths.
- Production build receives the public Cognito and AppSync values, including the AppSync API key used only for the guest read. It also receives the public Google Tag Manager container id. Secrets stay out of the client bundle. Google’s client secret lives in SSM Parameter Store. Terraform reads it. It is not committed in tfvars. The GA4 measurement id stays in the Tag Manager container.
- The app source, including the frontend and the Chrome extension, is in the monorepo and pushed to a remote.
- `schema.graphql` is checked in and applied to the AppSync API, with generated client types. Resolvers are AppSync JavaScript. Unit tests cover the owner payload before reveal, the owner payload after reveal, the shopper and managing-adult payload, and a second reserve of the last quantity. They also cover open pokes on the editor payload, the caller’s own poke on the shopper payload, and no pokes on the guest payload.
- Terraform state is in an encrypted, versioned S3 backend with a DynamoDB lock. The AWS profile is not hardcoded. A second workspace holds a dev stack, so the Christmas tables are not the only place changes are applied.
- Tables are on-demand, with point-in-time recovery. The user pool and tables have deletion protection. The AppSync role has no DynamoDB `Scan` permission.
- AppSync logs resolver errors, with a short CloudWatch retention, so a failed reservation can be diagnosed. Full request and response logging stays off.
- GitHub Actions with AWS OIDC typechecks, lints, runs the Vitest, Playwright component, and Playwright integration tiers, and plans Terraform on pull requests. It publishes the static export and applies infrastructure. After that deploy, the Playwright smoke tier runs against the deployed environment. Deploy does not depend on one laptop or a long-lived access key.
- The stack stays out of a VPC. There is no NAT Gateway, no database server, and no second API.

### Testing

The app has four test tiers. A check sits in the lowest tier that can prove it. The resolver unit tests named above stay in Node and keep covering the payload matrix. Vitest does not reimplement that matrix.

- Vitest and React Testing Library cover unit tests. They render a component or call a function in jsdom. They cover validation, the words on a control, and how the client shapes a request. They do not open a browser, and they do not call Cognito, AppSync, Google, SES, or Bedrock.
- Playwright component tests mount one composite in a real browser. They cover focus, keyboard, and layers: **Did you buy it?**, the alert dialogs, the radio groups for visibility and for an experience or membership phrase, the list menu, and **More details**. They do not sign anyone in or walk from page to page.
- Playwright integration tests run in GitHub Actions on every pull request. They drive the trial journeys end to end with fixtures standing in for the other vendors: Cognito, Google, AppSync, SES, Bedrock, and the store a **Buy** link would open. A person can sign up, write a list, open a share link, shop as a guest and as a signed-in friend, reveal, and use the shopping list, without a live AWS account or a real merchant. The screen follows the same hiding rules as the API. Before reveal the owner does not see who claimed a gift, and a guest does not see a shopper’s name.
- Playwright smoke tests run against the deployed environment after a release. They open `/`, `/login`, `/signup`, `/confirm`, `/forgot-password`, `/privacy`, and a public list while signed out. Sign-in from a list link returns to that list. The run uses real CloudFront, Cognito, and AppSync. It stays a short check of that deploy. It does not build a season of wishlists, and it does not replace the integration suite.

### Analytics

The static export loads Google Tag Manager. GA4 is a tag inside that container. The page does not also load a gtag.js snippet. The container id is a public build value. A missing id leaves the page working and sends nothing.

The container loads after the first paint. A public list still shows its gifts without waiting on Google. The container is not an ad slot. The trial still has no ads and no sponsored products.

The app pushes a data layer event for a page view and for the trial actions: sign-up, sign-in, creating a list, adding a gift, copying a share link, reserving a gift, marking it purchased, revealing a list, and opening the shopping list. An event names the action. It does not include an email address, a display name, a gift title, a note, a price, a share token, a list id, a claim id, or a shopper name. The page address sent with the event has the share token removed. A child is not reported as a separate person. Nothing in the event says who reserved or bought a gift.

Local development, Vitest, Playwright component tests, and Playwright integration tests do not load the real container. A fixture stands in for Tag Manager the same way a fixture stands in for the other vendors. The smoke run against the deployed site may load the real container.

### Data rules that stay true

- Who can read items or create a reservation follows the list’s visibility. A public list can be read without an account and returns the guest shape only: gifts, shopping notes, and open, reserved, or purchased, with no names. Reserving requires a signed-in caller. Friends-only and private reads still require a user token. Item access does not follow “who created this row.”
- A caller who is not allowed to see a list cannot read it or reserve on it. The response does not reveal whether that list exists.
- Owner and shopper responses are different shapes. Before reveal, the adult’s own-list payload has no reservation, purchase, shopper, shopper-note, open-count, or click fields. After reveal it includes purchased quantities and still omits shopper identity. A managing adult’s payload for a child’s list includes the same claim fields a shopper sees. The signed-in shopper payload includes shopping notes and shopper names. People who edit a list receive every open poke on it: display name and band. A shopper payload includes only that caller’s own open pokes. A guest payload includes none. Poke fields are not claim fields, and the pre-reveal owner filter does not strip them.
- The API rejects oversized fields instead of storing them.

### Trial data and API

Cognito user pools are the default auth mode. An API key is a second mode, allowed only on the public guest read. That field has its own guest type. Mutations and every other read require a user token. The key expires and is renewed.

Tables stay on-demand.

- **Profiles.** User id, display name, and lowercased email. An email index resolves friend requests.
- **Relationships.** One item per direction for friends, incoming requests, outgoing requests, children, and co-managers. Accepting a friend or adding a co-manager writes both sides in one transaction. “Are we friends?” and “which children do I manage?” are a get or a query.
- **Lists.** The owner is the adult’s Cognito id. The recipient is that adult or a child. Visibility, name, `revealedAt`, and a rotatable share token. The token is indexed separately from the list id.
- **Gifts.** Partition key is the list id. Sort key is created-at plus the gift id, so the list is in add order. Kind is product, custom, experience, or membership. Title, clean product URL, price, notes, and quantity. An experience has one timing phrase. A membership has one membership phrase. No claim fields. No showtime, start date, game list, or account.
- **Claims.** One item per quantity slot. Status is open, reserved, or purchased, plus the shopper id, the shopper note, and the claim id used as the click id. The owner’s pre-reveal path does not read this table. After reveal it may read status only.
- **Pokes.** One open item per sender, list, and price band. Sender id, list id, band, and when it was sent. Editors of the list can read all of them. A shopper read returns only that caller’s own. A guest read returns none. Ending the friendship deletes the open pokes between those two people. Deleting a list or a child deletes the pokes on those lists. Dismissing a poke, or the band reaching three priced gifts, removes it. A poke is not a claim.
- **Shopping list.** One per shopper for the trial. Name, and the people on it. A person is a profile or child the shopper can already see, or a stable name-only row. A standing note is per shopper and person, not per year. Private planned gifts belong to the shopper and the person. A reserved wishlist gift is shown from the claim. It is not copied into a second reservation. **Again next year** is a shopper-only mark on a gift they bought.

Deleting a list, a gift, or a child deletes the dependent gifts and claims in that same mutation. Deleting a list or a child also deletes pokes on those lists.

### Assistant tools (WebMCP)

A signed-in Nicelist tab registers tools with `document.modelContext.registerTool` so a browser agent can do what that person can already do on the page. Nicelist does not embed its own assistant. Browsers without `document.modelContext` keep working. The tools call the same client functions as the buttons, and the API still enforces who can see what. Adding a gift this way is not a partner click and does not reserve it.

Owner and friend tools register on any signed-in page, including a background tab, so an agent can add a gift while the person is looking at a store. They work only while Nicelist is open and signed in. A product page with Nicelist closed uses the Chrome extension, which is part of the trial. Shopper tools register only on a list that person is allowed to shop. Every registration is aborted when the person signs out, leaves the page, or switches view. The child-safe local view registers no claim fields. Nothing is exposed to another origin.

Deletes, reveal, deleting the shopping list, ending a friendship or a co-management, and poking a friend for ideas are marked consequential. Reads are marked read-only. Dismissing a poke is not. A tool returns a structured error the agent can read. It does not throw for a mistake the agent can fix, such as a missing list or a quantity that is already taken.

The owner tools, for lists that adult manages:

- List their lists and their children’s lists: name, whose list it is, and visibility. No claim fields.
- Read a list they manage. Before reveal, the adult’s own list returns title, link, notes, price, and quantity. After reveal it may add which quantities were purchased, still without a shopper name. A child’s list returns the shopper shape, including who claimed each gift.
- Add a gift to a list they manage. The agent supplies the list, an optional title, the product URL if it has one, and optional notes, price, and quantity. The URL is stored exactly. A custom gift is a title with no URL. An experience includes a timing phrase. A membership includes **Annual**, **Season package**, or **Digital**. The same validation as the form applies: an empty custom title is rejected, a product needs a link, an experience or membership needs a title, and quantity is at least 1. A title with no link is a custom gift, including a thing to buy at a shop counter.
- Ask for a few gift ideas for a list they edit, in a price band. The tool returns the ideas and does not save one. Adding it uses the add-gift tool. The child-safe view does not register this tool.
- Read open pokes on a list they manage: the friend’s display name and the band. Dismiss one. No claim fields. The child-safe view does not register these tools.
- After reveal, rate a gift they received from 1 to 5 stars, including a purchased suggestion that was not on the list. The response includes no giver and no other rater. The child-safe view does not register this tool.
- Edit a gift’s title, link, notes, price, or quantity.
- Delete a gift, or delete a list they manage.
- Rename a list, and change its visibility.
- Add a child, which creates that child’s list. Invite another adult as a co-manager of that child, or remove one.
- Copy the share link, including who the link will let in.
- Reveal a list.

Shopping-list tools register on any signed-in page. They return only this shopper’s plan: the people, the gifts they are buying, and their private planned gifts. They do not return another shopper’s claims.

- Read the shopping list.
- Add or remove a person.
- Add, edit, or delete a private planned gift for a person on it.
- Ask for a few gift ideas for a person on it when a price band is thin. The tool returns the ideas and does not save one. Adding it uses the planned-gift tool. The ideas follow the gift-idea rules.
- Poke a friend for more ideas in a thin band on a list this shopper can open. It is the same poke as on the list page. A person with no account, a private list, and a list this shopper edits cannot be poked.
- Reserve, mark purchased, or release a wishlist gift that already appears under that person, with the same rules as the shopper tools.

The shopper tools register only while that person is viewing a list they are allowed to shop, and not on a list where they are the recipient:

- Read the gifts in the shopper shape, open gifts first, with how many are still open.
- Reserve a quantity (**I’ll get this**). A second reserve of the last quantity returns the same “already taken” result as the button. Reserving again when this shopper already holds it returns that claim.
- Mark that claim purchased, set it back to reserved, or release it. Only the person who claimed it can do these.
- Save the one line other shoppers see, such as “getting the blue one.”
- Poke for more ideas in a thin price band, when the viewer is an accepted friend and does not edit the list. The tool returns that caller’s open poke and does not save an idea. Poking again returns the same poke.

A signed-out visitor on a public list gets one read tool, in the guest shape: gifts, shopping notes, and open, reserved, or purchased, with no names. Reserving is not registered until they are signed in.

Friend tools, on any signed-in page:

- List friends and pending requests, by display name.
- Send a friend request by email.
- Accept, decline, or cancel a request.
- Remove a friendship.

### Browser extension

The extension is how someone adds the product they are already looking at when Nicelist is not open. While a signed-in Nicelist tab is open, the assistant tools can do that job too. The Chrome extension is part of the Christmas trial. Its source lives in this monorepo, and GitHub Actions typechecks and tests it with the rest of the pull request. Safari waits until the Chrome extension is solid.

- On a product page, the signed-in owner can add it to a list they choose. The extension sends the title, the full URL, and the price. Those fields use the same gift rules as the site. The trial does not store an image. Uploading a gift image to S3 waits until after the trial.
- It also reads the selected size, color, or variant from that live page and puts it in the note, which the owner can edit before saving. It keeps variant query parameters and a variant id in the URL. It does not substitute the canonical or parent-product URL. If it cannot tell which option is selected, it leaves the note blank.
- Adding uses the same API as the site. The extension shows the owner view only, so it cannot reveal who reserved a gift.
- The owner signs in with the same account as the site. The token stays in the extension.
- The Chrome Web Store listing is published before the trial group is invited. The listing says which pages it reads and that those product fields are sent to Nicelist.
- Adding a gift is not a partner click. Partner tags belong on shopper buy links in the app.

### Trial boundaries

- The list page has no ads and no sponsored products. The only commercial notice is the partner-link disclosure.
- Mail is limited to verification codes and password resets. Nicelist does not send newsletters or promotional email.
- A public list’s first screen shows the gifts. It does not wait on a product-page fetch or a group the visitor has to join.
- There is a short privacy note covering the adult’s email, Google sign-in, guest views of public lists, child profiles with no login of their own, the fact that claim details stay hidden from the recipient, and the fact that a shopping list is private to the shopper. It also says gift titles, notes, and prices the person can already see may be sent to generate gift ideas, that a friend who can see a list can poke them to add gifts in a price band and the editors see that friend’s name, and that a rating of a gift they received is anonymous to other people, including the giver. The trial does not collect age or gender. The note also says a browser agent can use the signed-in tab to take the same actions as the person, and that it cannot see claim details the person cannot see. It says Nicelist uses Google Tag Manager and Google Analytics to measure how the site is used, and that those events do not include the contents of a list, the share token, or who claimed a gift. It says the Chrome extension, signed in with the same account, can read the product page the owner is viewing and send the title, the full URL, the price, and the selected size or color to Nicelist, and that it shows the owner view only.
- Gift ideas are not sponsored, and they are not partner links. The list still works when ideas are unavailable.

## 3. Post-soft launch

These are real follow-ups. They are out of the Christmas trial.

### Product

- Drag-and-drop item order and priority.
- Group lists, such as one list for a household rather than a person.
- A directory for browsing public lists, plus search across people and lists. Soft launch finds lists through friends and through a link the owner shares.

A past season stays read-only. Wishlists gain a year, so a 2026 list can sit beside a later one. The shopper can keep a shopping list for each season.

Starting the next shopping list copies the previous roster. The people come along in the same order, including a name-only person, and each person’s standing note is already there because it does not belong to one year. This year’s wishlists show up on their own, because the person is the same person. The new list does not copy claims, purchased marks, private planned gifts, or the old total.

Under each person, last year is a short read-only history: the gifts this shopper gave, and which of them were marked **again next year**. The shopper can bring one forward as a new private planned gift. Those marked **again next year** are offered first. Last year’s total is one line of context, not a budget. The previous shopping list stays as it was.

### Contributions

A custom gift can collect money toward a cost, such as a trip. This waits until after the trial. It needs a payment provider, refunds, fees, and a payout to the owner. The owner cannot see that money has arrived before they reveal the list, which means Nicelist would hold the funds until then. The trial already lets someone claim “a trip to Thailand” and mark it gotten, without taking payment.

- A custom gift can have a goal amount.
- A signed-in shopper can contribute toward that goal. Other shoppers see the progress. The owner does not, until reveal.
- Contributions can be refunded before reveal. After reveal, the owner can receive the balance.

### Shopping help

- Paste a product URL and fill title, price, and image from the page. The trial saves the link and a title the owner types. It does not fetch the product page. When a fetch is added, a failure leaves the URL in place. A fetch may read size and color from the URL or from structured data for that exact URL. It does not follow a canonical link to a parent product, and it does not invent a variant when the page shows the default one.
- Images uploaded for a gift, stored in S3. The Chrome extension can then send the image it reads from the product page.
- Show the buyer’s name to the owner after reveal, for thank-you notes.

### Taste profile

Later gift ideas can use a taste profile the person builds about themselves. The trial’s ideas do not. The profile is a set of likes and limits, such as an interest, a brand they stick to, a thing to avoid, or a price they are glad to receive. It lasts from year to year. It is not a standing note a shopper wrote about someone else.

An optional quiz starts the profile. One question at a time, a handful of questions, and the person can skip it. They can change or remove any answer later. A managing adult can answer for a child, and that profile belongs to the child. The child has no login, and the quiz is not shown to the child-safe view.

The rest of the profile comes from corrections in place, one line at a time.

- On an idea, they can keep it or correct it. “I like this, but I only buy DeWalt” stores both the like and the limit.
- On a gift they added, the same correction is available.
- Dismissing an idea can save a limit without any other writing.
- Marking a gift **again next year** can save that kind of gift as a like.
- The profile lists every like and limit, and each one can be edited or removed.

Preferences start private to the person who wrote them. Idea requests for a list they edit may include that profile. They can share one preference with shoppers. A shared preference may be included when a shopper asks for ideas for that person. Shoppers do not see the quiz, and an unshared preference stays out of those requests. Reservations and purchases are not turned into preferences. Claims stay out of the prompt. The privacy note names the profile and says which preferences shoppers’ idea requests may use.

An adult can also add an age band and a gender. Both are optional, neither is a birthdate, and either can be removed. A stated interest, such as sports, can be used with those fields. Nothing is inferred from claims, purchases, or which lists they opened. A child still has no age and no gender.

Those fields change the anonymous line when a cohort of people who received the gift is large enough that one person or one household cannot be picked out. The line can then name that group, in the form “Male sports fans between 25 and 50 rated this 5 stars.” A smaller cohort keeps the trial’s generic line, or no line. The line appears on a later suggestion of that gift, not on a wishlist, and not to the giver of a particular one. The privacy note names the optional age band and gender, and says the line is an aggregate of people who received it.

### Browser extension

- Safari, after the Chrome extension in the trial is solid.
- Sending the product image the Chrome extension reads on the page, once gift images are stored in S3.

### Collaboration

- Live updates when someone else reserves a gift, so two open tabs do not race on stale quantity.
- Email when a friend request arrives, email when a friend pokes them for ideas, and email to other shoppers when a gift they can see is reserved or purchased. The owner gets no mail about reserves or purchases before they reveal the list.
- Sharing one private list with a specific person who is not a friend, without changing that list’s visibility.
- Comments on a gift between shoppers, hidden from the owner.
- A shopper can suggest a gift the recipient does not see. Other shoppers see it and can claim it. Managing adults already add those gifts on a child’s list during the trial. A private planned gift on a shopping list stays visible only to the shopper who wrote it.
- Two adults can share one shopping list, so they can divide who is buying what. The trial shopping list is private to one shopper.
- Account deletion that removes owned lists, items, reservations, and memberships.

### Local shops

Any store link is already a gift in the trial, including a shop with no partner program. A shop with no page is already a gift too: a title and a note, reserved before the shopper leaves, and marked purchased when they pay at the counter. Equal treatment comes from not classifying the store. A later effort can favor local small businesses. The form of that favor is not chosen yet. It might be a way to mark a gift as from a nearby shop, or an incentive that shop’s own terms allow. Choosing it means Nicelist starts telling shops apart, which the trial does not do. It does not put a reward, a rebate, points, or a donation on an Amazon Associates link. Amazon stays excluded. The trial does not fetch a page to guess whether a store is small or nearby, and it does not collect a shop’s address.

### Partner fees beyond the trial

- More merchants, each with its own tag and a postback or report that can mark the matching reservation purchased.
- Sharing a fee with the shopper, only for a merchant whose program allows incentives, and only with payouts, tax reporting, and fraud controls. Amazon stays excluded.

### Platform

- Pagination on lists and items.
- AppSync field logging, alarms on resolver errors and throttles, and a backup restore drill.
- Rate limits and abuse controls on public list links, guest reads, and friend requests. A WAF on AppSync waits until a public link is being scraped.
- Richer mail templates through a custom sender Lambda. The trial already sends verification and reset mail through SES from a Nicelist identity.
- Expand the privacy note as new data is collected. The trial note is already required above.

### Explicitly later, or not planned

- A custom Express or other always-on backend. AppSync remains the API.
- Amplify GraphQL models or any generated CRUD API. Owner, shopper, and guest payloads stay hand-written resolvers.
- A VPC, NAT Gateway, Aurora or another database server, ElastiCache, and API Gateway for ordinary reads and writes.
- Lambda for ordinary list and gift reads and writes. A gift-idea request, and a later Associates report job, may use Lambda.
- AppSync subscriptions during the trial. Live updates remain the collaboration follow-up above.
- Cognito Plus, provisioned DynamoDB capacity, and provisioned Lambda concurrency.
- Native iOS and Android apps.
- Public profiles, follows, and a social feed.
- A registry that checks out inside Nicelist. Contributions toward a custom gift are planned above. Product checkout stays on the merchant. Nicelist does not sell tickets, hold seats, book a performance, or open a membership account.
- Cash back, points, or any split of an Amazon Associates fee with the shopper.
- In-app chat.
- Secret Santa, name draws, and gift-exchange assignments. A Christmas shopping list is the shopper’s own plan, and it is in the trial.
- Advertising or marketing email.
