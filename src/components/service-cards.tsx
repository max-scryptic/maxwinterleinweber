import { Mail, Rocket, Workflow } from "lucide-react";
import * as React from "react";

import carved from "@/components/carved.module.css";
import { Card, CardContent } from "@/components/ui/card";

/*
 * The services offered off the page, as opposed to the products built from it.
 * They are laid out as the SaaS cards are so the two groups read as the same
 * kind of thing, but every one of them is the same door: a card is a line about
 * the work and a way to start a conversation about it, and the conversation
 * starts in mail. There is no site to send anyone to, so the marks are not
 * traced off a product's artwork but drawn from the icon set the page already
 * carries, on a tile in the page's own ink rather than a brand colour.
 */

const CONTACT = "mailto:maxwinterleinweber@gmail.com";

type Service = {
  name: string;
  description: string;
  icon: React.ComponentType<React.ComponentProps<"svg">>;
};

const services: Service[] = [
  {
    name: "GTM App Development",
    description:
      "Looking to bring a product idea to life and take it to market? Contact me here.",
    icon: Rocket,
  },
  {
    name: "AI Automations",
    description:
      "Spending too much time on manual bottlenecks within your business? Contact me here.",
    icon: Workflow,
  },
];

export function ServiceCards() {
  return (
    // The same wrapping, centred row the builds sit in, for the same reasons:
    // side by side where there is room, stacked where there is not, and a
    // short last row centred under the full ones.
    <ul className="flex flex-wrap justify-center gap-2">
      {services.map((service) => (
        <li key={service.name} className="flex min-w-0">
          <ServiceCard service={service} />
        </li>
      ))}
    </ul>
  );
}

function ServiceCard({ service }: { service: Service }) {
  const Icon = service.icon;

  return (
    // A mail link rather than a page: it opens in whatever handles mail on the
    // device, so there is no new tab to ask for and no referrer to withhold.
    <a
      href={CONTACT}
      aria-label={`${service.name}: ${service.description}`}
      className={`group flex w-[26rem] max-w-full rounded-2xl transition duration-200 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none ${carved.link}`}
    >
      {/* Cut into the pane to the same depth as the build cards, padded the
          same way for the same reason, and rising to the face of the glass
          under a pointer the same way. */}
      <Card
        className={`flex-1 gap-0 rounded-2xl border-transparent bg-white py-3 transition duration-200 ${carved.carved} ${carved.deep}`}
      >
        <CardContent className="flex items-center gap-4 px-5">
          {/* The tile is the page's own ink, since there is no product here
              whose colour it could borrow. The mark is a stroked icon rather
              than a filled one, so it is set a little smaller than the filled
              product marks to keep the same visual weight on the tile. */}
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-neutral-900 text-white">
            <Icon aria-hidden="true" className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-lg leading-tight font-semibold text-neutral-900">
              {service.name}
            </span>
            {/* The line is a question and an invitation, so it is allowed to
                wrap to a second line rather than being cut to fit. */}
            <span className="mt-1 block text-sm leading-snug text-neutral-500">
              {service.description}
            </span>
          </span>
          {/* An envelope where the build cards carry an arrow, because that is
              the one bit of the card that says what clicking it does: this one
              opens mail rather than another site. It darkens with the hover
              rather than moving, as the arrow does, and for the same reason. */}
          <Mail
            aria-hidden="true"
            className="size-5 shrink-0 text-neutral-400 transition duration-200 group-hover:text-neutral-900"
          />
        </CardContent>
      </Card>
    </a>
  );
}
