import { Router } from "expo-router";

export function goTo(item: any, location: any, router: Router) {
  const payload = encodeURIComponent(JSON.stringify(item));
  router.push({
    pathname: location,
    params: { id: String(item.key), payload },
  })
}