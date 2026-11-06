import Link from "next/link";
import * as stylex from "@stylexjs/stylex";
import { HomeWish } from "./HomeWish";
import { homeStyles } from "./homeStyles";

const BENEFITS = [
  {
    index: "01",
    title: "Add anything",
    body: "A link from any shop, or a wish with no shop at all. A sweater, a game, a membership.",
  },
  {
    index: "02",
    title: "Send one link",
    body: "The family group text can open it. Or keep it to friends.",
  },
  {
    index: "03",
    title: "They mark it taken",
    body: "You keep seeing the list you wrote. Who got what stays hidden until you reveal it.",
  },
];

export default function Home() {
  return (
    <div {...stylex.props(homeStyles.page)}>
      <section {...stylex.props(homeStyles.hero)}>
        <div {...stylex.props(homeStyles.photo)} />
        <header {...stylex.props(homeStyles.header)}>
          <Link href="/" {...stylex.props(homeStyles.brand)}>
            Nicelist
          </Link>
          <Link href="/login" {...stylex.props(homeStyles.signIn)}>
            Sign in
          </Link>
        </header>
        <div {...stylex.props(homeStyles.heroBody)}>
          <div {...stylex.props(homeStyles.copy)}>
            <h1 {...stylex.props(homeStyles.title)}>
              Give your people what they want.
            </h1>
            <HomeWish />
          </div>
        </div>
      </section>
      <section {...stylex.props(homeStyles.benefits)}>
        <div {...stylex.props(homeStyles.benefitsInner)}>
          <p {...stylex.props(homeStyles.kicker)}>The list</p>
          <h2 {...stylex.props(homeStyles.benefitsTitle)}>
            One list. One link. No spoiled surprises.
          </h2>
          <div {...stylex.props(homeStyles.grid)}>
            {BENEFITS.map((benefit) => (
              <article key={benefit.index}>
                <p {...stylex.props(homeStyles.itemIndex)}>{benefit.index}</p>
                <h3 {...stylex.props(homeStyles.itemTitle)}>{benefit.title}</h3>
                <p {...stylex.props(homeStyles.itemBody)}>{benefit.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
