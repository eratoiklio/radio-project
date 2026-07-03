import {getEpisodes} from "@/lib/api/polishRadioApi";
import {EpisodeList} from "@/components/EpisodeList";

export default async function Home() {
  const response = await getEpisodes({ pageNumber: 1, pageSize: 10 });
  const episodes =  response.data;
  return (
      <EpisodeList episodes={episodes}></EpisodeList>
  );
}
