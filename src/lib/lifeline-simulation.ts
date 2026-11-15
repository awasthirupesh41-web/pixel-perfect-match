export type Coordinates = { latitude: number; longitude: number };

export type AvailableUnit = Coordinates & { id: string; status: "available" | "busy" | "offline" };

export function distanceKm(start: Coordinates, end: Coordinates): number {
  const earthRadiusKm = 6371;
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(end.latitude - start.latitude);
  const longitudeDelta = radians(end.longitude - start.longitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(start.latitude)) *
      Math.cos(radians(end.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
}

export function closestAvailableUnit<T extends AvailableUnit>(
  origin: Coordinates,
  units: T[],
): T | null {
  return units
    .filter((unit) => unit.status === "available")
    .toSorted((a, b) => distanceKm(origin, a) - distanceKm(origin, b))[0] ?? null;
}

export function estimateArrivalMinutes(distance: number): number {
  return Math.max(3, Math.ceil((distance / 24) * 60 + 2));
}