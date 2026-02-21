import { type ActionFunctionArgs, json, redirect } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { getDb } from "~/utils/db.server";
import { sendEmail } from "~/utils/email.server";
import bcrypt from "bcryptjs";

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
  const name = formData.get("name");
  const password = formData.get("password");
  const inviteCode = formData.get("inviteCode");

  if (
    typeof email !== "string" ||
    typeof password !== "string" ||
    typeof inviteCode !== "string"
  ) {
    return json(
      { error: "Email, Password, and Invite Code are required." },
      { status: 400 }
    );
  }

  const db = getDb(context);

  try {
    // 1. Verify Invite Code
    const validCode = await db.inviteCode.findUnique({
      where: { code: inviteCode },
    });

    if (!validCode) {
      return json({ error: "Invalid or expired invite code." }, { status: 400 });
    }

    if (validCode.isUsed) {
      return json({ error: "Invalid or expired invite code." }, { status: 400 });
    }

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Generate Verification Token
    const verificationToken = crypto.randomUUID();

    // 4. Create User and Link Invite Code in one atomic operation
    const updatedCode = await db.inviteCode.update({
      where: { id: validCode.id },
      data: {
        isUsed: true,
        user: {
          create: {
            email,
            name: typeof name === "string" ? name : null,
            password: hashedPassword,
            verificationToken,
            isEmailVerified: false,
          },
        },
      },
      include: {
        user: true,
      },
    });

    if (!updatedCode.user) {
      throw new Error("Failed to create user");
    }

    // 5. Send Verification Email
    const verifyLink = `${new URL(request.url).origin}/verify?token=${verificationToken}`;
    
    // We send email asynchronously but await it here to ensure it works. 
    // In production, might want to use a queue.
    try {
        await sendEmail(context, {
        to: email,
        subject: "Verify your email for ZanTag",
        text: `Welcome to ZanTag! Please verify your email by clicking the following link: ${verifyLink}`,
        html: `<p>Welcome to ZanTag!</p><p>Please verify your email by clicking the following link:</p><a href="${verifyLink}">${verifyLink}</a>`,
        });
    } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
        // We still proceed as the user is created. 
        // User can request resend verification later.
    }

    return redirect(`/verify-sent?email=${email}`);
  } catch (error: unknown) {
    console.error("Signup error:", error);
    if (
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (error as any).code === "P2002"
    ) {
      return json({ error: "Email is already registered." }, { status: 400 });
    }
    return json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
};

export default function Signup() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-xl bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            Start your digital journey
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Enter your invite code to join the community
          </p>
        </div>

        <Form method="post" className="mt-8 space-y-6">
          <div className="-space-y-px rounded-md shadow-sm">
            <div className="mb-4">
              <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                Password
              </label>
              <div className="mt-2">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                Email address
              </label>
              <div className="mt-2">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium leading-6 text-gray-900">
                Full Name <span className="text-gray-400 font-normal">(Optional)</span>
              </label>
              <div className="mt-2">
                <input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="inviteCode" className="block text-sm font-medium leading-6 text-gray-900">
                Invite Code
              </label>
              <div className="mt-2">
                <input
                  id="inviteCode"
                  name="inviteCode"
                  type="text"
                  required
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6 px-3"
                  placeholder="INVITE-CODE-123"
                />
              </div>
            </div>
          </div>

          {actionData?.error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    {actionData.error}
                  </h3>
                </div>
              </div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-70 shadow-sm"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : (
                "Join Now"
              )}
            </button>
          </div>
        </Form>
      </div>
    </div>
  );
}
