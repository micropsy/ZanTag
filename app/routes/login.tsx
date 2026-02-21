import { json, type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/cloudflare";
import { Form, useActionData, useNavigation } from "@remix-run/react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { getDb } from "~/utils/db.server";
import { createUserSession, getUserId } from "~/utils/session.server";
import { compare } from "bcrypt-ts";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { useEffect } from "react";
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

  if (typeof email !== "string" || typeof password !== "string") {
    return json({ error: "Invalid form data" }, { status: 400 });
  }

  const db = getDb(context);
  const user = await db.user.findUnique({ where: { email } });

  if (!user || !(await compare(password, user.password))) {
    return json({ error: "Invalid email or password" }, { status: 400 });
  }

  return createUserSession(user.id, "/dashboard");
};

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === "submitting";

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
              Welcome back
            </CardTitle>
            <CardDescription className="text-slate-500">
              Enter your email to sign in to your account
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
                  Sign In
                </motion.div>
              </Button>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
