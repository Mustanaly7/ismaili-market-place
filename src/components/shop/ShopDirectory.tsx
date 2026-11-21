"use client";

import { useMemo, useState } from "react";
import { LocateFixed, Search, Store } from "lucide-react";
import { ShopCard } from "@/components/shop/ShopCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { ShopCardData, ShopLocation } from "@/server/catalog";

function distanceKm(
  aLat: number,
  aLng: number,
  bLat: number,
  bLng: number,
): number {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) *
      Math.cos((bLat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export function ShopDirectory({
  shops,
  locations,
}: {
  shops: ShopCardData[];
  locations: ShopLocation[];
}) {
  const [q, setQ] = useState("");
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const countries = useMemo(
    () => Array.from(new Set(locations.map((l) => l.country).filter(Boolean))).sort(),
    [locations],
  );
  const cities = useMemo(
    () =>
      Array.from(
        new Set(
          locations
            .filter((l) => !country || l.country === country)
            .map((l) => l.city)
            .filter(Boolean),
        ),
      ).sort(),
    [locations, country],
  );

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const list = shops.filter((s) => {
      if (country && s.country !== country) return false;
      if (city && s.city !== city) return false;
      if (
        needle &&
        !`${s.name} ${s.description} ${s.city} ${s.country}`.toLowerCase().includes(needle)
      )
        return false;
      return true;
    });
    if (coords) {
      return [...list].sort((a, b) => {
        const da =
          a.lat != null && a.lng != null
            ? distanceKm(coords.lat, coords.lng, a.lat, a.lng)
            : Number.POSITIVE_INFINITY;
        const db =
          b.lat != null && b.lng != null
            ? distanceKm(coords.lat, coords.lng, b.lat, b.lng)
            : Number.POSITIVE_INFINITY;
        return da - db;
      });
    }
    return list;
  }, [shops, country, city, q, coords]);

  function locate() {
    if (!("geolocation" in navigator)) {
      setGeoError("Your device does not support location.");
      return;
    }
    setLocating(true);
    setGeoError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setGeoError("We could not get your location. Try picking a city instead.");
        setLocating(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-card">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-3 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-400"
            />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search shops by name or place"
              aria-label="Search shops"
              className="min-h-touch w-full rounded-xl border-2 border-stone-300 ps-10 pe-3 py-2 text-lg focus:border-brand-500 focus:outline-none"
            />
          </div>
          <select
            value={country}
            onChange={(e) => {
              setCountry(e.target.value);
              setCity("");
            }}
            aria-label="Country"
            className="min-h-touch rounded-xl border-2 border-stone-300 px-3 text-lg"
          >
            <option value="">All countries</option>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={city}
            onChange={(e) => setCity(e.target.value)}
            aria-label="City"
            className="min-h-touch rounded-xl border-2 border-stone-300 px-3 text-lg"
          >
            <option value="">All cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="inline-flex min-h-touch items-center justify-center gap-2 rounded-xl bg-brand-600 px-5 text-lg font-bold text-white hover:bg-brand-700 disabled:opacity-60"
          >
            <LocateFixed aria-hidden className="h-5 w-5" />
            {locating ? "Locating…" : coords ? "Sorted by nearest" : "Shops near me"}
          </button>
        </div>
        {geoError ? <p className="mt-2 text-sm text-danger-700">{geoError}</p> : null}
      </div>

      <p className="mt-4 text-lg text-stone-600">
        {filtered.length} shop{filtered.length === 1 ? "" : "s"}
        {coords ? " · nearest first" : ""}
      </p>

      {filtered.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No shops match"
            description="Try a different city, country, or search word."
            action={
              <span className="inline-flex items-center gap-2 rounded-xl bg-stone-100 px-4 py-2 font-semibold text-stone-700">
                <Store aria-hidden className="h-5 w-5" /> Shops appear here once sellers join
              </span>
            }
          />
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {filtered.map((s) => (
            <ShopCard key={s.id} shop={s} />
          ))}
        </div>
      )}
    </div>
  );
}