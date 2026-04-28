import { useQuery } from "@tanstack/react-query";
import { loadPublishedContentCards } from "@/lib/adminRepository";

export function usePageContentCards(pageKey: string) {
  return useQuery({
    queryKey: ["content-cards", pageKey],
    queryFn: () => loadPublishedContentCards(pageKey),
    staleTime: 60_000,
  });
}

