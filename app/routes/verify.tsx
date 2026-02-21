import { json, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Link, useLoaderData } from "@remix-run/react";
import { getDb } from "~/utils/db.server";
import { createUserSession } from "~/utils/session.server";
import { Loader2, XCircle } from "lucide-react";

export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return json({ status: "error", message: "Verification token is missing." });
  }

  const db = getDb(context);

  try {
    const user = await db.user.findFirst({
      where: { verificationToken: token },
    });

    if (!user) {
      return json({ status: "error", message: "Invalid or expired verification token." });
    }

    // Verify user and clear token
    await db.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        verificationToken: null,
      },
    });

    // Automatically log the user in and redirect to setup
    return createUserSession(user.id, "/setup");

  } catch (error) {
    console.error("Verification error:", error);
    return json({ status: "error", message: "An error occurred during verification." });
  }
};

export default function Verify() {
  const data = useLoaderData<typeof loader>();

  if (data.status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center max-w-md w-full">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Verification Failed</h1>
          <p className="text-slate-500 mb-6">{data.message}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Verifying...</h1>
        <p className="text-slate-500">Please wait while we verify your email.</p>
      </div>
    </div>
  );
}
