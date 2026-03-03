import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { API_BASE } from '../../api';
import { ImageWithFallback } from '../figma_image/ImageWithFallback';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';

type AlumniArticle = {
  id: string | number;
  title: string;
  content: string;
  created_at: string;
  hasImage?: boolean;
};

interface AlumniNewsProps {
  onBack: () => void;
}

export function AlumniNews({ onBack }: AlumniNewsProps) {
  const [articles, setArticles] = useState<AlumniArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<AlumniArticle | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE}/content/news?audience=alumni`);
        if (!res.ok) {
          throw new Error('Failed to fetch alumni news');
        }

        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : raw?.content || [];
        const mapped: AlumniArticle[] = items.map((item: any) => ({
          id: item.id,
          title: item.title,
          content: item.content ?? item.description ?? '',
          created_at: item.created_at ?? item.createdAt ?? new Date().toISOString(),
          hasImage: !!item.hasImage,
        }));

        setArticles(mapped);
      } catch (error) {
        console.error(error);
        setArticles([]);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (selectedArticle) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(null)}>
            <ArrowLeft />
          </Button>
          <h1 className="text-xl font-semibold">Article</h1>
        </div>

        {selectedArticle.hasImage ? (
          <div className="w-full h-80 overflow-hidden rounded-lg bg-gray-100">
            <ImageWithFallback
              src={`${API_BASE}/content/news/${selectedArticle.id}/image`}
              alt={selectedArticle.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{selectedArticle.title}</CardTitle>
            <CardDescription>
              Published on {new Date(selectedArticle.created_at).toLocaleDateString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="whitespace-pre-wrap text-lg">{selectedArticle.content}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon">
          <ArrowLeft />
        </Button>
        <h1 className="text-xl font-semibold">News & Updates</h1>
      </div>

      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="mx-auto h-8 w-8 animate-spin" />
        </div>
      ) : articles.length > 0 ? (
        articles.map((article) => (
          <Card
            key={article.id}
            className="cursor-pointer transition hover:shadow-md"
            onClick={() => setSelectedArticle(article)}
          >
            {article.hasImage ? (
              <div className="w-full h-48 overflow-hidden bg-gray-100">
                <ImageWithFallback
                  src={`${API_BASE}/content/news/${article.id}/image`}
                  alt={article.title}
                  className="w-full h-full object-cover"
                />
              </div>
            ) : null}

            <CardHeader>
              <CardTitle>{article.title}</CardTitle>
              <CardDescription>
                Published on {new Date(article.created_at).toLocaleDateString()}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <p className="line-clamp-3 whitespace-pre-wrap">{article.content}</p>
              <Button
                variant="link"
                className="px-0"
                onClick={(event) => {
                  event.stopPropagation();
                  setSelectedArticle(article);
                }}
              >
                Read more
              </Button>
            </CardContent>
          </Card>
        ))
      ) : (
        <p>No news articles found.</p>
      )}
    </div>
  );
}
