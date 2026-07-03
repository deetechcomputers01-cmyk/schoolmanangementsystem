/**
 * ResetPasswordScreen — desktop view for the Reset Password page.
 */
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import styles from "./ResetPasswordScreen.module.css";

export function ResetPasswordScreen() {
  return (
    <div className={styles.root}>
      <Card className="w-full max-w-md">
        <h1 className="font-heading text-2xl font-semibold text-navy">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          Enter your account email. An administrator can issue a secure reset link.
        </p>
        <form className="mt-5 grid gap-4">
          <Input label="Email" type="email" />
          <Button type="button">Request reset</Button>
        </form>
      </Card>
    </div>
  );
}