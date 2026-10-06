import { NewsList } from "@/components/news-list";
import { Card, PageHeader, Tabs } from "@/components/ui";
import { getNews, NEWS_CATEGORIES, type NewsCategory } from "@/lib/market/news";

export const metadata = { title: "Noticias" };

export default async function NewsPage({ searchParams }: PageProps<"/noticias">) {
  const { c } = await searchParams;
  const category = (NEWS_CATEGORIES.some((x) => x.id === c) ? c : "todas") as NewsCategory | "todas";
  const news = await getNews(category, 80);

  return (
    <>
      <PageHeader title="Noticias" subtitle="Titulares de Expansión, Cinco Días, Investing, MarketWatch, BBC, CoinDesk y más, actualizados cada pocos minutos.">
        <Tabs items={NEWS_CATEGORIES.map((x) => ({ id: x.id, label: x.label, href: `/noticias?c=${x.id}` }))} active={category} />
      </PageHeader>
      <Card className="max-w-4xl">
        <NewsList items={news} />
      </Card>
    </>
  );
}
