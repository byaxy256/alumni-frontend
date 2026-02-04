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
};

export function News({ onBack }: { onBack: () => void }) {
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
          hasImage: !!it.hasImage,
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
        {selectedArticle.hasImage ? (
          <div className="w-full h-80 overflow-hidden rounded-lg bg-gray-100 mb-4">
            <ImageWithFallback src={`${API_BASE}/content/news/${selectedArticle.id}/image`} alt={selectedArticle.title} className="w-full h-full object-cover" />
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
      <div className="flex items-center gap-4">
        <Button onClick={onBack} variant="ghost" size="icon"><ArrowLeft /></Button>
        <h1 className="text-xl font-semibold">News & Updates</h1>
      </div>

      {loading ? (
        <div className="text-center py-10"><Loader2 className="mx-auto h-8 w-8 animate-spin" /></div>
      ) : articles.length > 0 ? (
        articles.map(article => (
          <Card
            key={article.id}
            className="cursor-pointer hover:shadow-md transition"
            onClick={() => { setSelectedArticle(article); setIsDetailView(true); }}
          >
            {article.hasImage ? (
              <div className="w-full h-48 overflow-hidden bg-gray-100">
                <ImageWithFallback src={`${API_BASE}/content/news/${article.id}/image`} alt={article.title} className="w-full h-full object-cover" />
              </div>
            ) : null}
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
          </Card>
        ))
      ) : (
        <p>No news articles found.</p>
      )}
    </div>
  );
}


