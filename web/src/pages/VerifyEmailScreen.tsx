import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CancerRibbon } from "@/components/CancerRibbon";
import LogoUniversidad from "../assets/logo_ucn.svg?react";
import { apiService } from "@/services/api";

export function VerifyEmailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail: verifyEmailContext } = useAuth();
  
  const [verificationCode, setVerificationCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [email, setEmail] = useState("");
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Get email from navigation state or localStorage
  useEffect(() => {
    const state = location.state as { email?: string } | null;
    const emailFromState = state?.email;
    const emailFromStorage = localStorage.getItem("unverifiedEmail");
    
    const email = emailFromState || emailFromStorage;
    
    if (email) {
      setEmail(email);
      // Limpiar localStorage después de usarlo
      if (emailFromStorage) {
        localStorage.removeItem("unverifiedEmail");
      }
    } else {
      // Si no viene el email, redirigir a login
      navigate("/");
    }
  }, [location, navigate]);

  // Cooldown timer para resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleInputChange = (value: string) => {
    // Solo permitir dígitos, máximo 6 caracteres
    const cleaned = value.replace(/\D/g, "").slice(0, 6);
    setVerificationCode(cleaned);
    
    // Limpiar error cuando el usuario comienza a escribir
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar que tenga 6 dígitos
    if (verificationCode.length !== 6) {
      setError("Por favor ingresa los 6 dígitos del código de verificación.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccessMessage("");

    try {
      // Llamar al endpoint de verificación
      await apiService.verifyEmail(verificationCode);
      
      setSuccessMessage("¡Email verificado exitosamente! Redirigiendo al dashboard...");
      
      // Hacer login automático después de verificar
      try {
        // Obtener credenciales del localStorage (se guardaron en Register)
        const credentials = localStorage.getItem("registerCredentials");
        if (credentials) {
          const { email: registerEmail, password } = JSON.parse(credentials);
          await verifyEmailContext(registerEmail, password);
          
          // Limpiar credenciales guardadas
          localStorage.removeItem("registerCredentials");
          
          // Redirigir después de 1 segundo
          setTimeout(() => {
            navigate("/");
          }, 1000);
        }
      } catch (loginError: any) {
        console.error("Error en login automático:", loginError);
        // Aún así redirigir, el usuario puede hacer login manualmente
        setTimeout(() => {
          navigate("/login");
        }, 1000);
      }
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al verificar el código. Intenta nuevamente.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    setResendLoading(true);
    setError("");

    try {
      // Endpoint para reenviar código (si no existe, usar verificación de recuperación de contraseña)
      await apiService.resendVerificationEmail(email);
      setSuccessMessage("Se envió un nuevo código a tu email. Revisa tu bandeja de entrada.");
      setResendCooldown(60); // 60 segundos de cooldown
    } catch (err: any) {
      const message = err.response?.data?.message || "Error al reenviar el código. Intenta más tarde.";
      setError(message);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* HEADER */}
        <div className="text-center space-y-4">
          {/* LOGOS */}
          <div className="flex items-center justify-center space-x-3">
            <CancerRibbon className="text-[#ff6299]" size="lg" />
            <LogoUniversidad className="w-8 h-8" />
          </div>
          {/* SUBTITULO */}
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900 text-center">
              Verifica tu Email
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Te enviamos un código de 6 dígitos a <strong>{email}</strong>
            </p>
          </div>
        </div>

        {/* VERIFICATION FORM */}
        <Card className="shadow-lg">
        <CardHeader className="flex items-center justify-center">
          <CardTitle>Código de Verificación</CardTitle>
          <CardDescription>Ingresa el código que recibiste por email</CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <Alert className="bg-red-50 border-red-200 text-red-900">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="bg-green-50 border-green-200 text-green-900">
              <AlertDescription>{successMessage}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="verificationCode" className="text-sm font-medium">
                Código de Verificación
              </Label>
              <Input
                id="verificationCode"
                type="text"
                inputMode="numeric"
                placeholder="000000"
                value={verificationCode}
                onChange={(e) => handleInputChange(e.target.value)}
                maxLength={6}
                className="text-center text-2xl tracking-widest font-mono"
                disabled={isLoading}
                autoFocus
              />
              <p className="text-xs text-gray-500 text-center">
                {verificationCode.length}/6 dígitos
              </p>
            </div>

            <Button
              type="submit"
              disabled={isLoading || verificationCode.length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400"
            >
              {isLoading ? "Verificando..." : "Verificar Email"}
            </Button>
          </form>

          <div className="space-y-3 pt-4 border-t">
            <p className="text-sm text-gray-600 text-center">
              ¿No recibiste el código?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={handleResendCode}
              disabled={resendLoading || resendCooldown > 0}
              className="w-full"
            >
              {resendCooldown > 0
                ? `Reenviar en ${resendCooldown}s`
                : resendLoading
                ? "Reenviando..."
                : "Reenviar Código"}
            </Button>
          </div>

          <div className="text-center pt-2">
            <Button
              type="button"
              variant="link"
              onClick={() => navigate("/register")}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Volver al Registro
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        <p>
          Sistema desarrollado para mejorar la atención oncológica.
        </p>
        <p className="mt-1">
          © 2025 Azuralis
        </p>
      </div>
      </div>
    </div>
  );
}
