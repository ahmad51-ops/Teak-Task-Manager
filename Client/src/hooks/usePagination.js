import { useState } from "react";

// Owns just the page number — list pages pass `page` into their query
// params and `totalPages` (from the API's pagination.totalPages) back in
// here so next/prev know their bounds.
export const usePagination = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);

  const goToPage = (p) => setPage(Math.max(1, p));
  const nextPage = (totalPages) => setPage((p) => Math.min(p + 1, totalPages || p + 1));
  const prevPage = () => setPage((p) => Math.max(1, p - 1));
  const resetPage = () => setPage(1);

  return { page, setPage, goToPage, nextPage, prevPage, resetPage };
};
