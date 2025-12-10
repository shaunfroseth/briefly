import { Skeleton } from "./Skeleton";

export function RecipeSkeleton() {
  return (
    <div className="recipe-skeleton">
      {/* Title */}
      <Skeleton className="skeleton-title" />

      {/* Meta chips */}
      <div className="recipe-skeleton-meta">
        <Skeleton className="skeleton-meta-chip" />
        <Skeleton className="skeleton-meta-chip" />
      </div>

      {/* Ingredients section */}
      <Skeleton className="skeleton-section-heading" />
      <div className="recipe-skeleton-list">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="skeleton-line" />
        ))}
      </div>

      {/* Steps section */}
      <Skeleton className="skeleton-section-heading" />
      <div className="recipe-skeleton-steps">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="recipe-skeleton-step">
            <Skeleton className="skeleton-line" />
            <Skeleton className="skeleton-line short" />
          </div>
        ))}
      </div>
    </div>
  );
}
