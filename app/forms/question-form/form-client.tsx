"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Mode = "text" | "action" | "both";
type ActionType = "demo_video" | "app_screenshot" | "device_photo" | "none";

function titleCase(str: string) {
  return (str || "")
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function FormClient() {
  const sp = useSearchParams();

  // ✅ Query params
  const ticket_id = sp.get("ticketId") || sp.get("ticket_id") || "";
  const sender_id = sp.get("senderId") || sp.get("sender_id") || "";
  const vehicle_type_raw =
    sp.get("vehicleType") || sp.get("vehicle_type") || "any";
  const token = sp.get("token") || "";
  const location_raw = sp.get("location") || "any";
  const question = sp.get("question") || ""; // ✅ NEW

  const vehicle_type = titleCase(vehicle_type_raw);
  const location = titleCase(location_raw);

  // ✅ Form state
  const [mode, setMode] = React.useState<Mode>("text");
  const [actionType, setActionType] = React.useState<ActionType>("none");
  const [answerText, setAnswerText] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const showAction = mode === "action" || mode === "both";
  const showAnswer = mode !== "action";

  const title = `Question from ${location} for ${vehicle_type}`;

  // ✅ Client side auth check (UI only)
  if (!token) {
    return (
      <main className="mx-auto max-w-xl p-8">
        <h2 className="text-2xl font-bold">❌ Unauthorized</h2>
        <p className="text-muted-foreground mt-2">Missing token in URL.</p>
      </main>
    );
  }

  // ✅ submit rules
  const canSubmit =
    !!ticket_id &&
    !!sender_id &&
    !!token &&
    (mode === "text"
      ? answerText.trim().length > 0
      : mode === "action"
        ? actionType !== "none"
        : actionType !== "none" && answerText.trim().length > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (!ticket_id || !sender_id) {
      setMessage({
        type: "error",
        text: "Missing ticket_id or sender_id in URL.",
      });
      return;
    }
    if (mode === "action" && actionType === "none") {
      setMessage({ type: "error", text: "Please select an action type." });
      return;
    }
    if (mode !== "action" && !answerText.trim()) {
      setMessage({ type: "error", text: "Please write an answer." });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticket_id,
          sender_id,
          vehicle_type: vehicle_type_raw,
          location: location_raw,
          question, // ✅ send question too
          mode,
          action_type: showAction ? actionType : "none",
          answer_text: showAnswer ? answerText : "",
          token,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Submit failed");

      setSubmitted(true);
      setMessage({
        type: "success",
        text: "Submitted ✅ User replied + saved to DB.",
      });
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground">
          Human Answer Panel — system will reply user and learn automatically.
        </p>
      </div>

      {/* Ticket Info */}
      <div className="mt-5">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              Ticket Info{" "}
              <Badge variant="secondary">{ticket_id || "N/A"}</Badge>
            </CardTitle>
            <CardDescription>
              Auto-filled from Telegram link query params.
            </CardDescription>
          </CardHeader>

          <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow label="Sender ID" value={sender_id || "—"} />
            <InfoRow label="Vehicle Type" value={vehicle_type} />
            <InfoRow label="District" value={location} />
            <InfoRow
              label="Token"
              value={token ? "✅ Provided" : "❌ Missing"}
            />
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* ✅ Success screen */}
      {submitted ? (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">✅ Submission Completed</CardTitle>
            <CardDescription>You can close this tab now.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>{message?.text || "Done ✅"}</AlertDescription>
            </Alert>

            <Button
              className="rounded-2xl font-bold w-full"
              onClick={() => window.close()}
            >
              Close Tab
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Human Reply</CardTitle>
            <CardDescription>
              Choose mode and submit answer/action.
            </CardDescription>
          </CardHeader>

          <CardContent>
            {/* ✅ show Question inside Human Reply */}
            {question ? (
              <div className="mb-5 rounded-2xl border p-4 bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">
                  Customer Question
                </div>
                <div className="font-semibold leading-relaxed whitespace-pre-wrap">
                  {question}
                </div>
              </div>
            ) : (
              <div className="mb-5 rounded-2xl border p-4 bg-muted/30">
                <div className="text-xs text-muted-foreground mb-1">
                  Customer Question
                </div>
                <div className="font-semibold">—</div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="grid gap-5">
              {/* Mode + Action */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Mode</Label>
                  <Select
                    value={mode}
                    onValueChange={(v) => setMode(v as Mode)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">text</SelectItem>
                      <SelectItem value="action">action</SelectItem>
                      <SelectItem value="both">both</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>
                    Action Type{" "}
                    {showAction ? (
                      <Badge className="ml-2" variant="default">
                        Required
                      </Badge>
                    ) : (
                      <Badge className="ml-2" variant="outline">
                        Optional
                      </Badge>
                    )}
                  </Label>

                  <Select
                    value={actionType}
                    onValueChange={(v) => setActionType(v as ActionType)}
                    disabled={!showAction}
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          showAction
                            ? "Select action"
                            : "Disabled for text mode"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="demo_video">demo_video</SelectItem>
                      <SelectItem value="app_screenshot">
                        app_screenshot
                      </SelectItem>
                      <SelectItem value="device_photo">device_photo</SelectItem>
                      <SelectItem value="none">none</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ✅ Answer hidden for action mode */}
              {showAnswer && (
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea
                    placeholder="Write answer here... (Bangla/English both OK)"
                    value={answerText}
                    onChange={(e) => setAnswerText(e.target.value)}
                    className="min-h-40"
                  />
                </div>
              )}

              {message && (
                <Alert
                  variant={message.type === "error" ? "destructive" : "default"}
                >
                  <AlertTitle>
                    {message.type === "error" ? "Failed" : "Success"}
                  </AlertTitle>
                  <AlertDescription>{message.text}</AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                disabled={!canSubmit || loading}
                className="rounded-2xl font-bold"
              >
                {loading ? "Submitting..." : "Submit Reply"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <footer className="mt-8 text-center text-xs text-muted-foreground">
        Powered by SultanTracker ⚡ Human Form Panel
      </footer>
    </main>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-semibold break-all">{value}</div>
    </div>
  );
}
