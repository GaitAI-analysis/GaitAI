/**
 * Account screens: sign in, create account, reset password. Email and
 * password go to Firebase Authentication; GaitAI's servers only ever see the
 * resulting ID token. The visual language is the subscription layer's: deep
 * navy, warm off-white, restrained gold.
 */
import React, { useState } from "react";
import { Image, Linking, View, type ImageSourcePropType } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { AuthError, PRIVACY_URL, TERMS_URL } from "@gaitai/api";
import { productMeta, space } from "@gaitai/design-system";
import { useApp } from "../app-state";
import { Button, Card, Row, Screen, Text, TextField } from "../primitives";
import { useTheme } from "../theme";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const problem = (e: unknown) => (e instanceof AuthError ? e.message : e instanceof Error ? e.message : "Something went wrong. Try again.");

function Brand({ mark, title, sub }: { mark?: ImageSourcePropType; title: string; sub: string }) {
  const t = useTheme(); const app = useApp();
  return (
    <View style={{ gap: space.md }}>
      <Row gap={10}>{mark ? <Image source={mark} style={{ width: 36, height: 36, borderRadius: 10 }} accessibilityIgnoresInvertColors /> : null}<Text variant="label" color={t.gold}>{productMeta[app.product].name.toUpperCase()}</Text></Row>
      <Text variant="title">{title}</Text>
      <Text variant="lead">{sub}</Text>
    </View>
  );
}

function LegalLine() {
  return (
    <Row style={{ justifyContent: "center", flexWrap: "wrap" }} gap={space.lg}>
      <Button kind="ghost" label="Privacy policy" onPress={() => Linking.openURL(PRIVACY_URL)} style={{ minHeight: 40 }} />
      <Button kind="ghost" label="Terms" onPress={() => Linking.openURL(TERMS_URL)} style={{ minHeight: 40 }} />
    </Row>
  );
}

export function SignInScreen({ mark }: { mark?: ImageSourcePropType }) {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null);
  const canSubmit = EMAIL_RE.test(email.trim()) && password.length >= 6 && !busy;
  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true); setError(null);
    try { await app.auth.signIn(email, password); router.replace("/(tabs)" as never); }
    catch (e) { setError(problem(e)); }
    finally { setBusy(false); }
  };
  return (
    <Screen footer={<View style={{ gap: space.sm }}><Button label="Sign in" onPress={submit} disabled={!canSubmit} loading={busy} /><Button kind="ghost" label="Create an account" onPress={() => router.push("/auth/register" as never)} /></View>}>
      <View style={{ paddingTop: insets.top + space.xl, gap: space.xl }}>
        <Brand mark={mark} title="Sign in to GaitAI." sub="Your subscription belongs to your account, so signing in on any phone restores it." />
        <Card style={{ gap: space.md }}>
          <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" returnKeyType="next" />
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="password" textContentType="password" returnKeyType="go" onSubmitEditing={submit} />
          {error ? <Text color={t.danger} accessibilityRole="alert">{error}</Text> : null}
          <Button kind="ghost" label="Forgotten your password?" onPress={() => router.push({ pathname: "/auth/forgot", params: { email } } as never)} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }} />
        </Card>
        <LegalLine />
      </View>
    </Screen>
  );
}

export function RegisterScreen({ mark }: { mark?: ImageSourcePropType }) {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false); const [error, setError] = useState<string | null>(null); const [done, setDone] = useState(false);
  const strong = password.length >= 8;
  const canSubmit = EMAIL_RE.test(email.trim()) && strong && password === confirm && !busy;
  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true); setError(null);
    try { await app.auth.signUp(email, password); setDone(true); }
    catch (e) { setError(problem(e)); }
    finally { setBusy(false); }
  };
  if (done) {
    return (
      <Screen footer={<Button label="Continue" onPress={() => router.replace("/(tabs)" as never)} />}>
        <View style={{ paddingTop: insets.top + space.xl, gap: space.xl }}>
          <Brand mark={mark} title="Check your inbox." sub={`We sent a verification link to ${email.trim()}. Verify your email to subscribe; you can sign in and look around meanwhile.`} />
          <Card tone="flat"><Text variant="mute">Did not get it? Open Profile → Account → Resend verification. Check spam, too.</Text></Card>
        </View>
      </Screen>
    );
  }
  return (
    <Screen footer={<View style={{ gap: space.sm }}><Button label="Create account" onPress={submit} disabled={!canSubmit} loading={busy} /><Button kind="ghost" label="I already have an account" onPress={() => router.replace("/auth/sign-in" as never)} /></View>}>
      <View style={{ paddingTop: insets.top + space.xl, gap: space.xl }}>
        <Brand mark={mark} title="Create your GaitAI account." sub="One account for your subscription, your history and reinstalls." />
        <Card style={{ gap: space.md }}>
          <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" textContentType="emailAddress" />
          <TextField label="Password" value={password} onChangeText={setPassword} secureTextEntry autoComplete="new-password" textContentType="newPassword" hint="At least 8 characters." />
          <TextField label="Confirm password" value={confirm} onChangeText={setConfirm} secureTextEntry autoComplete="new-password" error={confirm && confirm !== password ? "Passwords do not match." : undefined} onSubmitEditing={submit} />
          {error ? <Text color={t.danger} accessibilityRole="alert">{error}</Text> : null}
        </Card>
        <Text variant="mute">By creating an account you agree to the GaitAI terms and privacy policy. Your email and subscription records are kept by GaitAI; videos and measurements never leave this phone.</Text>
        <LegalLine />
      </View>
    </Screen>
  );
}

export function ForgotPasswordScreen({ initialEmail = "" }: { initialEmail?: string }) {
  const t = useTheme(); const app = useApp(); const router = useRouter(); const insets = useSafeAreaInsets();
  const [email, setEmail] = useState(initialEmail); const [busy, setBusy] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState<string | null>(null);
  const submit = async () => {
    if (!EMAIL_RE.test(email.trim()) || busy) return;
    setBusy(true); setError(null);
    try { await app.auth.resetPassword(email); setSent(true); } catch (e) { setError(problem(e)); } finally { setBusy(false); }
  };
  return (
    <Screen footer={sent ? <Button label="Back to sign in" onPress={() => router.replace("/auth/sign-in" as never)} /> : <Button label="Send reset link" onPress={submit} disabled={!EMAIL_RE.test(email.trim()) || busy} loading={busy} />}>
      <View style={{ paddingTop: insets.top + space.xl, gap: space.xl }}>
        <Brand title="Reset your password." sub={sent ? `If an account exists for ${email.trim()}, a reset link is on its way.` : "Enter the email you signed up with. We will send a link to choose a new password."} />
        {!sent ? <Card style={{ gap: space.md }}><TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" autoComplete="email" keyboardType="email-address" onSubmitEditing={submit} />{error ? <Text color={t.danger}>{error}</Text> : null}</Card> : null}
      </View>
    </Screen>
  );
}
