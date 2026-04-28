import type { Metadata } from "next";

import { ProjectsView } from "@/features/projects/components/projects-view";

export const metadata: Metadata = {
  title: "Your projects",
  robots: { index: false, follow: false },
};

const ProjectsPage = () => {
  return <ProjectsView />;
};

export default ProjectsPage;
