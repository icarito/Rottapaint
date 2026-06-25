import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { useRouter, type Href } from "expo-router";
import { setToken, getApiBase, setApiBase } from "@/api/client";

export default function AuthScreen() {
  const router = useRouter();
  const [token, setTokenValue] = useState("");
  const [base, setBaseValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      const stored = await getApiBase();
      setBaseValue(stored);
    })();
  }, []);

  const handleSubmit = async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      setError("Token is required");
      return;
    }
    try {
      await setToken(trimmed);
      if (base.trim()) {
        await setApiBase(base.trim());
      }
      router.replace("/(tabs)" as Href);
    } catch (e) {
      setError("Failed to save");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>Odisea</Text>
        <Text style={styles.subtitle}>Dashboard Authentication</Text>
        <Text style={styles.label}>API Base</Text>
        <TextInput
          style={styles.input}
          placeholder="https://odisea.educa.juegos"
          placeholderTextColor="#506070"
          value={base}
          onChangeText={setBaseValue}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={styles.label}>Bearer Token</Text>
        <TextInput
          style={styles.input}
          placeholder="odisea-dev-insecure"
          placeholderTextColor="#506070"
          value={token}
          onChangeText={setTokenValue}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0E14",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    backgroundColor: "#131822",
    borderRadius: 12,
    padding: 28,
    borderWidth: 1,
    borderColor: "#1E2A3A",
  },
  title: { color: "#E0E0E0", fontSize: 32, fontWeight: "800", textAlign: "center" },
  subtitle: {
    color: "#607589",
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  label: {
    color: "#8090A0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#1E2A3A",
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: "#E0E0E0",
    fontSize: 15,
    marginBottom: 14,
  },
  error: { color: "#FF5252", fontSize: 12, marginBottom: 8 },
  button: {
    backgroundColor: "#4FC3F7",
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: { color: "#0A0E14", fontSize: 16, fontWeight: "700" },
});
