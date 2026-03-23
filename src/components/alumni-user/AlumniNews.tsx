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
  imageUrl?: string;
  updatedAt?: string;
};

function resolveNewsImageSrc(article: AlumniArticle): string | null {
  if (article.imageUrl && typeof article.imageUrl === 'string') {
    return article.imageUrl;
  }
  if (article.hasImage) {
    const stamp = article.updatedAt || article.created_at || '';
    return `${API_BASE}/content/news/${article.id}/image${stamp ? `?v=${encodeURIComponent(stamp)}` : ''}`;
  }
  return null;
}

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
          hasImage: !!(item.hasImage || item.imageUrl || item.image_url || item.image_data),
          imageUrl: typeof item.imageUrl === 'string' ? item.imageUrl : undefined,
          updatedAt: item.updated_at ?? item.updatedAt,
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

        {resolveNewsImageSrc(selectedArticle) ? (
          <div className="w-full h-80 overflow-hidden rounded-lg bg-gray-100">
            <ImageWithFallback
              src={resolveNewsImageSrc(selectedArticle)!}
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
            className="cursor-pointer transition hover:shadow-lg overflow-hidden border-0 ring-1 ring-slate-200"
            onClick={() => setSelectedArticle(article)}
          >
            <div className="flex flex-row items-stretch">
              <div className="w-64 h-64 flex-shrink-0 bg-gray-100 overflow-hidden">
                {resolveNewsImageSrc(article) ? (
                  <ImageWithFallback
                    src={resolveNewsImageSrc(article)!}
                    alt={article.title}
                    className="w-full h-full object-cover"
                  />
                ) : null}
              </div>

              <div className="flex-1 p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{article.title}</h3>
                  <p className="text-xs text-gray-500 mb-3">Published on {new Date(article.created_at).toLocaleDateString()}</p>
                  <p className="text-sm text-gray-600 line-clamp-4">{article.content}</p>
                </div>
                <Button
                  variant="link"
                  className="px-0 w-fit"
                  onClick={(event) => {
                    event.stopPropagation();
                    setSelectedArticle(article);
                  }}
                >
                  Read more →
                </Button>
              </div>
            </div>
          </Card>
        ))
      ) : (
        <p>No news articles found.</p>
      )}
    </div>
  );
}
