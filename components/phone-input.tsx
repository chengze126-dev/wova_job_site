"use client";

import { useMemo, useState } from "react";
import { COUNTRY_META, countryMeta, parsePhoneParts } from "@/lib/geo";

const fieldClass =
  "w-full rounded-xl border border-line bg-paper px-3 py-2 text-sm text-ink placeholder:text-muted";

export function PhoneInput({
  name = "phone",
  defaultPhone,
  defaultCountry,
  required,
}: {
  name?: string;
  defaultPhone?: string | null;
  defaultCountry?: string | null;
  required?: boolean;
}) {
  const initial = parsePhoneParts(defaultPhone);
  const start = defaultPhone ? initial : countryMeta(defaultCountry);
  const [country, setCountry] = useState(defaultPhone ? initial.country : start.name);
  const [national, setNational] = useState(initial.national);
  const meta = useMemo(() => countryMeta(country), [country]);
  const value = national ? `${meta.dial} ${national}` : "";

  return (
    <label className="block text-sm">
      Phone number {required ? <span className="text-copper-dark">*</span> : null}
      <span className="mt-1 grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-2 sm:grid-cols-[220px_1fr]">
        <select
          value={country}
          onChange={(event) => {
            setCountry(event.target.value);
          }}
          className={fieldClass}
          aria-label="Country calling code"
        >
          {COUNTRY_META.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name} {item.dial}
            </option>
          ))}
        </select>
        <input
          inputMode="tel"
          autoComplete="tel-national"
          required={required}
          placeholder="Phone number"
          value={national}
          onChange={(event) => setNational(event.target.value.replace(/[^\d]/g, ""))}
          className={fieldClass}
        />
      </span>
      <input type="hidden" name={name} value={value} />
      <span className="mt-1 block text-[12px] text-muted">
        Hint: {meta.name} numbers use {meta.dial}. Saved as {value || `${meta.dial} …`}.
      </span>
    </label>
  );
}
