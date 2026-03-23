// src/components/student/News.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { API_BASE } from '../../api';
import { Button } from '../ui/button';
import { ImageWithFallback } from '../figma_image/ImageWithFallback';

type Article = {
  id: string | number;
  title: string;
  content: string;
  created_at: string;
  hasImage?: boolean;
  imageUrl?: string;
  updatedAt?: string;
};

function resolveNewsImageSrc(article: Article): string | null {
  if (article.imageUrl && typeof article.imageUrl === 'string') {
    return article.imageUrl;
  }
  if (article.hasImage) {
    const stamp = article.updatedAt || article.created_at || '';
    return `${API_BASE}/content/news/${article.id}/image${stamp ? `?v=${encodeURIComponent(stamp)}` : ''}`;
  }
  return null;
}

export function News({ onBack, embedded }: { onBack: () => void; embedded?: boolean }) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isDetailView, setIsDetailView] = useState(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${API_BASE}/content/news?audience=students`);
        if (!res.ok) throw new Error('Failed to fetch news');
        const raw = await res.json();
        const items = Array.isArray(raw) ? raw : raw?.content || [];
        const mapped: Article[] = items.map((it: any) => ({
          id: it.id,
          title: it.title,
          content: it.content ?? it.description ?? '',
          created_at: it.created_at ?? it.createdAt ?? new Date().toISOString(),
          hasImage: !!(it.hasImage || it.imageUrl || it.image_url || it.image_data),
          imageUrl: typeof it.imageUrl === 'string' ? it.imageUrl : undefined,
          updatedAt: it.updated_at ?? it.updatedAt,
        }));
        setArticles(mapped);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchNews();
  }, []);

  if (isDetailView && selectedArticle) {
    return (
      <div className="p-4 lg:p-6 space-y-4">
        <div className="flex items-center gap-4">
          <Button onClick={() => { setIsDetailView(false); setSelectedArticle(null); }} variant="ghost" size="icon"><ArrowLeft /></Button>
          <h1 className="text-xl font-semibold">Article</h1>
        </div>
        {resolveNewsImageSrc(selectedArticle) ? (
          <div className="w-full h-80 overflow-hidden rounded-lg bg-gray-100 mb-4">
            <ImageWithFallback src={resolveNewsImageSrc(selectedArticle)!} alt={selectedArticle.title} className="w-full h-full object-cover" />
          </div>
        ) : null}
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">{selectedArticle.title}</CardTitle>
            <CardDescription>Published on {new Date(selectedArticle.created_at).toLocaleDateString()}</CardDescription>
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
      {!embedded && (
        <div className="flex items-center gap-4">
          <Button onClick={onBack} variant="ghost" size="icon"><ArrowLeft /></Button>
          <h1 className="text-xl font-semibold">News & Updates</h1>
        </div>
      )}

      {loading ? (
        <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
      ) : articles.length > 0 ? (
        articles.map(article => (
          <Card
            key={article.id}
            className="cursor-pointer hover:shadow-md transition overflow-hidden"
            onClick={() => { setSelectedArticle(article); setIsDetailView(true); }}
          >
            <div className="flex flex-col md:flex-row">
              <div className="md:w-72 md:min-w-[18rem] h-52 md:h-auto bg-gray-100 overflow-hidden">
                {resolveNewsImageSrc(article) ? (
                  <ImageWithFallback src={resolveNewsImageSrc(article)!} alt={article.title} className="w-full h-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <CardHeader>
                  <CardTitle>{article.title}</CardTitle>
                  <CardDescription>Published on {new Date(article.created_at).toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap line-clamp-3">{article.content}</p>
                  <Button variant="link" className="px-0" onClick={(e: React.MouseEvent<HTMLElement>) => { e.stopPropagation(); setSelectedArticle(article); setIsDetailView(true); }}>
                    Read more
                  </Button>
                </CardContent>
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


