import { createFileRoute } from "@tanstack/react-router";
import { NourishApp } from "@/components/nourish-app";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nourish AI — Personal Nutrition Coach" },
      { name: "description", content: "Track local foods, nutrition goals and food spending with a practical personal coach." },
      { property: "og:title", content: "Nourish AI — Personal Nutrition Coach" },
      { property: "og:description", content: "Nutrition guidance built around your body, local foods and budget." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return <NourishApp />;
}
