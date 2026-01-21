import FormClient from "./form-client";

export default async function Page({ searchParams }: any) {
  const token = searchParams?.token || "";
  const expected = process.env.FORM_ACCESS_TOKEN || "";

  if (!expected || token !== expected) {
    return (
      <main
        style={{
          maxWidth: 720,
          margin: "30px auto",
          padding: 16,
          fontFamily: "system-ui",
        }}
      >
        <h2>❌ Unauthorized</h2>
        <p>Invalid token.</p>
      </main>
    );
  }

  return <FormClient />;
}
