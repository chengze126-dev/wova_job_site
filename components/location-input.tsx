"use client";

import { useMemo, useState } from "react";
import { COUNTRY_META, countryMeta, formatLocation } from "@/lib/geo";

const fieldClass =
  "w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted";

export function LocationInput({
  cityName = "city",
  countryName = "country",
  combinedName,
  defaultCity,
  defaultCountry,
  label = "Location",
  required,
}: {
  cityName?: string;
  countryName?: string;
  combinedName?: string;
  defaultCity?: string | null;
  defaultCountry?: string | null;
  label?: string;
  required?: boolean;
}) {
  const [country, setCountry] = useState(defaultCountry || "United States");
  const [city, setCity] = useState(defaultCity || "");
  const meta = useMemo(() => countryMeta(country), [country]);
  const preview = formatLocation(city, country) || `${meta.name}`;
  const listId = `${cityName}-cities`;

  return (
    <label className="block text-sm">
      {label} {required ? <span className="text-copper-dark">*</span> : null}
      <span className="mt-1 grid gap-2 sm:grid-cols-[220px_1fr]">
        <select
          name={combinedName ? undefined : countryName}
          value={country}
          onChange={(event) => setCountry(event.target.value)}
          className={fieldClass}
          aria-label="Country"
        >
          {COUNTRY_META.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
        <input
          name={combinedName ? undefined : cityName}
          value={city}
          onChange={(event) => setCity(event.target.value)}
          required={required}
          autoComplete="address-level2"
          list={listId}
          placeholder={`City in ${meta.name}`}
          className={fieldClass}
        />
      </span>
      <datalist id={listId}>
        {meta.cities.map((item) => (
          <option key={item} value={item} />
        ))}
      </datalist>
      {combinedName ? <input type="hidden" name={combinedName} value={preview} /> : null}
      {combinedName ? <input type="hidden" name={countryName} value={country} /> : null}
      <span className="mt-1 block text-[12px] text-muted">Shown as {preview}</span>
    </label>
  );
}
