import { Router } from "expo-router";

export function goTo(item: any, location: any, router: Router) {
  const payload = encodeURIComponent(JSON.stringify(item));
  router.push({
    pathname: location,
    params: { id: String(item.key), payload },
  });
}

export function calculateAge(birthdate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthdate.getFullYear();
  const monthDiff = today.getMonth() - birthdate.getMonth();

  // If the current month is before the birth month, subtract one year
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthdate.getDate())
  ) {
    age--;
  }
  return age;
}

export function getRandomIntegerInclusive(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function datediff(first: number, second: number) {
  return Math.round((second - first) / (1000 * 60 * 60 * 24));
}
