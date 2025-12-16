

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import ReactMarkdown from "react-markdown";
import termsText from "@/assets/legal/terms";
import { CancerRibbon } from "@/components/CancerRibbon";
import LogoUniversidad from "../assets/logo_ucn.svg?react";
import {
  validateRegistrationForm,
  formatRUT
} from "@/common/helpers/ValidateForm";
import type {
  FieldErrors
} from "@/common/helpers/ValidateForm";
import type { RegisterFormData, UserRole } from "@/types/medical";

export function RegisterScreen() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<RegisterFormData>({
    name: "",
    email: "",
    rut:"",
    password: "",
    confirmPassword: "",
    role: "patient"
  });
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    // Format RUT automatically as user types
    const processedValue = field === 'rut' ? formatRUT(value) : value;
    
    setFormData(prev => ({ ...prev, [field]: processedValue }));
    
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
    
    // Clear general error when user modifies form
    if (fieldErrors.general) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.general;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Clear previous messages
    setSuccessMessage('');
    setFieldErrors({});

    // Check terms acceptance for patients
    if (formData.role === "patient" && !acceptedTerms) {
      setFieldErrors({
        general: "Debes aceptar los Términos y Condiciones para registrarte.",
      });
      return;
    }

    // Validate form
    const { isValid, errors } = validateRegistrationForm(formData);
    
    if (!isValid) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    
    try {
      // Call API for registration
      await registerUser({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        rut: formData.rut,
        password: formData.password,
        role: formData.role
      });
      
      // Show success message
      setSuccessMessage('¡Cuenta creada exitosamente! Redirigiendo al dashboard...');
      
      // Wait 2 seconds then navigate to appropriate dashboard
      setTimeout(() => {
        // AuthContext already logs in automatically after registration
        // The user object is already set, so we can navigate
        navigate('/'); // Will be redirected to dashboard by ProtectedRoute
      }, 2000);
      
    } catch (err: any) {
      // Handle specific errors from backend
      if (err.response) {
        const status = err.response.status;
        const message = err.response.data?.message;
        const errorData = err.response.data;

        if (status === 409 || message?.includes('already exists') || message?.includes('duplicate')) {
          // User already exists
          if (message?.includes('email')) {
            setFieldErrors({ email: 'Este correo ya está registrado. ¿Quieres iniciar sesión?' });
          } else if (message?.includes('RUT') || message?.includes('rut')) {
            setFieldErrors({ rut: 'Este RUT ya está registrado en el sistema.' });
          } else {
            setFieldErrors({ general: 'Este usuario ya existe. Por favor inicia sesión o usa otros datos.' });
          }
        } else if (status === 400) {
          // Validation error from backend
          if (errorData?.errors && Array.isArray(errorData.errors)) {
            // Map backend validation errors to form fields
            const backendErrors: FieldErrors = {};
            errorData.errors.forEach((error: any) => {
              if (error.field) {
                backendErrors[error.field] = error.message;
              }
            });
            setFieldErrors(backendErrors);
          } else {
            setFieldErrors({ general: message || 'Datos inválidos. Por favor verifica el formulario.' });
          }
        } else if (status === 500) {
          setFieldErrors({ general: 'Error en el servidor. Por favor intenta más tarde.' });
        } else {
          setFieldErrors({ general: message || 'Error al crear la cuenta. Por favor intenta nuevamente.' });
        }
      } else if (err.request) {
        // Network error - no response from server
        setFieldErrors({ general: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.' });
      } else {
        // Other errors
        setFieldErrors({ general: err.message || 'Error inesperado. Por favor intenta nuevamente.' });
      }
    } finally {
      setIsLoading(false);
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
              Ficha Médica Portátil
            </h1>
            <p className="text-sm text-gray-600 text-center">
              Universidad Católica del Norte
            </p>
          </div>
        </div>

        {/* REGISTER FORM */}
        <Card>
          <CardHeader className="flex items-center justify-center">
            <CardTitle>Crear Cuenta</CardTitle>
            <CardDescription>Únete a nuestra plataforma médica.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Field */}
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Ingresa tu nombre"
                className={fieldErrors.name ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {fieldErrors.name && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.name}</p>
              )}
            </div>

            {/* RUT Field */}
            <div>
              <Label htmlFor="rut">RUT</Label>
              <Input
                id="rut"
                type="text"
                value={formData.rut}
                onChange={(e) => handleInputChange("rut", e.target.value)}
                placeholder="12.345.678-9"
                className={fieldErrors.rut ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {fieldErrors.rut && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.rut}</p>
              )}
            </div>

            {/* Email Field */}
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="ejemplo@correo.com"
                className={fieldErrors.email ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {fieldErrors.email && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.email}</p>
              )}
            </div>

            {/* Role Field */}
            <div>
              <Label htmlFor="role">Tipo de usuario</Label>
              <select
                id="role"
                value={formData.role}
                onChange={(e) => handleInputChange("role", e.target.value as UserRole)}
                className={`w-full px-3 py-2 border rounded-md ${
                  fieldErrors.role ? "border-red-500" : "border-gray-300"
                }`}
                disabled={isLoading}
              >
                <option value="patient">Paciente</option>
                <option value="doctor">Médico/a</option>
                <option value="nurse">Enfermera/o</option>
                <option value="guardian">Cuidador/a</option>
              </select>
              {fieldErrors.role && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.role}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                placeholder="Mínimo 6 caracteres"
                className={fieldErrors.password ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {fieldErrors.password && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.password}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                placeholder="Repite tu contraseña"
                className={fieldErrors.confirmPassword ? "border-red-500" : ""}
                disabled={isLoading}
              />
              {fieldErrors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{fieldErrors.confirmPassword}</p>
              )}
            </div>

            {/* General Error */}
            {fieldErrors.general && (
              <Alert className="bg-red-50 border-red-200">
                <AlertDescription className="text-red-800 text-sm">
                  ⚠️ {fieldErrors.general}
                </AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {successMessage && (
              <Alert className="bg-green-50 border-green-200">
                <AlertDescription className="text-green-800 text-sm">
                  ✅ {successMessage}
                </AlertDescription>
              </Alert>
            )}

            {/* Terms and Conditions Checkbox - Only for patients */}
            {formData.role === "patient" && (
              <div className="flex items-center gap-3 mt-3">
                <Checkbox
                  id="terms"
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                />
                <label htmlFor="terms" className="text-sm text-gray-700 flex-1">
                  Acepto los{" "}
                  <button
                    type="button"
                    onClick={() => setShowTerms(true)}
                    className="text-blue-600 font-semibold hover:underline"
                  >
                    Términos y Condiciones
                  </button>{" "}
                  y la{" "}
                  <span className="text-blue-600 font-semibold">Política de Privacidad</span>
                </label>
              </div>
            )}

            {/* Terms Modal */}
            <Dialog open={showTerms} onOpenChange={setShowTerms}>
              <DialogContent className="max-w-lg max-h-[85vh] flex flex-col p-0">
                <DialogHeader className="p-6 pb-0">
                  <DialogTitle className="text-center text-lg font-bold">
                    Términos y Condiciones
                  </DialogTitle>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: "60vh" }}>
                  <div className="prose prose-sm prose-gray">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => <h1 className="text-xl font-bold mb-2">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mt-4 mb-2">{children}</h2>,
                        p: ({ children }) => <p className="text-sm text-gray-700 leading-relaxed mb-2">{children}</p>,
                        ul: ({ children }) => <ul className="list-disc ml-4 text-sm text-gray-700">{children}</ul>,
                        li: ({ children }) => <li className="mb-1">{children}</li>,
                        strong: ({ children }) => <strong className="font-bold">{children}</strong>,
                      }}
                    >
                      {termsText}
                    </ReactMarkdown>
                  </div>
                </div>
                <DialogFooter className="flex flex-row gap-3 p-6 pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setShowTerms(false)}
                    className="flex-1"
                  >
                    Cerrar
                  </Button>
                  <Button
                    onClick={() => {
                      setAcceptedTerms(true);
                      setShowTerms(false);
                    }}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Aceptar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="outline"
                className={`w-full bg-[#fa8fb5] hover:bg-[#dd6d94] ${
                  (isLoading || (formData.role === "patient" && !acceptedTerms)) ? "opacity-60" : ""
                }`}
                disabled={isLoading || (formData.role === "patient" && !acceptedTerms)}
              >
                {isLoading ? "Creando cuenta..." : "Registrarse"}
              </Button>

              {/* Login Link */}
              <div className="text-center pt-4">
                <p className="text-sm text-gray-600">
                  ¿Ya tienes cuenta?{" "}
                  <button
                    type="button"
                    onClick={() => navigate("/")}
                    className="text-[#fa8fb5] hover:text-[#dd6d94] font-medium hover:underline transition-colors"
                    disabled={isLoading}
                  >
                    Inicia sesión
                  </button>
                </p>
              </div>
            </form>
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