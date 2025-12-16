import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
import { Eye, EyeOff } from "lucide-react";
import { apiService } from "@/services/api";

export function ResetPasswordScreen() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  
  const tokenRef = useRef<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tokenFromUrl) {
      tokenRef.current = tokenFromUrl;
      navigate("/reset-password", { replace: true });
    } else if (!tokenRef.current) {
      setError("Token de recuperación no válido o faltante.");
    }
  }, [tokenFromUrl, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const token = tokenRef.current;
    if (!token) {
      setError("Token de recuperación no válido.");
      return;
    }

    if (!password) {
      setError("Por favor ingresa una nueva contraseña");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setIsLoading(true);

    try {
      await apiService.resetPassword(token, password);
      setSuccess(true);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("El enlace ha expirado o no es válido. Solicita uno nuevo.");
      } else if (err.response?.status === 429) {
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
              <CardTitle>Contraseña actualizada</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 text-sm">
                  Tu contraseña ha sido restablecida correctamente.
                </AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="outline"
                className="w-full bg-[#fa8fb5] hover:bg-[#dd6d94]"
                onClick={() => navigate("/")}
              >
                Iniciar sesión
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
            <CardTitle>Nueva contraseña</CardTitle>
            <CardDescription>
              Ingresa tu nueva contraseña para restablecer el acceso a tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="password">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isLoading || !tokenRef.current}
                    className={error ? "border-red-300" : ""}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800"
                  >
                    {showPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2 pt-4">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (error) setError("");
                    }}
                    disabled={isLoading || !tokenRef.current}
                    className={error ? "border-red-300" : ""}
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                    onClick={() => setShowConfirmPassword((s) => !s)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-600 hover:text-gray-800"
                  >
                    {showConfirmPassword ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
                  </button>
                </div>
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
                  disabled={isLoading || !tokenRef.current}
                  variant="outline"
                  className="w-full bg-[#fa8fb5] hover:bg-[#dd6d94]"
                >
                  {isLoading ? "Restableciendo..." : "Restablecer contraseña"}
                </Button>
              </div>

              <div className="text-center pt-4">
                <button
                  type="button"
                  onClick={() => navigate("/forgot-password")}
                  className="text-sm text-gray-600 hover:text-gray-800 hover:underline transition-colors"
                  disabled={isLoading}
                >
                  Solicitar nuevo enlace
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
