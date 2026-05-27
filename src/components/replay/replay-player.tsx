"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  SkipForward,
  AlertTriangle,
  MousePointer,
} from "lucide-react";

interface ReplayClick {
  x: number;
  y: number;
  element_tag: string;
  element_text: string;
  is_rage_click: boolean;
  is_dead_click: boolean;
  timestamp: string;
}

interface ReplayScroll {
  scroll_depth_percent: number;
  timestamp: string;
}

interface PageViewData {
  id: string;
  url: string;
  path: string;
  started_at: string;
  ended_at: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
  clicks: ReplayClick[];
  scrolls: ReplayScroll[];
}

interface SessionData {
  id: string;
  visitor_id: string;
  started_at: string;
  ended_at: string | null;
  device_type: string | null;
  viewport_width: number | null;
  viewport_height: number | null;
}

interface ReplayPlayerProps {
  session: SessionData;
  pageViews: PageViewData[];
}

interface TimelineEvent {
  time: number;
  type: "click" | "scroll" | "pageview";
  data: ReplayClick | ReplayScroll | PageViewData;
  pageViewIndex: number;
}

export function ReplayPlayer({ session, pageViews }: ReplayPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [activePageView, setActivePageView] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number | null>(null);
  const lastFrameRef = useRef<number>(0);

  const startTime = new Date(session.started_at).getTime();
  const endTime = session.ended_at
    ? new Date(session.ended_at).getTime()
    : startTime + 60000;
  const totalDuration = endTime - startTime;

  const allEvents: TimelineEvent[] = [];

  pageViews.forEach((pv, pvIdx) => {
    const pvStart = new Date(pv.started_at).getTime() - startTime;

    allEvents.push({
      time: pvStart,
      type: "pageview",
      data: pv,
      pageViewIndex: pvIdx,
    });

    pv.clicks.forEach((click) => {
      allEvents.push({
        time: new Date(click.timestamp).getTime() - startTime,
        type: "click",
        data: click,
        pageViewIndex: pvIdx,
      });
    });

    pv.scrolls.forEach((scroll) => {
      allEvents.push({
        time: new Date(scroll.timestamp).getTime() - startTime,
        type: "scroll",
        data: scroll,
        pageViewIndex: pvIdx,
      });
    });
  });

  allEvents.sort((a, b) => a.time - b.time);

  const drawCanvas = useCallback(
    (time: number) => {
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

      let currentPvIdx = 0;
      for (let i = allEvents.length - 1; i >= 0; i--) {
        if (allEvents[i].type === "pageview" && allEvents[i].time <= time) {
          currentPvIdx = allEvents[i].pageViewIndex;
          break;
        }
      }

      const currentPv = pageViews[currentPvIdx];
      if (!currentPv) return;

      const vw = currentPv.viewport_width || 1920;
      const vh = currentPv.viewport_height || 1080;
      const scaleX = rect.width / vw;
      const scaleY = rect.height / vh;

      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.strokeStyle = "#e2e8f0";
      ctx.lineWidth = 1;
      for (let y = 40; y < rect.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(rect.width, y);
        ctx.stroke();
      }

      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px sans-serif";
      ctx.fillText(`Page: ${currentPv.path}`, 10, 20);
      ctx.fillText(
        `Viewport: ${vw}×${vh}`,
        rect.width - 150,
        20
      );

      const visibleClicks = currentPv.clicks.filter(
        (c) =>
          new Date(c.timestamp).getTime() - startTime <= time
      );

      for (const click of visibleClicks) {
        const cx = click.x * scaleX;
        const cy = click.y * scaleY;

        const isRecent =
          time - (new Date(click.timestamp).getTime() - startTime) < 2000;

        if (click.is_rage_click) {
          ctx.beginPath();
          ctx.arc(cx, cy, isRecent ? 16 : 10, 0, Math.PI * 2);
          ctx.fillStyle = isRecent
            ? "rgba(239, 68, 68, 0.6)"
            : "rgba(239, 68, 68, 0.3)";
          ctx.fill();
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else if (click.is_dead_click) {
          ctx.beginPath();
          ctx.arc(cx, cy, isRecent ? 14 : 8, 0, Math.PI * 2);
          ctx.fillStyle = isRecent
            ? "rgba(249, 115, 22, 0.6)"
            : "rgba(249, 115, 22, 0.3)";
          ctx.fill();
          ctx.strokeStyle = "#f97316";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(cx, cy, isRecent ? 12 : 6, 0, Math.PI * 2);
          ctx.fillStyle = isRecent
            ? "rgba(59, 130, 246, 0.6)"
            : "rgba(59, 130, 246, 0.3)";
          ctx.fill();
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        if (isRecent) {
          ctx.beginPath();
          ctx.arc(cx, cy, 20, 0, Math.PI * 2);
          ctx.strokeStyle = click.is_rage_click
            ? "rgba(239, 68, 68, 0.4)"
            : click.is_dead_click
              ? "rgba(249, 115, 22, 0.4)"
              : "rgba(59, 130, 246, 0.4)";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      const scrollEvents = currentPv.scrolls.filter(
        (s) => new Date(s.timestamp).getTime() - startTime <= time
      );
      const maxScroll =
        scrollEvents.length > 0
          ? Math.max(...scrollEvents.map((s) => s.scroll_depth_percent))
          : 0;

      if (maxScroll > 0) {
        const scrollBarHeight = rect.height * (maxScroll / 100);
        ctx.fillStyle = "rgba(34, 197, 94, 0.15)";
        ctx.fillRect(rect.width - 8, 0, 8, scrollBarHeight);
        ctx.fillStyle = "rgba(34, 197, 94, 0.8)";
        ctx.fillRect(rect.width - 8, scrollBarHeight - 4, 8, 4);
      }
    },
    [allEvents, pageViews, startTime]
  );

  useEffect(() => {
    drawCanvas(currentTime);
  }, [currentTime, drawCanvas]);

  useEffect(() => {
    if (!playing) {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    lastFrameRef.current = performance.now();

    const animate = (now: number) => {
      const delta = now - lastFrameRef.current;
      lastFrameRef.current = now;

      setCurrentTime((prev) => {
        const next = prev + delta * speed;
        if (next >= totalDuration) {
          setPlaying(false);
          return totalDuration;
        }
        return next;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [playing, speed, totalDuration]);

  const progress = totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const currentEvents = allEvents.filter(
    (e) => Math.abs(e.time - currentTime) < 500
  );
  const recentClick = currentEvents.find((e) => e.type === "click")
    ?.data as ReplayClick | undefined;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{pageViews.length}</p>
            <p className="text-xs text-muted-foreground">Pages</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">
              {pageViews.reduce((sum, pv) => sum + pv.clicks.length, 0)}
            </p>
            <p className="text-xs text-muted-foreground">Clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">
              {pageViews.reduce(
                (sum, pv) =>
                  sum + pv.clicks.filter((c) => c.is_rage_click).length,
                0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Rage Clicks</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-orange-500">
              {pageViews.reduce(
                (sum, pv) =>
                  sum + pv.clicks.filter((c) => c.is_dead_click).length,
                0
              )}
            </p>
            <p className="text-xs text-muted-foreground">Dead Clicks</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Replay</CardTitle>
            <div className="flex items-center gap-2">
              {recentClick && (
                <Badge
                  variant={
                    recentClick.is_rage_click
                      ? "destructive"
                      : recentClick.is_dead_click
                        ? "secondary"
                        : "default"
                  }
                >
                  {recentClick.is_rage_click && (
                    <AlertTriangle className="h-3 w-3 mr-1" />
                  )}
                  {recentClick.is_dead_click && (
                    <MousePointer className="h-3 w-3 mr-1" />
                  )}
                  {recentClick.element_tag}
                  {recentClick.element_text
                    ? `: "${recentClick.element_text.slice(0, 30)}"`
                    : ""}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <canvas
            ref={canvasRef}
            className="w-full rounded-lg border"
            style={{ height: "400px" }}
          />

          <div className="space-y-2">
            <div
              className="relative h-2 bg-muted rounded-full cursor-pointer"
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const pct = (e.clientX - rect.left) / rect.width;
                setCurrentTime(pct * totalDuration);
              }}
            >
              <div
                className="absolute h-full bg-primary rounded-full"
                style={{ width: `${progress}%` }}
              />
              {allEvents.map((event, i) => {
                const pos = (event.time / totalDuration) * 100;
                const color =
                  event.type === "click"
                    ? (event.data as ReplayClick).is_rage_click
                      ? "bg-red-500"
                      : (event.data as ReplayClick).is_dead_click
                        ? "bg-orange-500"
                        : "bg-blue-500"
                    : event.type === "pageview"
                      ? "bg-green-500"
                      : "bg-gray-400";
                return (
                  <div
                    key={i}
                    className={`absolute w-1.5 h-1.5 rounded-full ${color} -top-px`}
                    style={{ left: `${pos}%` }}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPlaying(!playing)}
                >
                  {playing ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentTime(Math.min(currentTime + 5000, totalDuration))
                  }
                >
                  <SkipForward className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(totalDuration)}
                </span>
              </div>
              <div className="flex gap-1">
                {[1, 2, 4].map((s) => (
                  <Button
                    key={s}
                    variant={speed === s ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSpeed(s)}
                    className="px-2"
                  >
                    {s}x
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Page Views</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {pageViews.map((pv, i) => (
              <div
                key={pv.id}
                className={`flex items-center justify-between rounded-lg border p-3 ${
                  i === activePageView ? "border-primary" : ""
                }`}
              >
                <div>
                  <p className="text-sm font-mono">{pv.path}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(pv.started_at).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>{pv.clicks.length} clicks</span>
                  {pv.clicks.some((c) => c.is_rage_click) && (
                    <Badge variant="destructive" className="text-xs">
                      rage
                    </Badge>
                  )}
                  {pv.clicks.some((c) => c.is_dead_click) && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-orange-100 text-orange-700"
                    >
                      dead
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
