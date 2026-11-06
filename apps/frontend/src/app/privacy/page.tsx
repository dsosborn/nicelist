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
        <p>Nicelist stores the email you use to sign up, and your name from Google when you sign in that way. You can change the name other people see.</p>
        <p>A public list can be opened by anyone with the link, including someone who is signed out. That view shows gifts and whether each one is open, reserved, or purchased. It does not show shopper names.</p>
        <p>A child is a name on an adult&apos;s account. Nicelist does not collect a child&apos;s email, password, or birthdate.</p>
        <p>Claim details stay hidden from the person the list is for until they choose to reveal it. After reveal they see which gifts were purchased, still without the shopper&apos;s name.</p>
        <p>A shopping list is private to the shopper. The recipient&apos;s account cannot read it.</p>
        <p>When you ask for gift ideas, Nicelist sends the gift titles, notes, and prices you can already see, and the price band, to generate a few ideas. A rating you give a gift you received is anonymous to other people, including the giver. The trial does not collect age or gender.</p>
        <p>A browser agent can use a signed-in Nicelist tab to take the same actions you can take. It cannot see claim details you cannot see.</p>
        <p><Link href="/">Back home</Link></p>
      </main>
    </>
  );
}
