"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useRef, useEffect, useCallback } from "react";

interface ClickData {
  x: number;
  y: number;
  element_tag: string;
  is_rage_click: boolean;
  is_dead_click: boolean;
  viewport_width: number;
  viewport_height: number;
}

interface HeatmapViewProps {
  siteId: string;
  paths: string[];
  activePath: string;
  clicks: ClickData[];
  days: number;
}

export function HeatmapView({
  siteId,
  paths,
  activePath,
  clicks,
  days,
}: HeatmapViewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (params: Record<string, string>) => {
      const sp = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(params)) {
        sp.set(key, value);
      }
      return sp.toString();
    },
    [searchParams]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (clicks.length === 0) return;

    const maxVw = Math.max(...clicks.map((c) => c.viewport_width), 1920);
    const maxVh = Math.max(...clicks.map((c) => c.viewport_height), 1080);

    const scaleX = rect.width / maxVw;
    const scaleY = rect.height / maxVh;

    const heatmapData: number[][] = [];
    const gridSize = 10;
    const cols = Math.ceil(rect.width / gridSize);
    const rows = Math.ceil(rect.height / gridSize);

    for (let i = 0; i < rows; i++) {
      heatmapData[i] = new Array(cols).fill(0);
    }

    for (const click of clicks) {
      const cx = Math.round(click.x * scaleX);
      const cy = Math.round(click.y * scaleY);
      const radius = 30;

      for (
        let y = Math.max(0, cy - radius);
        y < Math.min(rect.height, cy + radius);
        y += gridSize
      ) {
        for (
          let x = Math.max(0, cx - radius);
          x < Math.min(rect.width, cx + radius);
          x += gridSize
        ) {
          const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
          if (dist < radius) {
            const intensity = 1 - dist / radius;
            const row = Math.floor(y / gridSize);
            const col = Math.floor(x / gridSize);
            if (row >= 0 && row < rows && col >= 0 && col < cols) {
              heatmapData[row][col] += intensity;
            }
          }
        }
      }
    }

    let maxVal = 0;
    for (const row of heatmapData) {
      for (const val of row) {
        if (val > maxVal) maxVal = val;
      }
    }

    if (maxVal === 0) return;

    const imageData = ctx.createImageData(rect.width, rect.height);

    for (let y = 0; y < rect.height; y++) {
      for (let x = 0; x < rect.width; x++) {
        const row = Math.floor(y / gridSize);
        const col = Math.floor(x / gridSize);
        const val =
          (heatmapData[row]?.[col] || 0) / maxVal;

        let r = 0,
          g = 0,
          b = 0,
          a = 0;

        if (val > 0) {
          a = Math.min(255, Math.round(val * 200));

          if (val < 0.25) {
            const t = val / 0.25;
            r = 0;
            g = Math.round(t * 100);
            b = Math.round(200 + t * 55);
          } else if (val < 0.5) {
            const t = (val - 0.25) / 0.25;
            r = 0;
            g = Math.round(100 + t * 155);
            b = Math.round(255 - t * 155);
          } else if (val < 0.75) {
            const t = (val - 0.5) / 0.25;
            r = Math.round(t * 255);
            g = 255;
            b = 0;
          } else {
            const t = (val - 0.75) / 0.25;
            r = 255;
            g = Math.round(255 - t * 255);
            b = 0;
          }
        }

        const idx = (y * rect.width + x) * 4;
        imageData.data[idx] = r;
        imageData.data[idx + 1] = g;
        imageData.data[idx + 2] = b;
        imageData.data[idx + 3] = a;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [clicks]);

  const rageClicks = clicks.filter((c) => c.is_rage_click);
  const deadClicks = clicks.filter((c) => c.is_dead_click);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <Select
          value={activePath}
          onValueChange={(value) => {
            router.push(`${pathname}?${createQueryString({ path: value })}`);
          }}
        >
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a page" />
          </SelectTrigger>
          <SelectContent>
            {paths.map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {[7, 30].map((d) => (
            <Button
              key={d}
              variant={days === d ? "default" : "outline"}
              size="sm"
              onClick={() => {
                router.push(
                  `${pathname}?${createQueryString({ days: d.toString() })}`
                );
              }}
            >
              {d} days
            </Button>
          ))}
        </div>

        <div className="flex gap-2 ml-auto">
          <Badge variant="outline">{clicks.length} clicks</Badge>
          {rageClicks.length > 0 && (
            <Badge variant="destructive">
              {rageClicks.length} rage clicks
            </Badge>
          )}
          {deadClicks.length > 0 && (
            <Badge variant="secondary" className="bg-orange-100 text-orange-700">
              {deadClicks.length} dead clicks
            </Badge>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Click Heatmap</CardTitle>
          <CardDescription>
            Blue = few clicks, Red = many clicks
          </CardDescription>
        </CardHeader>
        <CardContent>
          {clicks.length === 0 ? (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No click data for this page yet
            </div>
          ) : (
            <div className="relative rounded-lg border overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full"
                style={{ height: "500px" }}
              />
              <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-background/90 rounded px-3 py-2 text-xs">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  Low
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  Medium
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  High
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  Hot
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
