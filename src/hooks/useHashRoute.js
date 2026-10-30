import { useCallback, useEffect, useState } from "react";

export const ROUTES = ["/", "/vote", "/results", "/admin"];

function currentPath() {
  const path = window.location.hash.replace(/^#/, "") || "/";
  return ROUTES.includes(path) ? path : "/";
}

/** Minimal hash router: #/, #/vote, #/results, #/admin. */
export function useHashRoute() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onChange = () => {
      setPath(currentPath());
      window.scrollTo({ top: 0 });
    };
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = useCallback((to) => {
    window.location.hash = to;
  }, []);

  return { path, navigate };
}
