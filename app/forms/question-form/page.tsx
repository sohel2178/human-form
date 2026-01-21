export const dynamic = "force-dynamic";
export const revalidate = 0;

import FormClient from "./form-client";

export default async function Page({ searchParams }: any) {
  const token = String(searchParams?.token || "").trim();
  const expected = String(process.env.FORM_ACCESS_TOKEN || "").trim();

  const ok = expected && token === expected;

  if (!ok) {
    return (
      <main
        style={{
          maxWidth: 900,
          margin: "30px auto",
          padding: 16,
          fontFamily: "system-ui",
        }}
      >
        <h2>❌ Unauthorized</h2>
        <p>Invalid token.</p>

        {/* DEBUG (temporary) */}
        <pre
          style={{
            marginTop: 16,
            padding: 12,
            background: "#f6f6f6",
            borderRadius: 8,
          }}
        >
          {JSON.stringify(
            {
              tokenExists: !!token,
              expectedExists: !!expected,
              tokenLength: token.length,
              expectedLength: expected.length,
              tokenStart: token.slice(0, 10),
              expectedStart: expected.slice(0, 10),
              tokenEnd: token.slice(-10),
              expectedEnd: expected.slice(-10),
              match: token === expected,
            },
            null,
            2,
          )}
        </pre>
      </main>
    );
  }

  return <FormClient />;
}
