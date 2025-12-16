import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CancerRibbon } from "../components/CancerRibbon";
import LogoUniversidad from "../assets/logo_ucn.svg?react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Alert, AlertDescription } from "../components/ui/alert";
import { apiService } from "@/services/api";

export function ForgotPasswordScreen() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Por favor ingresa tu correo electrónico");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Por favor ingresa un correo electrónico válido");
      return;
    }

    setIsLoading(true);

    try {
      await apiService.forgotPassword(email.trim());
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 429) {
        setError("Demasiados intentos. Por favor espera unos minutos.");
      } else if (err.response?.status >= 500) {
        setError("Error en el servidor. Por favor intenta más tarde.");
      } else if (err.request) {
        setError("No se pudo conectar con el servidor. Verifica tu conexión.");
      } else {
        setError("Error inesperado. Por favor intenta nuevamente.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-6">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center space-x-3">
              <CancerRibbon className="text-[#ff6299]" size="lg" />
              <LogoUniversidad className="w-12 h-12" />
            </div>
          </div>

          <Card>
            <CardHeader className="flex items-center justify-center">
              <CardTitle>Revisa tu correo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 text-sm">
                  Si el correo está registrado, recibirás un enlace para restablecer tu contraseña.
                  El enlace expira en 15 minutos.
                </AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600 text-center">
                Revisa también tu carpeta de spam si no encuentras el correo.
              </p>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => navigate("/")}
              >
                Volver al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <CancerRibbon className="text-[#ff6299]" size="lg" />
            <LogoUniversidad className="w-12 h-12" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-gray-900 text-center">
              Ficha Médica Portátil
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Universidad Católica del Norte
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="flex items-center justify-center">
            <CardTitle>Recuperar contraseña</CardTitle>
            <CardDescription>
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ficha_medica@gmail.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  disabled={isLoading}
                  className={error ? "border-red-300" : ""}
                />
              </div>

              {error && (
                <Alert className="mt-4 bg-red-50 border-red-200">
                  <AlertDescription className="text-red-800 text-sm">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2 pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  variant="outline"
                  className="w-full bg-[#fa8fb5] hover:bg-[#dd6d94]"
                >
                  {isLoading ? "Enviando..." : "Enviar enlace de recuperación"}
                </Button>
              </div>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/")}
                  className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                  disabled={isLoading}
                >
                  Volver al inicio de sesión
                </button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-gray-500">
          <p>Sistema desarrollado para mejorar la atención oncológica.</p>
          <p className="mt-1">© 2025 Azuralis</p>
        </div>
      </div>
    </div>
  );
}
