import type { Metadata } from "next";
import { ProjectsView } from "@/features/projects/components/projects-view";

const baseUrl =
  process.env.NEXT_PUBLIC_APP_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);

export const metadata: Metadata = {
  title: "LuminaWeb",
  description:
    "Cloud IDE with AI suggestions, quick edit (Cmd+K), and GitHub integration. Create and open projects in your browser.",
  openGraph: {
    title: "LuminaWeb – Cloud IDE with AI",
    description:
      "Cloud IDE with AI suggestions, quick edit (Cmd+K), and GitHub integration.",
  },
  ...(baseUrl && {
    alternates: { canonical: baseUrl },
  }),
};

const Home = () => {
  return <ProjectsView />;
};

export default Home;
