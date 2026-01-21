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

  const token = sp.get("token") || "";

  // ✅ UI protection
  if (!token) {
    return (
      <main className="mx-auto max-w-xl p-10">
        <h2 className="text-2xl font-bold">❌ Unauthorized</h2>
        <p className="text-muted-foreground">Missing token.</p>
      </main>
    );
  }

  // Query params
  const ticket_id = sp.get("ticket_id") || "";
  const sender_id = sp.get("sender_id") || "";
  const vehicle_type_raw = sp.get("vehicle_type") || "any";
  const location_raw = sp.get("location") || "any";

  const vehicle_type = titleCase(vehicle_type_raw);
  const location = titleCase(location_raw);

  const [mode, setMode] = React.useState<Mode>("text");
  const [actionType, setActionType] = React.useState<ActionType>("none");
  const [answerText, setAnswerText] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [message, setMessage] = React.useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // ✅ if true → hide form and show success card
  const [submitted, setSubmitted] = React.useState(false);

  const showAction = mode === "action" || mode === "both";
  const showAnswer = mode !== "action"; // ✅ Hide answer in action mode

  const title = `Question from ${location} for ${vehicle_type}`;

  // ✅ validation logic updated for hide-answer rules
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

    if (!ticket_id || !sender_id || !token) {
      setMessage({
        type: "error",
        text: "Missing required parameters in URL (ticket_id / sender_id / token).",
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
          mode,
          action_type: showAction ? actionType : "none",
          answer_text: showAnswer ? answerText : "",
          token,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Submit failed");

      // ✅ Show success screen and hide form
      setSubmitted(true);
      setMessage({
        type: "success",
        text: "Submitted successfully ✅ User has been replied & saved to DB.",
      });

      // cleanup local state (optional)
      setAnswerText("");
      setActionType("none");
      setMode("text");
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
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {title}
        </h1>
        <p className="text-muted-foreground">
          Human Answer Panel — choose mode, send action/text, and system will
          learn automatically.
        </p>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2">
              Ticket Info
              <Badge variant="secondary">{ticket_id || "N/A"}</Badge>
            </CardTitle>
            <CardDescription>
              Open this page only from Telegram link. Don’t change ticket
              manually 😄
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

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Quick Rules</CardTitle>
            <CardDescription>Mode behavior</CardDescription>
          </CardHeader>
          <CardContent className="text-sm space-y-2">
            <p>
              • <b>text</b> → send answer only
            </p>
            <p>
              • <b>action</b> → send media only
            </p>
            <p>
              • <b>both</b> → media first, then answer
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator className="my-6" />

      {/* ✅ SUCCESS SCREEN */}
      {submitted ? (
        <Card className="border-2">
          <CardHeader>
            <CardTitle className="text-xl">✅ Submission Completed</CardTitle>
            <CardDescription>
              This ticket is processed successfully. You can close this tab now.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTitle>Success</AlertTitle>
              <AlertDescription>
                The user has been replied and the answer has been saved to
                MongoDB knowledge base.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <InfoRow label="Ticket ID" value={ticket_id} />
              <InfoRow label="Mode" value={mode} />
              <InfoRow label="Action Type" value={actionType} />
              <InfoRow label="District" value={location} />
            </div>

            <Button
              className="rounded-2xl font-bold w-full"
              onClick={() => window.close()}
            >
              Close Tab
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              If tab doesn’t close automatically, you can close it manually.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Human Reply</CardTitle>
            <CardDescription>
              Select reply mode and submit answer/action.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="grid gap-5">
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
                  {!showAction && (
                    <p className="text-xs text-muted-foreground">
                      For <b>text</b> mode action is disabled.
                    </p>
                  )}
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
                    className="min-h-[160px]"
                  />
                  <p className="text-xs text-muted-foreground">
                    For <b>both</b> mode: action will be sent first, then
                    answer.
                  </p>
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

              <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                <Button
                  type="submit"
                  disabled={!canSubmit || loading}
                  className="rounded-2xl font-bold"
                >
                  {loading ? "Submitting..." : "Submit Reply"}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Tip: Action mode will hide answer field automatically ✅
                </p>
              </div>
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
