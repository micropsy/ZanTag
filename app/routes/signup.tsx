import { type ActionFunctionArgs, json, redirect, type LoaderFunctionArgs } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation, Link, useSearchParams } from "@remix-run/react";
import { getDb } from "~/utils/db.server";
import { sendEmail } from "~/utils/email.server";
import { getUserId } from "~/utils/session.server";
import { hash } from "bcrypt-ts";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const userId = await getUserId(request);
  if (userId) return redirect("/dashboard");
  return json({});
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const email = formData.get("email");
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
      return json({ error: "Invalid invite code." }, { status: 400 });
    }

    if (validCode.isUsed) {
      return json({ error: "Invite code has already been used." }, { status: 400 });
    }

    // 2. Hash Password
    const hashedPassword = await hash(password, 10);

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
    console.log("Verification Link:", verifyLink);
    
    try {
        await sendEmail(context, {
        to: email,
        subject: "Verify your email for ZanTag",
        text: `Welcome to ZanTag! Please verify your email by clicking the following link: ${verifyLink}`,
        html: `<p>Welcome to ZanTag!</p><p>Please verify your email by clicking the following link:</p><a href="${verifyLink}">${verifyLink}</a>`,
        });
    } catch (emailError) {
        console.error("Failed to send verification email:", emailError);
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
  const [searchParams] = useSearchParams();
  const defaultInviteCode = searchParams.get("code") || "";

  useEffect(() => {
    if (actionData?.error) {
      toast.error(actionData.error);
    }
  }, [actionData]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-[#0F172A] via-[#0F172A] to-[#06B6D4]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="w-full max-w-sm md:max-w-md"
      >
        <Card className="w-full border-none shadow-2xl bg-white/95 backdrop-blur-xl sm:p-2">
          <CardHeader className="space-y-4 text-center">
            <div className="flex justify-center">
              <img src="/logo.png" alt="ZanTag" width={48} height={48} className="rounded-lg" />
            </div>
            <CardTitle className="text-3xl font-extrabold tracking-tight text-slate-900">
              Start your digital journey
            </CardTitle>
            <CardDescription className="text-slate-500">
              Enter your email, password, and invitation code to get started
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form method="post" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <motion.div whileFocus={{ scale: 1.01 }} whileHover={{ scale: 1.005 }}>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    required
                    className="transition-all h-11 text-base"
                  />
                </motion.div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <motion.div whileFocus={{ scale: 1.01 }} whileHover={{ scale: 1.005 }}>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="transition-all h-11 text-base"
                  />
                </motion.div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invitation Code</Label>
                <motion.div whileFocus={{ scale: 1.01 }} whileHover={{ scale: 1.005 }}>
                  <Input
                    id="inviteCode"
                    name="inviteCode"
                    type="text"
                    placeholder="ENTER-CODE-HERE"
                    defaultValue={defaultInviteCode}
                    required
                    className="transition-all h-11 text-base uppercase tracking-wider"
                  />
                </motion.div>
              </div>

              {actionData?.error && (
                <div className="text-red-500 text-sm font-medium text-center">
                  {actionData.error}
                </div>
              )}

              <Button 
                type="submit" 
                className="w-full bg-[#06B6D4] hover:bg-[#0891B2] h-11 text-base font-medium"
                disabled={isSubmitting}
              >
                <motion.div className="flex items-center justify-center w-full" whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Account
                </motion.div>
              </Button>

              <div className="text-center text-sm text-slate-500 mt-4">
                Already have an account?{" "}
                <Link to="/login" className="text-[#06B6D4] hover:underline font-medium">
                  Log in
                </Link>
              </div>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
