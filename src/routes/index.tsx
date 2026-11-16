import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  Ambulance,
  ArrowUpRight,
  CircleCheck,
  MapPin,
  Radio,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";

import { DispatchMap, type DispatchPin } from "@/components/lifeline/DispatchMap";
import { Button } from "@/components/ui/button";
import { estimateArrivalMinutes } from "@/lib/lifeline-simulation";

const kathmandu = { latitude: 27.7172, longitude: 85.324 };
const pins: DispatchPin[] = [
  { latitude: 27.7172, longitude: 85.324, label: "Kathmandu response area", kind: "incident" },
  { latitude: 27.7068, longitude: 85.315, label: "Ambulance · Simulated", kind: "ambulance" },
  { latitude: 27.7286, longitude: 85.332, label: "Hospital · Simulated", kind: "hospital" },
  { latitude: 27.7097, longitude: 85.34, label: "Ambulance · Simulated", kind: "ambulance" },
];

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LifeLine | Emergency Response Dashboard" },
      { name: "description", content: "LifeLine emergency response dashboard with a clearly simulated ambulance dispatch walkthrough." },
      { property: "og:title", content: "LifeLine | Emergency Response Dashboard" },
      { property: "og:description", content: "A simulated emergency response and ambulance dispatch dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const [incidentActive, setIncidentActive] = useState(false);
  const eta = estimateArrivalMinutes(2.4);

  return (
    <main className="lifeline-shell">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <a href="/" className="flex items-center gap-3 text-foreground" aria-label="LifeLine home">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <Activity className="size-5" aria-hidden="true" />
            </span>
            <span>
              <span className="block text-lg font-bold leading-tight">LifeLine</span>
              <span className="block text-xs text-muted-foreground">Emergency response</span>
            </span>
          </a>
          <div className="flex items-center gap-2 rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs font-semibold text-foreground">
            <span className="size-2 rounded-full bg-warning" aria-hidden="true" />
            DEMONSTRATION · SIMULATED SERVICES
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-10">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase text-primary">
              <Radio className="size-4" aria-hidden="true" /> Kathmandu response network
            </p>
            <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Emergency dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Monitor the demo response area and run a practice dispatch without contacting emergency services.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-success">
            <CircleCheck className="size-4" aria-hidden="true" /> Demo network ready
          </div>
        </div>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(18rem,0.9fr)]">
          <section className="overflow-hidden rounded-md border border-border bg-card" aria-labelledby="overview-title">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 id="overview-title" className="font-semibold text-card-foreground">Response overview</h2>
                <p className="mt-1 text-xs text-muted-foreground">Kathmandu · demonstration data</p>
              </div>
              <span className="flex items-center gap-1.5 rounded-sm bg-secondary px-2.5 py-1.5 text-xs font-medium text-secondary-foreground">
                <ShieldCheck className="size-3.5" aria-hidden="true" /> Practice mode
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-border">
              <div className="px-4 py-5 sm:px-5">
                <p className="text-2xl font-bold text-foreground">04</p>
                <p className="mt-1 text-xs text-muted-foreground">Demo ambulances</p>
              </div>
              <div className="px-4 py-5 sm:px-5">
                <p className="text-2xl font-bold text-foreground">03</p>
                <p className="mt-1 text-xs text-muted-foreground">Demo hospitals</p>
              </div>
              <div className="px-4 py-5 sm:px-5">
                <p className="text-2xl font-bold text-foreground">{incidentActive ? "01" : "00"}</p>
                <p className="mt-1 text-xs text-muted-foreground">Practice alerts</p>
              </div>
            </div>
            <div className="border-t border-border p-4 sm:p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-card-foreground">Dispatch area</h3>
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" aria-hidden="true" /> Kathmandu, Nepal
                </span>
              </div>
              <div className="h-64 overflow-hidden rounded-sm border border-border sm:h-72">
                <DispatchMap pins={pins} focus={kathmandu} />
              </div>
              <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground" aria-label="Map legend">
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-emergency" /> Incident area</span>
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-primary" /> Ambulance · demo</span>
                <span className="flex items-center gap-2"><span className="size-2.5 rounded-full bg-success" /> Hospital · demo</span>
              </div>
            </div>
          </section>

          <aside className="flex flex-col gap-5">
            <section className="rounded-md border border-border bg-card p-5" aria-labelledby="sos-title">
              <div className="flex items-start gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-emergency/10 text-emergency">
                  <TriangleAlert className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h2 id="sos-title" className="font-semibold text-card-foreground">Practice dispatch</h2>
                  <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    Start a local-only demonstration. This will not call responders or create a real emergency request.
                  </p>
                </div>
              </div>
              {incidentActive ? (
                <div className="mt-5 rounded-sm border border-warning/40 bg-warning/10 p-4" role="status" aria-live="polite">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <Ambulance className="size-4 text-primary" aria-hidden="true" /> Simulated unit assigned
                      </p>
                      <p className="mt-2 text-sm text-muted-foreground">Demo Unit A-04 · estimated arrival {eta} min</p>
                      <p className="mt-1 text-xs text-muted-foreground">No emergency services have been contacted.</p>
                    </div>
                    <Button variant="ghost" size="icon" aria-label="Clear practice dispatch" onClick={() => setIncidentActive(false)}>
                      <X aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ) : (
                <Button className="mt-5 h-12 w-full bg-emergency text-emergency-foreground hover:bg-emergency/90" onClick={() => setIncidentActive(true)}>
                  <TriangleAlert aria-hidden="true" /> Run SOS simulation
                </Button>
              )}
              <p className="mt-3 text-center text-xs text-muted-foreground">Simulation only · no real dispatch</p>
            </section>

            <section className="rounded-md border border-border bg-card p-5" aria-labelledby="status-title">
              <div className="mb-4 flex items-center justify-between">
                <h2 id="status-title" className="font-semibold text-card-foreground">Network status</h2>
                <ArrowUpRight className="size-4 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex items-center justify-between border-t border-border py-3 text-sm">
                <span className="text-muted-foreground">Ambulance tracking</span>
                <span className="font-medium text-foreground">Simulated</span>
              </div>
              <div className="flex items-center justify-between border-t border-border py-3 text-sm">
                <span className="text-muted-foreground">Hospital notifications</span>
                <span className="font-medium text-foreground">Simulated</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Live GPS connection</span>
                <span className="font-medium text-muted-foreground">Not connected</span>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}