import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { app } from "@/app/appStyles";
import * as stylex from "@stylexjs/stylex";

export default function PrivacyPage() {
  return (
    <>
      <AppHeader />
      <main {...stylex.props(app.page)}>
        <h1 {...stylex.props(app.title)}>Privacy</h1>
        <p>
          Nicelist stores the email you use to sign up, and your name from
          Google when you sign in that way. You can change the name other people
          see.
        </p>
        <p>
          A public list can be opened by anyone with the link, including someone
          who is signed out. That view shows gifts and whether each one is open,
          reserved, or purchased. It does not show shopper names.
        </p>
        <p>
          A child is a name on an adult&apos;s account. Nicelist does not
          collect a child&apos;s email, password, or birthdate.
        </p>
        <p>
          Claim details stay hidden from the person the list is for until they
          choose to reveal it. After reveal they see which gifts were purchased
          and the buyer&apos;s display name, so they can say thank you. A gift
          that was only reserved stays unlabeled.
        </p>
        <p>
          Pasting a product link asks Nicelist to fetch that exact page for a
          title, a price, and an image. The image is stored by Nicelist. If the
          fetch fails, the link you pasted is kept. A public link preview can
          show the list name and up to two gift titles. A friends-only or
          private list, and a link that does not match a list, shows only the
          name Nicelist.
        </p>
        <p>
          Nicelist emails a friend request, a poke to the adults who manage a
          list, and a daily note of how many gifts are still open. When a gift
          is reserved or purchased, friends who can already see that list are
          told the gift was taken or purchased. That mail does not name the
          buyer, and it is not sent to the person the list is for.
        </p>
        <p>
          A custom gift can have a goal. Shoppers see progress. The owner sees
          the goal they set, and does not see the contributed total or who paid
          until they reveal the list. A past season is kept and cannot be edited.
        </p>
        <p>
          A shopping list is private to the shopper. The recipient&apos;s
          account cannot read it.
        </p>
        <p>
          When you ask for gift ideas, Nicelist sends the gift titles, notes,
          and prices you can already see, and the price band, to generate a few
          ideas. A friend who can see a list can poke the editors to add more
          gifts in a price band, and the people who edit that list see that
          friend&apos;s display name and the band. A rating you give a gift you
          received is anonymous to other people, including the giver. The trial
          does not collect age or gender.
        </p>
        <p>
          A browser agent can use a signed-in Nicelist tab to take the same
          actions you can take. It cannot see claim details you cannot see.
        </p>
        <p>
          Nicelist uses Google Tag Manager and Google Analytics to measure how
          the site is used. Those events name the action and do not include the
          contents of a list, gift titles, notes, prices, email addresses,
          display names, the share token, the list id, or who claimed a gift.
        </p>
        <p>
          The Nicelist Chrome extension, signed in with the same account, can
          read the product page you are viewing when you click it and send the
          title, the full URL, the price, the product image, and the selected
          size, color, or variant to Nicelist. Nicelist stores a copy of the
          image. The extension shows the owner view only, so it
          cannot reveal who reserved or bought a gift.
        </p>
        <p>
          <Link href="/">Back home</Link>
        </p>
      </main>
    </>
  );
}
