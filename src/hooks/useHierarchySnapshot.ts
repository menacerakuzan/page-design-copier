import { useQuery } from "@tanstack/react-query";
import { loadHierarchySnapshot } from "@/lib/adminRepository";

export function useHierarchySnapshot() {
  return useQuery({
    queryKey: ["hierarchy-snapshot"],
    queryFn: () => loadHierarchySnapshot(),
    staleTime: 30_000,
  });
}

