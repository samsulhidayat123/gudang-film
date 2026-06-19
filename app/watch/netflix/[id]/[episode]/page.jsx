import EpisodePlayerPage from "@/components/EpisodePlayerPage";

export default async function NetflixWatchPage({ params }) {
  const { id, episode } = await params;

  return (
    <EpisodePlayerPage
      type="netflix"
      id={id}
      episode={episode}
    />
  );
}
