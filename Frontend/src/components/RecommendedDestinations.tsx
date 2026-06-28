import { useEffect, useMemo, useState } from 'react';
import { touristsApi } from '@/api/tourists';
import { PlaceCard } from '@/components/shared/PlaceCard';
import { useAuth } from '@/context/AuthContext';
import type { RecommendationPlace, Place } from '@/types';

interface RecommendedDestinationsProps {
  places: Place[];
}

export const RecommendedDestinations = ({ places }: RecommendedDestinationsProps) => {
  const { isAuthenticated } = useAuth();
  const [recommendations, setRecommendations] = useState<RecommendationPlace[]>([]);
  const [isLoading, setIsLoading] = useState(() => isAuthenticated);
  const [error, setError] = useState<string | null>(null);

  const realRecommendedPlaces = useMemo(
    () =>
      recommendations
        .map((rec) => places.find((p) => p.idFromModel === rec.place_id))
        .filter((p): p is Place => p !== undefined),
    [places, recommendations]
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        const data = await touristsApi.getRecommendations();
        setRecommendations(data);
      } catch (err) {
        console.error("Error fetching recommendations:", err);
        setError('حدث خطأ أثناء جلب الأماكن المقترحة');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [isAuthenticated]);

  if (!isAuthenticated) return null;
  if (isLoading) {
    return (
      <div className="py-12 flex justify-center items-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-500"></div>
      </div>
    );
  }

  // إذا كان هناك خطأ أو لم ترجع أي توصيات أو كانت قائمة الأماكن الرئيسية فارغة، لا تعرض السكشن
  if (error || recommendations.length === 0 || places.length === 0) return null;

  // إذا لم نجد أي أماكن متطابقة لا تعرض السكشن
  if (realRecommendedPlaces.length === 0) return null;

  return (
    <section className="container-app section-py pt-8">
      <div className="mb-8 flex items-end justify-between gap-4">
        <div>
          <p className="section-label text-primary-600 dark:text-primary-400">Based on your activity</p>
          <h2 className="mt-1">Recommended For You 🌟</h2>
          <div className="gold-rule mt-2 w-16" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {/* نمرر المكان الحقيقي للكارد ليتمكن من عرض التقييم الفعلي وفتح صفحة التفاصيل */}
        {realRecommendedPlaces.map((place) => (
          <PlaceCard key={`rec-${place.id}`} place={place} />
        ))}
      </div>
    </section>
  );
};